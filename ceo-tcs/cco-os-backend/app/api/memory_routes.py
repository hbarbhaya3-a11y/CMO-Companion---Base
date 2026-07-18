import json
import logging
from datetime import datetime, timezone, timedelta

_EST = timezone(timedelta(hours=-5))
def _est_now():
    return datetime.now(_EST)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas import domain as schemas
from app.models import domain as models
from app.utils.llm import _get_gemini_client, _gemini_generate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["memory"])

MEMORY_FORMAT_SYSTEM_PROMPT = """You are a CXO executive assistant for UPS. Convert simulation results into a structured Memory Decision Ledger card.

Output ONLY valid JSON matching this exact schema:
{
  "title": "Concise initiative title (max 80 chars)",
  "body": "2-3 sentence summary of what the simulation found and what action was decided.",
  "tags": [["TagLabel", "tone"], ...],
  "owners": "Matt Guffey",
  "region": "US Domestic",
  "coverage": "Relevant coverage area(s)",
  "decision_tree": [
    {"key": "unique_key", "label": "Step label", "sub": "Description", "status": "done|active|pending", "type": "signal|data_internal|data_external|analysis|decision|action|outcome", "color": "#2CA58D for done, #0EA5E9 for active, #9CA3AF for pending", "parent": null or "parent_key", "order": 0}
  ],
  "activity_log": [
    {"id": "TR01", "date": "YYYY-MM-DD", "step": "Step name", "change": "What changed", "context": "Context", "delta": "OK|High|Action", "notes": "Brief note"}
  ]
}

Rules:
- Tags: MAXIMUM 3 tags. Tone: "amber" for alerts, "green" for positive, "ink" for neutral
- Coverage: UPS coverage areas (Ground, Air, Healthcare, NAAF, SurePost, Digital Access, etc.)

DECISION TREE — The flow MUST follow this exact pattern:

FLOW: Parallel Input → Correlation → Options → Decision → Outcome

  trigger (parent: null)
    ├── ext1 (parent: trigger)       ← one per EXTERNAL source actually used
    ├── ...more ext nodes if more external sources were used
    ├── int1 (parent: trigger)       ← one per INTERNAL source actually used
    ├── ...more int nodes if more internal sources were used
    └── correlates (parent: trigger, type: analysis)  ← merges ALL parallel inputs
         └── options (parent: correlates)  ← "Options: A, B, C"
              └── decision (parent: options)  ← "Matt Selected: Option A"
                   ├── reality (parent: decision, status: active)  ← what's happening now
                   └── next_gate (parent: decision, status: pending)  ← next milestone

CRITICAL RULES:
- Create ONE node per ACTUAL data source used in the conversation — do NOT pad or invent sources
- If only 1 external source was used, create 1 external node. If 5 were used, create 5. Be EXACT.
- All external + internal nodes have SAME parent (trigger) — renderer shows them parallel
- "correlates" node type MUST be "analysis" — renderer merges parallel lines into it
- "reality" and "next_gate" are BOTH children of "decision" — shown as parallel outcomes
- Status colors: done=#2CA58D, active=#0EA5E9, pending=#9CA3AF

FULL EXAMPLE decision_tree:
[
  {"key":"trigger","label":"Automotive T1 Revenue Gap","sub":"$116M below plan across 5 T1 auto accounts","status":"done","type":"signal","color":"#2CA58D","parent":null,"order":0},
  {"key":"ext1","label":"External: FedEx Auto Express","sub":"FedEx launched USMCA cross-border product Jun 5. Pricing 8% below UPS list.","status":"done","type":"data_external","color":"#2CA58D","parent":"trigger","order":1},
  {"key":"ext2","label":"External: Ford 8-K Production Delay","sub":"Ford BlueOval City delayed to Aug 2026. Battery logistics RFP closes Aug 12.","status":"done","type":"data_external","color":"#2CA58D","parent":"trigger","order":2},
  {"key":"int1","label":"Internal: CRM Account Gap Data","sub":"Ford: −$30M vs plan, team cut 2.5→1.0 FTE. Stellantis: −$24M, procurement reorg weakened exec relationships.","status":"done","type":"data_internal","color":"#2CA58D","parent":"trigger","order":3},
  {"key":"int2","label":"Internal: ABM Memory — GM Analog","sub":"INI-2025-027: CCO briefings + NAAF capacity lock lifted engagement +47%. 3 of 4 quarters completed.","status":"done","type":"data_internal","color":"#2CA58D","parent":"trigger","order":4},
  {"key":"correlates","label":"Companion Correlates","sub":"HIGH — $54M combined gap · 2 accounts · 6-day FedEx timing advantage. GM playbook is highest-confidence analog.","status":"done","type":"analysis","color":"#2CA58D","parent":"trigger","order":5},
  {"key":"options","label":"Options: NAAF Pre-lock / Price Match / Wait","sub":"A: NAAF pre-lock + GM ABM playbook (+$40M P50). B: Price match FedEx −8%. C: Monitor and respond to RFP.","status":"done","type":"action","color":"#2CA58D","parent":"correlates","order":6},
  {"key":"decision","label":"Matt Selected: Option A — NAAF Pre-lock","sub":"VP Auto Sales instructed to route NAAF pre-lock offer to Ford and Stellantis within 48 hours.","status":"done","type":"decision","color":"#0EA5E9","parent":"options","order":7},
  {"key":"reality","label":"In Reality","sub":"Ford RFP closes Aug 12. Stellantis VP meeting scheduled. NAAF 85% ready. Account team restored to 2.0 FTE.","status":"active","type":"outcome","color":"#0EA5E9","parent":"decision","order":8},
  {"key":"next_gate","label":"Next Gate","sub":"Both accounts respond by Aug 31. Close rate vs +$40M P50 is tracking metric. CCO briefing monthly.","status":"pending","type":"outcome","color":"#9CA3AF","parent":"decision","order":9}
]

ACTIVITY LOG — Generate 10-20 detailed entries. One entry per data point, source lookup, analysis step, option presented, and user decision. Be EXHAUSTIVE.

RULES:
- "step" = short action label: "Data Pull", "Source Lookup", "Analysis", "Options Presented", "User Decision", "Strategy Formation", "Outcome Defined"
- "context" = data source type. Use SPECIFIC sources:
    "UPS Portfolio Data" | "Account KPI Dashboard" | "Revenue Analytics" | "Google Search" | "SEC Filing" | "Industry Report" | "User Decision" | "Companion Analysis" | "Competitive Intel" | "Historical Playbook" | "Market Data"
- "change" = cite EXACT numbers, account names, metrics, percentages — NEVER generic like "data analyzed". Examples:
    "Ford revenue −$30M YoY, coverage dropped to 1.0 FTE"
    "FedEx Freight spin-off effective Jun 1, 2026 — refocusing Express on small-parcel"
    "User selected Option 2: Competitive Benchmarking over Margin Model"
- "delta" = "OK" for informational, "High" for critical findings, "Action" for decisions/actions taken
- "notes" = WHY this specific data point mattered to the overall decision chain — connect it to outcome

ACTIVITY LOG MUST COVER ALL OF THESE (one entry minimum each):
1. What triggered the simulation (signal/query)
2. Each internal data source pulled (separate entry per source)
3. Each external data source searched (separate entry per source)
4. Key findings from analysis (specific numbers)
5. Each option presented to user (list all options in one entry)
6. Which option user selected and why
7. Stage 2 internal data pulled (if applicable)
8. Stage 2 external data searched (if applicable)
9. Final strategy/recommendation formed
10. Outcome action items with specific targets

FULL EXAMPLE activity_log:
[
  {"id":"TR01","date":"2026-06-22","step":"Signal Detected","change":"$116M cumulative revenue gap flagged across Ford, Stellantis, GM accounts","context":"UPS Portfolio Data","delta":"High","notes":"Triggered executive review — gap exceeds quarterly tolerance threshold"},
  {"id":"TR02","date":"2026-06-22","step":"Data Pull","change":"Ford −$30M YoY, Stellantis −$24M, GM −$18M; combined coverage at 1.0 FTE vs 3.2 benchmark","context":"Account KPI Dashboard","delta":"High","notes":"Coverage ratio 3x below healthy threshold — structural gap, not seasonal"},
  {"id":"TR03","date":"2026-06-22","step":"Data Pull","change":"RPP at $18.40 vs segment avg $22.10; margin compression across all three OEMs","context":"Revenue Analytics","delta":"High","notes":"Pricing erosion compounds volume loss — dual pressure on contribution margin"},
  {"id":"TR04","date":"2026-06-22","step":"Source Lookup","change":"FedEx Freight spin-off effective Jun 1, 2026 — Express refocusing on small-parcel and NAAF corridors","context":"Google Search","delta":"High","notes":"Direct competitive threat to exposed UPS lanes in Detroit-3 corridor"},
  {"id":"TR05","date":"2026-06-22","step":"Source Lookup","change":"FedEx 8% list-price undercut on NAAF aftermarket bands in Q2 pricing circular","context":"Competitive Intel","delta":"High","notes":"Aggressive pricing move targeting exactly our weakest accounts"},
  {"id":"TR06","date":"2026-06-22","step":"Analysis","change":"Combined internal gap + external threat = urgent: FedEx targeting our exposed corridors with post-spin capacity","context":"Companion Analysis","delta":"Action","notes":"Convergence of internal weakness and external aggression requires immediate response"},
  {"id":"TR07","date":"2026-06-22","step":"Options Presented","change":"3 paths: (1) Aggressive Margin Retention, (2) Capacity Reallocation, (3) FedEx Post-Spin Threat Assessment","context":"Companion Analysis","delta":"OK","notes":"Each option addresses different risk dimension — margin vs capacity vs competitive"},
  {"id":"TR08","date":"2026-06-22","step":"User Decision","change":"Selected Option 3: FedEx Post-Spin Threat Assessment — competitive benchmarking approach","context":"User Decision","delta":"Action","notes":"User prioritized understanding competitive landscape before committing resources"},
  {"id":"TR09","date":"2026-06-22","step":"Data Pull","change":"GM/Magna recovery playbook (INI-2024-031): executive-led ABM recovered $52M in 6 months","context":"Historical Playbook","delta":"OK","notes":"Proven playbook exists — reduces execution risk of proposed strategy"},
  {"id":"TR10","date":"2026-06-22","step":"Source Lookup","change":"FedEx Q3 8-K: 10% US domestic revenue growth, DIM-weight pricing on aftermarket bands","context":"SEC Filing","delta":"High","notes":"Confirms FedEx momentum — delay increases competitive exposure"},
  {"id":"TR11","date":"2026-06-22","step":"Analysis","change":"Recommended GM-Magna Playbook defense: shift digital to executive-led ABM, restore coverage to 2.5 FTE","context":"Companion Analysis","delta":"Action","notes":"Strategy synthesizes proven playbook with current competitive intelligence"},
  {"id":"TR12","date":"2026-06-22","step":"Outcome Defined","change":"$1M budget reallocation to executive briefings, restore Ford/Stellantis coverage, target $52M recovery in 6mo","context":"Companion Analysis","delta":"Action","notes":"Clear action items with measurable targets — ready for CCO approval"}
]"""


@router.get("/cxo/{cxo_id}/memory", response_model=List[schemas.MemoryItemOut])
def list_memory_items(cxo_id: int, db: Session = Depends(get_db)):
    return db.query(models.MemoryItem).filter(models.MemoryItem.cxo_id == cxo_id).all()


@router.get("/memory/{item_id}", response_model=schemas.MemoryItemOut)
def get_memory_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.MemoryItem).filter(models.MemoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Memory item not found")
    return item


@router.delete("/memory/{item_id}")
def delete_memory_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.MemoryItem).filter(models.MemoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Memory item not found")
    db.delete(item)
    db.commit()
    return {"ok": True, "id": item_id}


@router.post("/memory/save-from-simulation", response_model=schemas.MemoryItemOut)
def save_simulation_as_memory(req: schemas.SimulationToMemoryRequest, db: Session = Depends(get_db)):
    trail_text = ""
    if req.conversation_trail:
        trail_text = "\n\nFULL CONVERSATION TRAIL — each stage represents a turn in the lite simulation. The decision tree and activity log MUST reflect ALL stages, not just the last one.\n"
        stage_num = 0
        for i, entry in enumerate(req.conversation_trail):
            role = entry.get('role', 'unknown')
            if role == 'user':
                stage_num += 1
                trail_text += f"\n{'='*60}\nSTAGE {stage_num}: USER QUERY\n{'='*60}\n"
                trail_text += f"{entry.get('text', '')}\n"
            else:
                trail_text += f"\n--- AI RESPONSE (Stage {stage_num}) ---\n"
                trail_text += f"{entry.get('text', '')}\n"
                if entry.get('options_offered'):
                    trail_text += f"\nOPTIONS PRESENTED TO USER:\n"
                    for j, opt in enumerate(entry['options_offered']):
                        if isinstance(opt, dict):
                            trail_text += f"  {j+1}. {opt.get('text', '')} — {opt.get('description', '')}\n"
                        else:
                            trail_text += f"  {j+1}. {opt}\n"
                if entry.get('option_selected'):
                    trail_text += f"\n>>> USER DECISION: Selected \"{entry['option_selected']}\"\n"
                if entry.get('sources'):
                    trail_text += f"\nDATA SOURCES USED IN THIS STAGE:\n"
                    internal = [s for s in entry['sources'] if s.get('confidence') == 'high']
                    external = [s for s in entry['sources'] if s.get('confidence') == 'medium']
                    inferred = [s for s in entry['sources'] if s.get('confidence') == 'low']
                    if internal:
                        trail_text += f"  INTERNAL (parallel):\n"
                        for s in internal:
                            trail_text += f"    • {s.get('source','')}: {s.get('detail','')}\n"
                    if external:
                        trail_text += f"  EXTERNAL (parallel):\n"
                        for s in external:
                            trail_text += f"    • {s.get('source','')}: {s.get('detail','')}\n"
                    if inferred:
                        trail_text += f"  INFERRED:\n"
                        for s in inferred:
                            trail_text += f"    • {s.get('source','')}: {s.get('detail','')}\n"
                if entry.get('reasoning'):
                    trail_text += f"\nREASONING: {entry['reasoning']}\n"
                if entry.get('verdict'):
                    trail_text += f"\nVERDICT: {entry['verdict']}\n"

    sources_text = ""
    if req.sources_used:
        sources_text = "\n\nALL DATA SOURCES ACROSS ALL STAGES:\n"
        internal = [s for s in req.sources_used if isinstance(s, dict) and s.get('confidence') == 'high']
        external = [s for s in req.sources_used if isinstance(s, dict) and s.get('confidence') == 'medium']
        if internal:
            sources_text += "INTERNAL SOURCES:\n"
            for s in internal:
                sources_text += f"  • {s.get('source','')}: {s.get('detail','')}\n"
        if external:
            sources_text += "EXTERNAL SOURCES:\n"
            for s in external:
                sources_text += f"  • {s.get('source','')}: {s.get('detail','')}\n"

    user_prompt = f"""Convert this simulation into a Memory Decision Ledger card.

Simulation Type: {req.simulation_type}
Title: {req.simulation_title}
Query: {req.query or 'N/A'}

Summary:
{req.simulation_summary}

Metrics: {json.dumps(req.metrics) if req.metrics else 'None'}
Levers: {json.dumps(req.levers) if req.levers else 'None'}
Recommendations: {json.dumps(req.recommendations) if req.recommendations else 'None'}{trail_text}{sources_text}"""

    try:
        client = _get_gemini_client()
        raw = _gemini_generate(client, MEMORY_FORMAT_SYSTEM_PROMPT, user_prompt)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        data = json.loads(cleaned)
    except Exception as e:
        logger.error(f"LLM formatting failed: {e}")
        data = {
            "title": req.simulation_title,
            "body": req.simulation_summary[:500],
            "tags": [["Initiative", "green"], ["Simulation", "ink"]],
            "owners": "Matt Guffey",
            "region": "US Domestic",
            "coverage": "Ground",
            "decision_tree": [
                {"key": "sim_run", "label": "Simulation executed", "sub": req.simulation_summary[:200], "status": "done", "type": "action", "color": "#2CA58D", "parent": None, "order": 0},
                {"key": "review", "label": "Results under review", "sub": "Saved from Decision Lab for tracking.", "status": "active", "type": "decision", "color": "#0EA5E9", "parent": "sim_run", "order": 1},
            ],
            "activity_log": [
                {"id": "TR01", "date": _est_now().strftime("%Y-%m-%d"), "step": "Simulation run", "change": req.simulation_title, "context": req.simulation_type, "delta": "Action", "notes": "Saved from Decision Lab"},
            ],
        }

    memory_item = models.MemoryItem(
        cxo_id=1,
        status="current",
        title=data.get("title", req.simulation_title),
        body=data.get("body", req.simulation_summary[:500]),
        tags=data.get("tags", [["Initiative", "green"]])[:3],
        owners=data.get("owners", "Matt Guffey"),
        region=data.get("region", "US Domestic"),
        coverage=data.get("coverage", "Ground"),
        decision_tree=data.get("decision_tree", []),
        activity_log=data.get("activity_log", []),
        learnings=None,
    )
    db.add(memory_item)
    db.commit()
    db.refresh(memory_item)
    return memory_item
