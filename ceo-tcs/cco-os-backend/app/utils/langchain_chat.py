"""Fast Gemini chat — singleton client, conditional search, function calling, streaming, anti-truncation.

Optimization stack:
- Singleton client (no cold start)
- Conditional Google Search (only when prompt needs fresh web facts)
- Function calling: lookup_account_intelligence tool for ABM account data
- Generous max_tokens for chat (8192) — prevents truncation
- Auto-continue when finish_reason == MAX_TOKENS so user never sees cut-off
- Low history cap (4 turns)
- Streaming generator for first-token-fast SSE
"""
import json
import logging
import re
import time
from google import genai
from google.genai import types
from app.config import settings
from app.database import SessionLocal
from app.models.abm import ABMAccountDetail, ABMInitiativeDetail

logger = logging.getLogger(__name__)

_CLIENT = None

# Token caps — high enough to never truncate normal CCO answers
# (comparisons, multi-section replies, bullet lists, tables).
# If MAX_TOKENS still hits, we auto-continue once.
NONSEARCH_MAX_TOKENS = 8192
SEARCH_MAX_TOKENS = 8192
CONTINUE_MAX_TOKENS = 4096


def _client():
    global _CLIENT
    if _CLIENT is None:
        if settings.GOOGLE_CLOUD_PROJECT:
            _CLIENT = genai.Client(
                vertexai=True,
                project=settings.GOOGLE_CLOUD_PROJECT,
                location=settings.GCP_LOCATION,
            )
            logger.info(f"Gemini preloaded — model={settings.GEMINI_CHAT_MODEL}")
        else:
            _CLIENT = genai.Client()
    return _CLIENT


try:
    _client()
except Exception as e:
    logger.error(f"Gemini preload failed: {e}")



_ACCOUNT_LOOKUP_DECL = types.FunctionDeclaration(
    name="lookup_account_intelligence",
    description="Look up detailed ABM account intelligence for a specific UPS customer account. Returns root cause analysis, signals, analog account playbook, recommended plays, marketing ROI, lever recommendations, and related initiative history. Use this when the user asks about a specific account's performance, trend reversal, gap, recommended actions, or initiative history.",
    parameters=types.Schema(
        type="OBJECT",
        properties={
            "account_name": types.Schema(
                type="STRING",
                description="The account name to look up (e.g. 'Ford', 'Tesla', 'AutoZone', 'Stellantis', 'Honda')",
            ),
        },
        required=["account_name"],
    ),
)


def _execute_account_lookup(account_name: str) -> str:
    """Query DB for ABM account details + related initiatives. Fuzzy matches on name."""
    db = SessionLocal()
    try:
        search = f"%{account_name}%"
        acct = db.query(ABMAccountDetail).filter(ABMAccountDetail.name.ilike(search)).first()
        if not acct:
            acct = db.query(ABMAccountDetail).filter(ABMAccountDetail.account_id.ilike(search)).first()
        if not acct:
            return f"No account found matching '{account_name}'. Available accounts: Ford Motor Company, Stellantis North America, Tesla Inc., Honda North America, AutoZone."

        analog = acct.analog or {}
        lift = acct.recommended_lift or {}
        mktg = acct.marketing or {}
        signals_str = "\n".join(f"  - [{s.get('weight','').upper()}] {s.get('type','')}: {s.get('title','')}" for s in (acct.signals or []))
        channels_str = "\n".join(f"  - {c.get('name','')}: ${c.get('spend',0):.2f}M spend, {c.get('roi',0)}x ROI, {c.get('status','')}" for c in mktg.get("channels", []))
        bullets_str = "\n".join(f"  {i+1}. {b}" for i, b in enumerate(acct.play_bullets or []))

        as_is = acct.as_is or {}
        rec = acct.recommended or {}
        lever_changes = []
        for k in rec:
            old = as_is.get(k)
            new = rec.get(k)
            if old is not None and new is not None and old != new:
                lever_changes.append(f"  - {k}: {old} → {new}")
        levers_str = "\n".join(lever_changes)

        result = f"""ACCOUNT: {acct.name} ({acct.account_id})
Tier: {acct.tier} | Sub-vertical: {acct.subvertical} | ABM Tier: {acct.abm_tier}
Plan Revenue: ${acct.plan_rev}M | Actual Revenue: ${acct.actual_rev}M
Gap: ${acct.gap}M ({acct.gap_pct:+.1f}%) | Headroom: ${acct.headroom}M | SoW: {acct.sow}%
Quarters Declining: {acct.quarters_declining}

ROOT CAUSE:
{acct.root_cause}

SIGNALS:
{signals_str}

ANALOG ACCOUNT: {analog.get('name', 'N/A')}
  Traits: {analog.get('traits', '')}
  What UPS did: {analog.get('behavior', '')}
  Why it resonates: {analog.get('whyResonates', '')}
  Outcome: {analog.get('outcomeLift', '')} over {analog.get('outcomeQuarters', '')} quarters

MARKETING:
  Annual ABM Spend: ${mktg.get('annualSpend', 0)}M | High-touch mix: {mktg.get('mixHighTouchPct', 0)}%
  Blended ROI: {mktg.get('blendedROI', 0)}x vs benchmark {mktg.get('benchmarkROI', 0)}x
  Channels:
{channels_str}

RECOMMENDED LEVER CHANGES (As-Is → Recommended):
{levers_str}

RECOMMENDED LIFT:
  Revenue: +${lift.get('rev', 0)}M | Win Rate: +{lift.get('winRate', 0)}pp | Cycle: {lift.get('cycle', 0)} days
  Marketing Delta: +${lift.get('marketingDelta', 0)}M | Confidence: {lift.get('confidence', '')}

RECOMMENDED PLAYS:
{bullets_str}"""

        # Related initiatives
        initiatives = db.query(ABMInitiativeDetail).filter(
            ABMInitiativeDetail.account.ilike(f"%{analog.get('name', 'NOMATCH')}%") |
            ABMInitiativeDetail.account.ilike(search)
        ).all()
        if initiatives:
            ini_parts = []
            for ini in initiatives:
                ini_parts.append(f"""  [{ini.initiative_id}] {ini.name} — {ini.account}
    Status: {ini.status} ({ini.stage}) | Owner: {ini.owner}
    Modeled: +${ini.modeled_rev}M → Actual: +${ini.actual_rev}M | Win rate: {ini.modeled_win_rate}pp → {ini.actual_win_rate}pp
    What worked: {ini.what_worked}
    What didn't: {ini.what_didnt_work}
    Lesson: {ini.lesson_learned}""")
            result += "\n\nRELATED INITIATIVES:\n" + "\n".join(ini_parts)

        return result
    finally:
        db.close()


def _needs_search(message: str, force: bool = False) -> bool:
    return True


def _was_truncated(response) -> bool:
    """Returns True if model stopped due to hitting max_output_tokens."""
    try:
        if not response or not response.candidates:
            return False
        fr = getattr(response.candidates[0], "finish_reason", None)
        # finish_reason may be enum or string depending on SDK version
        if fr is None:
            return False
        s = str(fr).upper()
        return "MAX_TOKENS" in s or "LENGTH" in s
    except Exception:
        return False


def _extract_text(response):
    text = ""
    if response and response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
        for part in response.candidates[0].content.parts:
            if getattr(part, "text", None):
                text += part.text
    if not text and getattr(response, "text", None):
        text = response.text
    return text


def _has_function_call(response):
    """Check if response contains a function call part."""
    try:
        if response and response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if getattr(part, "function_call", None):
                    return True
    except Exception:
        pass
    return False


def _extract_function_calls(response):
    """Extract function call parts from response."""
    calls = []
    try:
        if response and response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if getattr(part, "function_call", None):
                    calls.append(part.function_call)
    except Exception:
        pass
    return calls


def _execute_tool(fn_call):
    """Execute a function call and return the result string."""
    name = fn_call.name
    args = dict(fn_call.args) if fn_call.args else {}
    if name == "lookup_account_intelligence":
        account_name = args.get("account_name", "")
        logger.info(f"Tool call: lookup_account_intelligence('{account_name}')")
        return _execute_account_lookup(account_name)
    return f"Unknown tool: {name}"


_FC_TOOLS = [types.Tool(function_declarations=[_ACCOUNT_LOOKUP_DECL])]
_SEARCH_TOOLS = [types.Tool(google_search=types.GoogleSearch())]


def langchain_chat(system_prompt: str, message: str, history: list = None, force_search: bool = False) -> str:
    """Sync chat — used by /api/chat. For streaming, use stream_chat()."""
    t0 = time.time()

    contents = []
    if history:
        for msg in history[-10:]:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["text"]}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    use_search = True  # LLM decides autonomously when to use Google Search
    max_tokens = SEARCH_MAX_TOKENS

    # Phase 1: function-calling with account lookup tool (no google search — they can't coexist)
    fc_config_kwargs = {
        "temperature": settings.GEMINI_TEMPERATURE,
        "max_output_tokens": max_tokens,
        "tools": _FC_TOOLS,
    }
    if system_prompt:
        fc_config_kwargs["system_instruction"] = system_prompt
    fc_config = types.GenerateContentConfig(**fc_config_kwargs)

    tool_rounds = 0
    response = None
    for tool_round in range(3):
        try:
            response = _client().models.generate_content(
                model=settings.GEMINI_CHAT_MODEL,
                contents=contents,
                config=fc_config,
            )
        except Exception as e:
            logger.error(f"Gemini chat failed: {repr(e)}")
            return "LLM error. Try again."

        if not _has_function_call(response):
            break

        fn_calls = _extract_function_calls(response)
        contents.append(response.candidates[0].content)
        fn_response_parts = []
        for fc in fn_calls:
            result = _execute_tool(fc)
            fn_response_parts.append(types.Part.from_function_response(
                name=fc.name,
                response={"result": result},
            ))
        contents.append(types.Content(role="user", parts=fn_response_parts))
        tool_rounds = tool_round + 1
        logger.info(f"Tool round {tool_rounds}: executed {len(fn_calls)} function call(s)")

    # Phase 2: if search needed, re-generate with google search grounding (no function decls)
    if use_search and tool_rounds > 0:
        search_config_kwargs = {
            "temperature": settings.GEMINI_TEMPERATURE,
            "max_output_tokens": max_tokens,
            "tools": _SEARCH_TOOLS,
        }
        if system_prompt:
            search_config_kwargs["system_instruction"] = system_prompt
        search_config = types.GenerateContentConfig(**search_config_kwargs)
        # Flatten tool results into a user message so search call has the context
        tool_context = _extract_text(response)
        if tool_context:
            contents.append({"role": "model", "parts": [{"text": tool_context}]})
            contents.append({"role": "user", "parts": [{"text": "Now enhance your answer with any relevant real-time web data. Keep the account-specific details you already have."}]})
        try:
            response = _client().models.generate_content(
                model=settings.GEMINI_CHAT_MODEL,
                contents=contents,
                config=search_config,
            )
        except Exception as e:
            logger.warning(f"Search enhancement failed, using tool-only response: {repr(e)}")
    elif use_search and tool_rounds == 0:
        # No tool calls made — use search directly
        search_config_kwargs = {
            "temperature": settings.GEMINI_TEMPERATURE,
            "max_output_tokens": max_tokens,
            "tools": _SEARCH_TOOLS,
        }
        if system_prompt:
            search_config_kwargs["system_instruction"] = system_prompt
        search_config = types.GenerateContentConfig(**search_config_kwargs)
        try:
            response = _client().models.generate_content(
                model=settings.GEMINI_CHAT_MODEL,
                contents=contents,
                config=search_config,
            )
        except Exception as e:
            logger.warning(f"Search call failed, using FC response: {repr(e)}")

    raw_text = _extract_text(response)

    # Auto-continue if truncated
    if _was_truncated(response) and raw_text:
        logger.info("Response truncated (MAX_TOKENS) — auto-continuing")
        cont_contents = list(contents)
        cont_contents.append({"role": "model", "parts": [{"text": raw_text}]})
        cont_contents.append({"role": "user", "parts": [{"text": "Continue from exactly where you stopped. Do not repeat what you already said. Finish the answer."}]})
        cont_config = types.GenerateContentConfig(
            temperature=settings.GEMINI_TEMPERATURE,
            max_output_tokens=CONTINUE_MAX_TOKENS,
            system_instruction=system_prompt if system_prompt else None,
        )
        try:
            cont_response = _client().models.generate_content(
                model=settings.GEMINI_CHAT_MODEL,
                contents=cont_contents,
                config=cont_config,
            )
            cont_text = _extract_text(cont_response)
            if cont_text:
                raw_text = raw_text.rstrip() + " " + cont_text.lstrip()
        except Exception as e:
            logger.error(f"Continuation call failed: {repr(e)}")

    # Grounding sources
    sources = []
    try:
        if use_search and response and response.candidates and getattr(response.candidates[0], "grounding_metadata", None):
            md = response.candidates[0].grounding_metadata
            if getattr(md, "grounding_chunks", None):
                for chunk in md.grounding_chunks:
                    if getattr(chunk, "web", None) and chunk.web.uri:
                        sources.append({"url": chunk.web.uri, "title": getattr(chunk.web, "title", "")})
    except Exception:
        pass

    if sources:
        unique = {s["url"]: s for s in sources}
        top = list(unique.values())[:3]
        raw_text += "\n\n**Sources:**\n" + "\n".join(f"- [{s['title'] or s['url']}]({s['url']})" for s in top)

    elapsed = time.time() - t0
    logger.info(f"Chat done in {elapsed:.2f}s — search={use_search}, tool_rounds={tool_rounds}, sources={len(sources)}, chars={len(raw_text)}")
    return raw_text or "No response."


def stream_chat(system_prompt: str, message: str, history: list = None, force_search: bool = False, model: str = None, skip_tools: bool = False):
    """Streaming generator — yields text chunks as they arrive.

    Phase 1: function-calling loop (non-streaming, function_declarations only).
    Phase 2: final streaming response (with google_search if needed, no function_declarations).
    They can't coexist in the same tools list.
    skip_tools=True bypasses Phase 1 and search — direct streaming only.
    """
    t0 = time.time()
    _model = model or settings.GEMINI_CHAT_MODEL

    contents = []
    if history:
        for msg in history[-10:]:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["text"]}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    use_search = not skip_tools
    max_tokens = SEARCH_MAX_TOKENS

    if not skip_tools:
        # Phase 1: function-calling (non-streaming, FC tools only)
        fc_config_kwargs = {
            "temperature": settings.GEMINI_TEMPERATURE,
            "max_output_tokens": max_tokens,
            "tools": _FC_TOOLS,
        }
        if system_prompt:
            fc_config_kwargs["system_instruction"] = system_prompt
        fc_config = types.GenerateContentConfig(**fc_config_kwargs)

        tool_rounds = 0
        for tool_round in range(3):
            probe_response = None
            for _retry in range(4):
                try:
                    probe_response = _client().models.generate_content(
                        model=_model,
                        contents=contents,
                        config=fc_config,
                    )
                    break
                except Exception as e:
                    if "429" in str(e) and _retry < 3:
                        wait = 2 ** _retry
                        logger.warning(f"Stream probe 429 — retry {_retry+1}/3 in {wait}s")
                        time.sleep(wait)
                    else:
                        logger.error(f"Stream probe failed: {repr(e)}")
                        yield f"\n[Stream error: {e}]"
                        return
            if probe_response is None:
                yield "\n[Unable to get response — please try again.]"
                return

            if not _has_function_call(probe_response):
                break

            fn_calls = _extract_function_calls(probe_response)
            contents.append(probe_response.candidates[0].content)
            fn_response_parts = []
            for fc in fn_calls:
                result = _execute_tool(fc)
                fn_response_parts.append(types.Part.from_function_response(
                    name=fc.name,
                    response={"result": result},
                ))
            contents.append(types.Content(role="user", parts=fn_response_parts))
            tool_rounds = tool_round + 1
            logger.info(f"Stream tool round {tool_rounds}: executed {len(fn_calls)} function call(s)")

    # Phase 2: final streaming — use search tools if needed, otherwise no tools
    stream_config_kwargs = {
        "temperature": settings.GEMINI_TEMPERATURE,
        "max_output_tokens": max_tokens,
    }
    if system_prompt:
        stream_config_kwargs["system_instruction"] = system_prompt
    if use_search:
        stream_config_kwargs["tools"] = _SEARCH_TOOLS
    stream_config = types.GenerateContentConfig(**stream_config_kwargs)

    accumulated = ""
    last_finish_reason = None

    stream_ok = False
    for _retry in range(4):
        try:
            first_token_logged = False
            for chunk in _client().models.generate_content_stream(
                model=_model,
                contents=contents,
                config=stream_config,
            ):
                if not first_token_logged:
                    logger.info(f"First token in {time.time()-t0:.2f}s (search={use_search})")
                    first_token_logged = True
                if chunk.text:
                    accumulated += chunk.text
                    yield chunk.text
                try:
                    if chunk.candidates and getattr(chunk.candidates[0], "finish_reason", None):
                        last_finish_reason = str(chunk.candidates[0].finish_reason).upper()
                except Exception:
                    pass
            logger.info(f"Stream complete in {time.time()-t0:.2f}s — finish={last_finish_reason}")
            stream_ok = True
            break
        except Exception as e:
            if "429" in str(e) and _retry < 3:
                wait = 2 ** _retry
                logger.warning(f"Stream 429 — retry {_retry+1}/3 in {wait}s")
                time.sleep(wait)
            else:
                logger.error(f"Stream failed: {repr(e)}")
                yield "\n\nI'm temporarily unable to process this request. Please try again in a moment."
                return
    if not stream_ok:
        yield "\n\nI'm temporarily unable to process this request. Please try again in a moment."
        return

    # Auto-continue if truncated
    if last_finish_reason and ("MAX_TOKENS" in last_finish_reason or "LENGTH" in last_finish_reason) and accumulated:
        logger.info("Stream truncated — auto-continuing")
        cont_contents = list(contents)
        cont_contents.append({"role": "model", "parts": [{"text": accumulated}]})
        cont_contents.append({"role": "user", "parts": [{"text": "Continue from exactly where you stopped. Do not repeat anything. Finish the answer."}]})
        cont_config = types.GenerateContentConfig(
            temperature=settings.GEMINI_TEMPERATURE,
            max_output_tokens=CONTINUE_MAX_TOKENS,
            system_instruction=system_prompt if system_prompt else None,
        )
        yield " "
        for _retry in range(4):
            try:
                for chunk in _client().models.generate_content_stream(
                    model=_model,
                    contents=cont_contents,
                    config=cont_config,
                ):
                    if chunk.text:
                        yield chunk.text
                logger.info(f"Continuation stream complete in {time.time()-t0:.2f}s")
                break
            except Exception as e:
                if "429" in str(e) and _retry < 3:
                    wait = 2 ** _retry
                    logger.warning(f"Continuation 429 — retry {_retry+1}/3 in {wait}s")
                    time.sleep(wait)
                else:
                    logger.error(f"Continuation stream failed: {repr(e)}")
                    break
