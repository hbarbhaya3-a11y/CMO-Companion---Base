"""SLM chat via llama-server (llama.cpp) OpenAI-compatible endpoint.

The SLM runs on a remote GPU VM behind `llama-server`, which exposes
`POST /v1/chat/completions` (same schema as OpenAI). We proxy to it here so
the API key stays server-side. No Google Search / function-calling — plain
chat completion with streaming SSE. The Gemini-style system prompt (options /
quick_replies / sources tags) is reused unchanged; the frontend parses those
tags identically regardless of provider.

Config (see app/config.py):
- SLM_BASE_URL   e.g. http://<VM_IP>:8080
- SLM_API_KEY    bearer token llama-server was started with (--api-key)
- SLM_MODEL      model id llama-server reports (usually anything, ignored)
- SLM_TEMPERATURE / SLM_MAX_TOKENS
"""
import json
import logging
import time

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


def _url() -> str:
    return settings.SLM_BASE_URL.rstrip("/") + "/v1/chat/completions"


def _headers() -> dict:
    h = {"Content-Type": "application/json"}
    if settings.SLM_API_KEY:
        h["Authorization"] = f"Bearer {settings.SLM_API_KEY}"
    return h


def _build_messages(system_prompt: str, message: str, history: list = None) -> list:
    msgs = []
    if system_prompt:
        msgs.append({"role": "system", "content": system_prompt})
    if history:
        for m in history[-10:]:
            role = "user" if m["role"] == "user" else "assistant"
            msgs.append({"role": role, "content": m["text"]})
    msgs.append({"role": "user", "content": message})
    return msgs


def _payload(system_prompt: str, message: str, history: list, stream: bool) -> dict:
    return {
        "model": settings.SLM_MODEL,
        "messages": _build_messages(system_prompt, message, history),
        "temperature": settings.SLM_TEMPERATURE,
        "max_tokens": settings.SLM_MAX_TOKENS,
        "stream": stream,
    }


def slm_chat(system_prompt: str, message: str, history: list = None) -> str:
    """Sync (non-streaming) SLM chat — used by /api/chat."""
    t0 = time.time()
    try:
        with httpx.Client(timeout=180.0) as client:
            r = client.post(_url(), headers=_headers(),
                            json=_payload(system_prompt, message, history, stream=False))
            r.raise_for_status()
            data = r.json()
        text = (data.get("choices", [{}])[0].get("message", {}) or {}).get("content", "") or ""
        logger.info(f"SLM chat done in {time.time()-t0:.2f}s — chars={len(text)}")
        return text or "No response."
    except Exception as e:
        logger.error(f"SLM chat failed: {repr(e)}")
        return "SLM error — check the model server is reachable. Try again."


def stream_slm_chat(system_prompt: str, message: str, history: list = None):
    """Streaming generator — yields text chunks from llama-server SSE."""
    t0 = time.time()
    first = True
    try:
        with httpx.Client(timeout=None) as client:
            with client.stream("POST", _url(), headers=_headers(),
                               json=_payload(system_prompt, message, history, stream=True)) as r:
                r.raise_for_status()
                for line in r.iter_lines():
                    if not line or not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        obj = json.loads(data)
                        delta = (obj.get("choices", [{}])[0].get("delta", {}) or {}).get("content")
                    except Exception:
                        continue
                    if delta:
                        if first:
                            logger.info(f"SLM first token in {time.time()-t0:.2f}s")
                            first = False
                        yield delta
        logger.info(f"SLM stream complete in {time.time()-t0:.2f}s")
    except Exception as e:
        logger.error(f"SLM stream failed: {repr(e)}")
        yield "\n\nSLM is unreachable right now. Check the model server on the VM, then try again."
