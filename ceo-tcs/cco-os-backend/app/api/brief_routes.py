from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json
import hashlib
import logging

from app.database import get_db
from app.models import domain as models
from app.models.domain import SavedBrief
from app.utils.langchain_chat import stream_chat
from app.utils.context import build_brief_context
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/brief", tags=["brief"])


def _make_context_key(context_type: str, context_data: dict) -> str:
    raw = json.dumps({"t": context_type, "d": context_data}, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


class BriefRequest(BaseModel):
    cxo_id: int = 1
    context_type: str  # "simulation" | "signal" | "attention"
    context_data: dict = {}
    stakeholder: str = "general"  # "general" | "CFO" | "CEO" | etc.
    tone: str = "confident"  # "confident" | "diplomatic" | "direct" | "cautious"
    length: str = "standard"  # "tight" | "standard" | "detailed"
    emphasis: Optional[str] = None


_STAKEHOLDERS = {
    "general": {
        "label": "General / Board-Ready",
        "focus": "Balanced view across all stakeholders. Cover financial impact, strategic rationale, operational readiness, and risk.",
    },
    "CFO": {
        "label": "CFO",
        "focus": "LTV & payback — durable retention, not just paid acquisition. Focus on ROI, cost structure, budget impact, and financial justification.",
    },
    "CEO": {
        "label": "Founder / CEO",
        "focus": "Player trust — avoids aggressive monetization. Focus on strategic vision, market positioning, long-term value creation, and brand impact.",
    },
    "Head of Product": {
        "label": "Head of Product / Game EP",
        "focus": "Roadmap impact — marketing + lifecycle first. Focus on product changes needed, engineering asks, feature priorities, and user experience.",
    },
    "Regional Leads": {
        "label": "Regional Leads",
        "focus": "Local fit — regional elasticity built in. Focus on regional adaptation, local market conditions, execution feasibility, and ground-level impact.",
    },
    "Community/Comms": {
        "label": "Community / Comms",
        "focus": "Authenticity — leads with beloved content + value. Focus on messaging, community sentiment, communication strategy, and narrative framing.",
    },
    "Board": {
        "label": "Board",
        "focus": "Long-term value & player health. Focus on governance, fiduciary duty, risk oversight, competitive landscape, and shareholder value.",
    },
}

_TONE_INSTRUCTIONS = {
    "confident": "Use a confident, assertive tone. Lead with conviction. State recommendations as clear directives, not suggestions.",
    "diplomatic": "Use a diplomatic, balanced tone. Acknowledge tradeoffs and different perspectives. Frame recommendations as strong suggestions with rationale.",
    "direct": "Use a direct, no-nonsense tone. Be blunt about problems and solutions. Minimize qualifiers. Get to the point fast.",
    "cautious": "Use a cautious, measured tone. Emphasize risks and unknowns. Frame recommendations with appropriate caveats and contingency plans.",
}

_LENGTH_INSTRUCTIONS = {
    "tight": "Be extremely concise. Executive summary: 2-3 sentences max. Bullet lists: 3-4 items max. Total brief should be scannable in 60 seconds.",
    "standard": "Standard length. Executive summary: 3-5 sentences. Bullet lists: 4-6 items. Provide enough detail for informed decision-making.",
    "detailed": "Be thorough and detailed. Executive summary: 5-8 sentences. Bullet lists: 5-8 items. Include supporting data, context, and second-order effects.",
}


def _build_brief_prompt(req: BriefRequest, cxo_name: str, cxo_title: str, firm_name: str, portfolio_context: str) -> str:
    stakeholder = _STAKEHOLDERS.get(req.stakeholder, _STAKEHOLDERS["general"])
    tone = _TONE_INSTRUCTIONS.get(req.tone, _TONE_INSTRUCTIONS["confident"])
    length = _LENGTH_INSTRUCTIONS.get(req.length, _LENGTH_INSTRUCTIONS["standard"])

    context_summary = ""
    cd = req.context_data
    if req.context_type == "simulation":
        context_summary = f"""SIMULATION RESULTS:
Verdict: {cd.get('verdict', '')}
Key Metrics: {json.dumps(cd.get('key_metrics', []))}
Recommendations: {json.dumps(cd.get('recommendations', []))}
Query: {cd.get('query', '')}"""
    elif req.context_type == "signal":
        context_summary = f"""SIGNAL DATA:
Title: {cd.get('title', '')}
Type: {cd.get('signal_type', cd.get('type', ''))}
Impact: {cd.get('impact', '')}
Why It Matters: {cd.get('why', cd.get('body', ''))}
Source: {cd.get('source', '')}
Related Accounts: {cd.get('related_accounts', cd.get('accounts', ''))}
Recommended Action: {cd.get('recommended_action', cd.get('action', ''))}"""
    elif req.context_type == "attention":
        context_summary = f"""ATTENTION ITEM:
Title: {cd.get('title', '')}
Body: {cd.get('body', '')}
Signal Type: {cd.get('signal_type', '')}
Impact: {cd.get('impact', '')}
Delta: {cd.get('delta_value', '')}
Source: {cd.get('source', '')}
Recommended Action: {cd.get('recommended_action_summary', '')}"""

    emphasis_line = ""
    if req.emphasis:
        emphasis_line = f"\nEMPHASIS: Focus especially on: {req.emphasis}"

    return f"""You are the CCO Companion alignment brief generator for {cxo_name}, {cxo_title} at {firm_name}.

Your job: Generate a comprehensive executive alignment brief based on the provided context. This brief will be shared with leadership to align on a strategic direction.

TARGET AUDIENCE: {stakeholder['label']}
AUDIENCE FOCUS: {stakeholder['focus']}

TONE: {tone}

LENGTH: {length}
{emphasis_line}

CONTEXT FOR THIS BRIEF:
{context_summary}

LIVE PORTFOLIO DATA:
{portfolio_context}

OUTPUT: Return ONLY a valid JSON object (no markdown fences, no text outside JSON) with this exact schema:

{{{{
  "executive_summary": "The core narrative — what happened, why it matters, what we recommend. Written for {stakeholder['label']}.",
  "what_changed": ["Specific data point or trend that shifted", "Another change with numbers"],
  "why_it_matters": ["Why this change is significant — with dollar/percentage impact", "Second-order effect"],
  "recommended_direction": "Clear recommended path forward with specific actions, owners, and timeline.",
  "investment_required": "What resources/budget are needed. Be specific about phases and amounts.",
  "expected_impact": "Quantified expected outcomes — revenue lift, margin improvement, risk reduction.",
  "key_risks": ["Risk 1 with mitigation approach", "Risk 2"],
  "proof_points": ["Data point supporting the recommendation", "Another supporting fact with numbers"],
  "counterarguments": ["Likely objection and the counter-response", "Another potential pushback with rebuttal"],
  "decision_needed": "What specifically needs to be decided, by whom, and by when.",
  "board_readiness": "High|Medium|Low",
  "board_readiness_reason": "Why this readiness level — what's missing for higher readiness if not High.",
  "kpis": [
    {{"label": "KPI Name", "value": "+X.X%", "detail": "Brief explanation"}},
    {{"label": "Another KPI", "value": "$XM", "detail": "Brief explanation"}},
    {{"label": "Third KPI", "value": "XX%", "detail": "Brief explanation"}}
  ],
  "emphasis": "{stakeholder['focus'][:60]}"
}}}}

QUALITY RULES:
- Every bullet point must cite SPECIFIC numbers from the portfolio data or context
- Proof points must be verifiable from the data provided
- Counterarguments should anticipate REAL objections from the {stakeholder['label']} perspective
- KPIs: exactly 3, each with a concrete numeric value
- executive_summary: tailor language and emphasis to what {stakeholder['label']} cares about
- decision_needed: be specific — name the decision, the decider, and the deadline
- CRITICAL: Return ONLY valid JSON. No markdown. No text outside the JSON object."""


@router.post("/generate/stream")
def generate_brief_stream(req: BriefRequest, db: Session = Depends(get_db)):
    cxo = db.query(models.CXO).filter(models.CXO.id == req.cxo_id).first()
    if not cxo:
        raise HTTPException(status_code=404, detail="CXO not found")
    firm = db.query(models.Firm).filter(models.Firm.id == cxo.firm_id).first()
    portfolio_context = build_brief_context(db, cxo.id)

    system_prompt = _build_brief_prompt(
        req, cxo.name, cxo.title,
        firm.name if firm else "UPS",
        portfolio_context,
    )

    message = f"Generate an alignment brief for {_STAKEHOLDERS.get(req.stakeholder, _STAKEHOLDERS['general'])['label']} with {req.tone} tone and {req.length} length."

    def event_generator():
        full_text = ""
        try:
            for chunk in stream_chat(system_prompt=system_prompt, message=message, model=settings.GEMINI_BRIEF_MODEL, skip_tools=True):
                if chunk:
                    full_text += chunk
                    yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
        except Exception as e:
            logger.error(f"Brief stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    })


class BriefSaveRequest(BaseModel):
    cxo_id: int = 1
    context_type: str
    context_data: dict = {}
    stakeholder: str
    tone: str = "confident"
    length: str = "standard"
    brief_data: dict


@router.post("/save")
def save_brief(req: BriefSaveRequest, db: Session = Depends(get_db)):
    context_key = _make_context_key(req.context_type, req.context_data)
    existing = db.query(SavedBrief).filter(
        SavedBrief.cxo_id == req.cxo_id,
        SavedBrief.context_key == context_key,
        SavedBrief.stakeholder == req.stakeholder,
    ).first()
    if existing:
        existing.brief_data = req.brief_data
        existing.tone = req.tone
        existing.length = req.length
    else:
        existing = SavedBrief(
            cxo_id=req.cxo_id,
            context_type=req.context_type,
            context_key=context_key,
            stakeholder=req.stakeholder,
            tone=req.tone,
            length=req.length,
            brief_data=req.brief_data,
        )
        db.add(existing)
    db.commit()
    db.refresh(existing)
    return {"id": existing.id, "saved": True}


@router.get("/lookup")
def lookup_brief(context_type: str, context_data: str, stakeholder: str = "general", cxo_id: int = 1, db: Session = Depends(get_db)):
    try:
        cd = json.loads(context_data)
    except Exception:
        cd = {}
    context_key = _make_context_key(context_type, cd)
    row = db.query(SavedBrief).filter(
        SavedBrief.cxo_id == cxo_id,
        SavedBrief.context_key == context_key,
        SavedBrief.stakeholder == stakeholder,
    ).first()
    if not row:
        return {"found": False}
    return {"found": True, "brief_data": row.brief_data, "tone": row.tone, "length": row.length}
