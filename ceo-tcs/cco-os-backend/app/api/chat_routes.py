from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import logging
import json

from app.database import get_db
from app.schemas import domain as schemas
from app.models import domain as models
from app.models import enterprise as ent_models
from app.models import abm as abm_models
from app.models.abm import ABMAccountDetail
from app.models.chat import ChatSession, ChatMessageRecord
from app.utils.langchain_chat import langchain_chat, stream_chat
from app.utils.slm_chat import slm_chat, stream_slm_chat
from app.utils.context import build_full_context
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])


def _resolve_provider(req) -> str:
    """Pick LLM provider: request override, else configured default. Falls back to gemini."""
    p = (getattr(req, "provider", None) or settings.LLM_PROVIDER or "gemini").lower()
    return "slm" if p == "slm" else "gemini"


# One-shot format example. A small finetuned model copies structure from an example far
# better than it follows instructions — this grounds it in the injected data AND locks the
# markdown layout (bold sub-headers + bullets). Uses a fictional account so it can't leak
# into real answers. Injected as a prior turn ahead of the user's real question.
_SLM_FEWSHOT = [
    {"role": "user", "text": "FORMAT EXAMPLE (fictional account) — Summarize the Acme Corp situation"},
    {"role": "model", "text": (
        "**Acme Corp — the headline**\n"
        "Acme is a **Tier T-2** account at **$41M** spend with a **17% share-of-wallet** and a 28-day purchase cycle — a classic SMB distribution profile.\n\n"
        "**Why it matters**\n"
        "- Share-of-wallet at 17% leaves meaningful headroom versus tier peers.\n"
        "- The short 28-day cycle means pricing moves show up fast in revenue.\n\n"
        "**Recommended next move**\n"
        "- Account lead to run a share-of-wallet expansion play into Acme's adjacent lanes before quarter-end."
    )},
]


def _slm_system_prompt(cxo, firm, context_block: str, req) -> str:
    """Lean prompt for the small SLM. Keeps portfolio data + demands markdown/length,
    but drops the Gemini-only tag machinery (options / quick_replies / sources / search /
    function-calling) a 4B model can't juggle — that's what caused terse, unformatted replies."""
    prompt = f"""You are CXO Companion, an AI Chief of Staff for {cxo.name}, {cxo.title} at {firm.name}.

Answer the executive's question using ONLY the LIVE PORTFOLIO DATA below — never invent figures.

HOW TO ANSWER (match the format of the earlier Acme Corp example exactly):
- Be thorough — 3 to 5 short sections. Do not give one-line answers.
- Use Markdown: a **bold sub-header** for each section, `-` bullet points for lists, and **bold** for key numbers and account names.
- Be specific — name actual accounts and cite exact dollar figures and percentages FROM THE DATA.
- Lead with the direct answer, then support it with the data, then end with a concrete recommended next move (who / what / by when).
- Always finish your answer — never stop mid-sentence or mid-list.

LIVE PORTFOLIO DATA:
{context_block}"""
    if req.view_context:
        prompt += f"\n\nCURRENT VIEW: '{req.view_context}'"
    if req.section_context:
        prompt += f"\n\nCURRENT SECTION FOCUS:\n{req.section_context}\n\nThe user is most likely asking about this section."
    if req.signal_context:
        prompt += f"\n\nSIGNAL CONTEXT:\n{req.signal_context}"
    return prompt

def _build_context(db: Session, cxo_id: int) -> str:
    """Full portfolio context — delegates to shared builder."""
    return build_full_context(db, cxo_id)


@router.post("", response_model=schemas.ChatResponse)
def chat_with_agent(req: schemas.ChatRequest, db: Session = Depends(get_db)):
    cxo = db.query(models.CXO).filter(models.CXO.id == req.cxo_id).first()
    if not cxo:
        raise HTTPException(status_code=404, detail="CXO not found")

    firm = db.query(models.Firm).filter(models.Firm.id == cxo.firm_id).first()
    context_block = _build_context(db, cxo.id)

    system_prompt = f"""You are CXO Companion (CCO-OS), an AI Chief of Staff for {cxo.name}, {cxo.title} at {firm.name}.

RULES:
- Be specific — name accounts, cite numbers, propose concrete next moves
- No generic hedging or disclaimers — never say "I cannot determine" or "based on the data provided"
- You have Google Search available. Use it AUTONOMOUSLY when the query needs real-time or external data (competitor moves, stock prices, industry news, market trends, earnings). Maximum 2 searches per response. Do NOT search for data already in LIVE PORTFOLIO DATA below
- Combine INTERNAL portfolio data + EXTERNAL web research when needed for a complete answer
- Use 2-5 short paragraphs or tight bulleted lists, max ~600 words
- ALWAYS finish your response — never stop mid-sentence or mid-list. If you sense you're running long, condense remaining points into one closing bullet.
- Reference exact figures from the context below when relevant
- When recommending actions, be specific about who, what, and by when
- Use markdown formatting for emphasis and structure

TOOLS:
- You have a tool called `lookup_account_intelligence`. Use it when the user asks about a specific account's performance, trend reversal, gap analysis, root cause, recommended plays, analog account comparisons, marketing ROI, or initiative history. It returns rich diagnostic data including root cause analysis, signals, analog playbook, recommended lever changes, and historical initiative outcomes. ALWAYS call this tool before answering account-specific questions — do not guess or rely only on the summary data below.

INTERACTIVE UI:
- When suggesting 2-4 areas to explore or angles to investigate, wrap them in <options>[JSON]</options> tags.
  Format: [{{"id":"opt1","text":"Explore: topic area","description":"Why this angle matters"}}]
  Options are SUGGESTIONS for further conversation, NOT action items or approvals. Frame them as questions or topics to dig into (e.g. "Explore the pricing gap analysis", "Look at competitor timeline"), never as commands (e.g. "Execute the ABM ramp", "Authorize the spend").
  Use sparingly — only when there are genuinely different angles worth exploring.
- At the end of substantive responses, suggest 2-3 contextual follow-up questions using <quick_replies>[JSON]</quick_replies> tags.
  Format: [{{"id":"qr1","text":"Follow-up question text"}}]
  QUICK REPLY RULES — these are critical for guiding the executive:
  1. Every question MUST reference SPECIFIC data from the LIVE PORTFOLIO DATA — name actual accounts, cite real dollar figures, mention specific KPI values or deltas. Never generic.
  2. Questions should PROGRESSIVELY DEEPEN the analysis — move from "what happened" → "why" → "what's the impact" → "what if we change X"
  3. Structure as a funnel that naturally leads toward scenario thinking:
     - First response: Ask about root causes or comparisons using real data (e.g. "Ford's gap is −$28M while Stellantis is −$22M — is the root cause the same?")
     - Second response: Ask about impact and trade-offs (e.g. "If we shift $2M ABM budget from digital to executive engagement, what's the recovery timeline for these 5 accounts?")
     - Third response onwards: Ask "what-if" questions that set up simulation (e.g. "What happens to the $116M gap if we pre-lock NAAF capacity for Ford and Stellantis before August?")
  4. NEVER ask vague questions like "What is the plan?" or "How does this impact margins?" — always anchor to specific numbers and accounts from the data
  5. Only after AT LEAST 2 back-and-forth exchanges AND you've built substantial analytical depth, include as the LAST quick_reply:
     {{"id":"sim","text":"Simulate this in Decision Lab"}}
     Do NOT include this on your first or second response. The user should feel the conversation has naturally reached a point where modeling the scenario is the logical next step.
- Do NOT use options or quick_replies for simple factual answers or when the user asked a direct yes/no question.
- Do NOT wrap the JSON in markdown code blocks — output raw JSON inside the tags.
- ALWAYS ensure the JSON is complete and valid before closing the tag.

EXPLAINABILITY — Sources & Reasoning:
- ALWAYS end your response with a <sources> tag showing what data you used and how you reasoned.
  Format: <sources>{{"data_used":[{{"source":"name","detail":"specific data point","confidence":"high|medium|low"}}],"reasoning":"1-2 sentences connecting the dots"}}</sources>
  - "source" = data source name (e.g. "Portfolio KPI: Revenue Gap", "Account Intel: Ford", "Google Search", "ABM Signal: Stellantis", "Market Intelligence")
  - "detail" = the specific number, fact, or data point you used from that source
  - "confidence" MUST follow these rules EXACTLY:
    * "high" = INTERNAL — data that comes from the LIVE PORTFOLIO DATA section below (account KPIs, signals, pipeline, margins, ABM data)
    * "medium" = EXTERNAL — ANY data from Google Search, websites, stock tickers (Marketbeat, Yahoo Finance, Investing.com), news articles, competitor earnings, press releases, or ANY web source
    * "low" = inferred/estimated — your own calculations or assumptions
  - MANDATORY: If the source name contains "Google", "Search", "Marketbeat", "Yahoo", "Investing.com", "Reuters", "Bloomberg", or any website name, confidence MUST be "medium" (EXTERNAL). NEVER mark web/search data as "high".
  - "reasoning" = brief chain explaining how you connected these data points to reach your conclusion
  - Include 2-5 sources — cover the key data points that drove your answer
  - Place <sources> AFTER all text, options, and quick_replies — it must be the LAST tag in your response
  - Do NOT wrap in markdown code blocks — output raw JSON inside the tags

LIVE PORTFOLIO DATA:
{context_block}"""

    if req.view_context:
        system_prompt += f"\n\nCURRENT VIEW: User is on the '{req.view_context}' page."
    if req.section_context:
        system_prompt += f"\n\nCURRENT SECTION FOCUS:\n{req.section_context}\n\nThe user's question is most likely about this section — prioritize this context in your answer."
    if req.signal_context:
        system_prompt += f"\n\nSIGNAL INVESTIGATION CONTEXT:\n{req.signal_context}"

    history = None
    if req.history:
        history = [{"role": msg.role, "text": msg.text} for msg in req.history]

    # Resolve or create session
    session_id = req.session_id
    if session_id:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            session = ChatSession(cxo_id=req.cxo_id, title=req.message[:50])
            db.add(session)
            db.commit()
            db.refresh(session)
            session_id = session.id
    else:
        session = ChatSession(cxo_id=req.cxo_id, title=req.message[:50])
        db.add(session)
        db.commit()
        db.refresh(session)
        session_id = session.id

    # Save user message
    db.add(ChatMessageRecord(session_id=session_id, role="user", text=req.message))
    db.commit()

    provider = _resolve_provider(req)
    try:
        if provider == "slm":
            reply = slm_chat(system_prompt=_slm_system_prompt(cxo, firm, context_block, req),
                             message=req.message, history=_SLM_FEWSHOT + (history or []))
        else:
            reply = langchain_chat(
                system_prompt=system_prompt,
                message=req.message,
                history=history,
            )
        # Save agent reply
        db.add(ChatMessageRecord(session_id=session_id, role="agent", text=reply))
        db.commit()
        return schemas.ChatResponse(reply=reply, session_id=session_id)
    except Exception as e:
        logger.error(f"Chat error: {repr(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
def chat_stream(req: schemas.ChatRequest, db: Session = Depends(get_db)):
    """Streaming chat endpoint — SSE delivery for first-token-fast UX."""
    cxo = db.query(models.CXO).filter(models.CXO.id == req.cxo_id).first()
    if not cxo:
        raise HTTPException(status_code=404, detail="CXO not found")
    firm = db.query(models.Firm).filter(models.Firm.id == cxo.firm_id).first()
    context_block = _build_context(db, cxo.id)

    system_prompt = f"""You are CXO Companion (CCO-OS), an AI Chief of Staff for {cxo.name}, {cxo.title} at {firm.name}.

RULES:
- Be specific — name accounts, cite numbers, propose concrete next moves
- No hedging or disclaimers — never say "I cannot determine" or "based on the data provided"
- You have Google Search available. Use it AUTONOMOUSLY when query needs real-time or external data (competitor moves, stock prices, industry news, market trends, earnings). Maximum 2 searches per response. Do NOT search for data already in LIVE PORTFOLIO DATA
- Combine INTERNAL portfolio data + EXTERNAL web research when needed
- 2-5 short paragraphs or tight bullet lists. Be thorough but not verbose — every sentence should add value
- ALWAYS finish your response — never stop mid-sentence or mid-list
- Use markdown for emphasis and structure
- Lead with the answer, then support with data. No preamble

TOOLS:
- You have `lookup_account_intelligence` — call it when the user asks about a specific account's performance, trend, root cause, recommended plays, or initiative history. ALWAYS call this tool before answering account-specific questions.

INTERACTIVE UI:
- When suggesting 2-4 areas to explore or angles to investigate, wrap them in <options>[JSON]</options> tags.
  Format: [{{"id":"opt1","text":"Explore: topic area","description":"Why this angle matters"}}]
  Options are SUGGESTIONS for further conversation, NOT action items or approvals. Frame them as questions or topics to dig into (e.g. "Explore the pricing gap analysis", "Look at competitor timeline"), never as commands (e.g. "Execute the ABM ramp", "Authorize the spend").
  Use sparingly — only when there are genuinely different angles worth exploring.
- At the end of substantive responses, suggest 2-3 contextual follow-up questions using <quick_replies>[JSON]</quick_replies> tags.
  Format: [{{"id":"qr1","text":"Follow-up question text"}}]
  QUICK REPLY RULES — these are critical for guiding the executive:
  1. Every question MUST reference SPECIFIC data from the LIVE PORTFOLIO DATA — name actual accounts, cite real dollar figures, mention specific KPI values or deltas. Never generic.
  2. Questions should PROGRESSIVELY DEEPEN the analysis — move from "what happened" → "why" → "what's the impact" → "what if we change X"
  3. Structure as a funnel that naturally leads toward scenario thinking:
     - First response: Ask about root causes or comparisons using real data (e.g. "Ford's gap is −$28M while Stellantis is −$22M — is the root cause the same?")
     - Second response: Ask about impact and trade-offs (e.g. "If we shift $2M ABM budget from digital to executive engagement, what's the recovery timeline for these 5 accounts?")
     - Third response onwards: Ask "what-if" questions that set up simulation (e.g. "What happens to the $116M gap if we pre-lock NAAF capacity for Ford and Stellantis before August?")
  4. NEVER ask vague questions like "What is the plan?" or "How does this impact margins?" — always anchor to specific numbers and accounts from the data
  5. Only after AT LEAST 2 back-and-forth exchanges AND you've built substantial analytical depth, include as the LAST quick_reply:
     {{"id":"sim","text":"Simulate this in Decision Lab"}}
     Do NOT include this on your first or second response. The user should feel the conversation has naturally reached a point where modeling the scenario is the logical next step.
- Do NOT use options or quick_replies for simple factual answers or when the user asked a direct yes/no question.
- Do NOT wrap the JSON in markdown code blocks — output raw JSON inside the tags.
- ALWAYS ensure the JSON is complete and valid before closing the tag.

EXPLAINABILITY — Sources & Reasoning:
- ALWAYS end your response with a <sources> tag showing what data you used and how you reasoned.
  Format: <sources>{{"data_used":[{{"source":"name","detail":"specific data point","confidence":"high|medium|low"}}],"reasoning":"1-2 sentences connecting the dots"}}</sources>
  - "source" = data source name (e.g. "Portfolio KPI: Revenue Gap", "Account Intel: Ford", "Google Search", "ABM Signal: Stellantis", "Market Intelligence")
  - "detail" = the specific number, fact, or data point you used from that source
  - "confidence" MUST follow these rules EXACTLY:
    * "high" = INTERNAL — data that comes from the LIVE PORTFOLIO DATA section below (account KPIs, signals, pipeline, margins, ABM data)
    * "medium" = EXTERNAL — ANY data from Google Search, websites, stock tickers (Marketbeat, Yahoo Finance, Investing.com), news articles, competitor earnings, press releases, or ANY web source
    * "low" = inferred/estimated — your own calculations or assumptions
  - MANDATORY: If the source name contains "Google", "Search", "Marketbeat", "Yahoo", "Investing.com", "Reuters", "Bloomberg", or any website name, confidence MUST be "medium" (EXTERNAL). NEVER mark web/search data as "high".
  - "reasoning" = brief chain explaining how you connected these data points to reach your conclusion
  - Include 2-5 sources — cover the key data points that drove your answer
  - Place <sources> AFTER all text, options, and quick_replies — it must be the LAST tag in your response
  - Do NOT wrap in markdown code blocks — output raw JSON inside the tags

LIVE PORTFOLIO DATA:
{context_block}"""

    if req.view_context:
        system_prompt += f"\n\nCURRENT VIEW: '{req.view_context}'"
    if req.section_context:
        system_prompt += f"\n\nCURRENT SECTION:\n{req.section_context}\n\nThe user is most likely asking about this section."
    if req.signal_context:
        system_prompt += f"\n\nSIGNAL CONTEXT:\n{req.signal_context}"

    history = None
    if req.history:
        history = [{"role": msg.role, "text": msg.text} for msg in req.history]

    session_id = req.session_id
    if session_id:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            session = ChatSession(cxo_id=req.cxo_id, title=req.message[:50])
            db.add(session); db.commit(); db.refresh(session)
            session_id = session.id
    else:
        session = ChatSession(cxo_id=req.cxo_id, title=req.message[:50])
        db.add(session); db.commit(); db.refresh(session)
        session_id = session.id

    db.add(ChatMessageRecord(session_id=session_id, role="user", text=req.message))
    db.commit()

    user_message = req.message
    if req.document_context:
        user_message += f"\n\nATTACHED DOCUMENT:\n{req.document_context}"

    provider = _resolve_provider(req)
    slm_prompt = _slm_system_prompt(cxo, firm, context_block, req) if provider == "slm" else None

    def event_generator():
        # First event: session id so frontend can track
        yield f"data: {json.dumps({'type':'session','session_id':session_id})}\n\n"
        full_text = ""
        if provider == "slm":
            chunk_gen = stream_slm_chat(system_prompt=slm_prompt, message=user_message, history=_SLM_FEWSHOT + (history or []))
        else:
            chunk_gen = stream_chat(system_prompt=system_prompt, message=user_message, history=history)
        try:
            for chunk in chunk_gen:
                if chunk:
                    full_text += chunk
                    yield f"data: {json.dumps({'type':'chunk','text':chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type':'error','error':str(e)})}\n\n"
        # Save full reply on completion
        try:
            db.add(ChatMessageRecord(session_id=session_id, role="agent", text=full_text or "No response."))
            db.commit()
        except Exception as e:
            logger.error(f"Failed to save streamed reply: {e}")
        yield f"data: {json.dumps({'type':'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",  # disable nginx buffering
    })
