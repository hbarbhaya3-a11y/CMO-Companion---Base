import os
import time
import logging
from google import genai
from google.genai import types
from app.config import settings

logger = logging.getLogger(__name__)

def _get_gemini_client():
    project_id = settings.GOOGLE_CLOUD_PROJECT
    location = settings.GCP_LOCATION
    
    # For local development without GOOGLE_CLOUD_PROJECT, we can use the regular genai client
    # but the user requested the vertexai client. 
    # If project_id is not set, we'll try initializing without vertexai for fallback, 
    # but the provided function raises a ValueError.
    if not project_id:
        logger.warning("GOOGLE_CLOUD_PROJECT not set in environment. Falling back to non-vertex client if GEMINI_API_KEY is available, or will raise error if vertex is strictly required.")
        # We will attempt to use standard API key if project_id is missing, to not break the app locally if user has GEMINI_API_KEY
        return genai.Client()
    
    return genai.Client(vertexai=True, project=project_id, location=location)


def _gemini_search_query(client, system_prompt: str, user_prompt: str, schema_model=None, max_retries=5) -> tuple[str, list]:
    """Call Gemini with Google Search grounding. Returns (raw_text, sources)."""
    kwargs = {
        "temperature": 0.3,
        "tools": [types.Tool(google_search=types.GoogleSearch())],
    }
    if system_prompt:
        kwargs["system_instruction"] = system_prompt

    if schema_model:
        kwargs["response_mime_type"] = "application/json"
        kwargs["response_schema"] = schema_model

    config = types.GenerateContentConfig(**kwargs)
    
    response = None
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_FAST_MODEL,
                contents=user_prompt,
                config=config,
            )
            break
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                wait_time = 2 ** attempt
                logger.warning(f"Gemini 429 Rate Limit hit in search_query. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.error(f"Gemini call failed after {attempt+1} attempts: {repr(e)}")
                return "", []

    raw_text = ""
    if response and response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
        for part in response.candidates[0].content.parts:
            if part.text:
                raw_text += part.text

    sources = []
    if response and response.candidates and response.candidates[0].grounding_metadata:
        metadata = response.candidates[0].grounding_metadata
        if getattr(metadata, "grounding_chunks", None):
            for chunk in metadata.grounding_chunks:
                if getattr(chunk, "web", None) and chunk.web.uri:
                    sources.append({"url": chunk.web.uri, "title": getattr(chunk.web, "title", "")})
    
    # Fallback to text if candidates parsing missed something
    if not raw_text and response and response.text:
        raw_text = response.text

    return raw_text, sources


def _gemini_generate(client, system_prompt: str, user_prompt: str, schema_model=None, max_retries=5, use_schema: bool = True, thinking_budget: int = 0) -> str:
    """Call Gemini WITHOUT search grounding (for module generation with enrichment context)."""
    kwargs = {
        "temperature": 0.5,
        "max_output_tokens": 8192,
    }
    
    if system_prompt:
        kwargs["system_instruction"] = system_prompt

    # Note: google-genai 0.3.0 might have different thinking_config syntax, using standard dictionary or the provided types
    if thinking_budget > 0:
        kwargs["thinking_config"] = {"thinking_budget": thinking_budget}

    if schema_model:
        kwargs["response_mime_type"] = "application/json"
        if use_schema:
            kwargs["response_schema"] = schema_model

    config = types.GenerateContentConfig(**kwargs)

    response = None
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_FAST_MODEL,
                contents=user_prompt,
                config=config,
            )
            break
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                wait_time = 2 ** attempt
                logger.warning(f"Gemini 429 Rate Limit hit in generate. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.error(f"Gemini generate failed after {attempt+1} attempts: {repr(e)}")
                return "{}"

    return response.text if response and response.text else "{}"
