from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import json
import re
import logging

from app.database import get_db
from app.schemas import simulation as schemas
from app.models import domain as models
from app.models import abm as abm_models
from app.models import enterprise as ent_models
from app.utils.llm import _get_gemini_client, _gemini_search_query, _gemini_generate
from app.utils.langchain_chat import stream_chat
from app.utils.context import build_full_context

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/simulation", tags=["simulation"])


def _build_internal_context(db: Session, cxo_id: int) -> str:
    """Full portfolio context — delegates to shared builder."""
    return build_full_context(db, cxo_id)


REACT_SYSTEM_PROMPT = """You are the CCO Companion strategic simulation engine for Matt Guffey, Chief Commercial Officer at UPS (NYSE: UPS, world's largest package delivery company).

UPS DOMAIN KNOWLEDGE (use these terms and specifics — never give generic logistics answers):
• Segments: US Domestic Package ($14.1B rev, -2.3% YoY, 4.0% adj op margin vs 7.5-8.5% target), International Package, Supply Chain Solutions
• Key accounts: Amazon (glide-down completing), AutoZone, Stellantis, Ford, Honda, Tesla, Toyota, FedEx/DHL/Amazon Logistics (competitors)
• Franchises: Ground, Air, Healthcare, NAAF (North America/Asia-Pacific Freight), SurePost, Digital Access Program (DAP)
• Pricing levers: L0 DIM Divisor, L1 Basic/Accessorial discounts, L2 Tier pricing, L4 Zone Minimums
• Strategy: "fewer, better, more profitable" — revenue per piece up 6.5% YoY, SMB ADV +1.6%
• Active initiatives: $50M automotive/industrial logistics transformation, NAAF Mexico launch Aug 2026, SMB penetration growth, Amazon capacity reallocation to higher-yield segments

{internal_context}

METHODOLOGY — For every query:
1. DECOMPOSE into UPS-specific sub-problems
2. ANSWER FROM INTERNAL DATA FIRST — the INTERNAL BUSINESS DATA section above contains real account data, KPIs, signals, and market intelligence from the application. Use these numbers directly. Do NOT search for data already provided above
3. Use Google Search AUTONOMOUSLY when you need external context — competitor earnings, industry news, stock prices, regulatory changes, market trends. Maximum 2 searches per response
4. PROJECT quantitative impact using the specific account/segment numbers from internal data
5. RECOMMEND concrete actions referencing specific accounts and metrics from the internal data

RESPONSE — Return a single JSON object (NO markdown fences, NO text outside JSON):

{{
  "thinking_steps": [
    {{"step": "Decompose", "content": "2-3 sentences breaking down the sub-problems and why they matter to UPS specifically"}},
    {{"step": "External Research", "content": "3-4 sentences with specific data points found — name sources, cite numbers, dates. Include competitor comparisons where relevant"}},
    {{"step": "Internal Analysis", "content": "2-3 sentences connecting internal KPIs/signals to the query. Reference specific account names, dollar amounts, and trend directions"}},
    {{"step": "Synthesis", "content": "3-4 sentences combining internal + external into a strategic insight. Quantify the opportunity or risk in dollar terms"}}
  ],
  "verdict": "5-8 sentence executive verdict. Lead with the bottom line. Include: (1) the core finding with numbers, (2) what's driving it, (3) the risk of inaction, (4) the recommended path forward with expected impact. Be specific — name accounts, cite figures, give timelines. No filler.",
  "key_metrics": [
    {{"label": "metric name", "value": "number or short text", "delta": "+X% or -X%", "positive": true/false}}
  ],
  "charts": [
    // EXAMPLE 1 — bar chart from account data:
    {{"chart_type": "bar", "title": "Account Spend Comparison ($M)", "x_key": "name", "data_keys": ["value"],
      "data": [{{"name": "Ford", "value": 85.0}}, {{"name": "Stellantis", "value": 62.0}}, {{"name": "Honda", "value": 45.0}}],
      "colors": ["#FFB500", "#4A2E1C", "#2CA58D", "#0EA5E9", "#7E2D38", "#644117"]}},
    // EXAMPLE 2 — line chart from margin trajectory:
    {{"chart_type": "line", "title": "Margin Trajectory by Quarter (%)", "x_key": "name", "data_keys": ["value"],
      "data": [{{"name": "Q1 2025", "value": 5.2}}, {{"name": "Q2 2025", "value": 6.8}}, {{"name": "Q3 2025", "value": 7.1}}, {{"name": "Q4 2025", "value": 7.4}}],
      "colors": ["#FFB500"]}},
    // EXAMPLE 3 — donut chart from subsegment mix:
    {{"chart_type": "donut", "title": "Revenue Mix by Subsegment", "x_key": "name", "data_keys": ["value"],
      "data": [{{"name": "OEM Parts", "value": 340.0}}, {{"name": "Aftermarket", "value": 180.0}}, {{"name": "EV/Battery", "value": 95.0}}],
      "colors": ["#FFB500", "#4A2E1C", "#2CA58D", "#0EA5E9"]}}
  ],
  "recommendations": [
    {{"action": "specific action with owner and timeline", "impact": "expected outcome with dollar/percentage figures", "urgency": "high|medium|low"}}
    ... (4-5 recommendations spanning different levers: pricing, capacity, ABM, relationship, competitive)
  ],
  "sources_used": ["source name or URL", ...]
}}

QUALITY RULES:
• key_metrics: 4-6 metrics. Each must have a concrete numeric value and delta. Include at least one revenue metric, one margin/profitability metric, and one operational metric
• CHARTS ARE MANDATORY — ALWAYS return 3-4 charts. Never 0, never 1. Each chart MUST use DIFFERENT chart_type to show different angles of the analysis.
  SCHEMA: Every data point is {{"name": "string", "value": float}}. data_keys always ["value"]. x_key always "name".
  HOW TO BUILD CHARTS — look at the CHART-READY tables in the internal data and pick the most relevant ones for the query:
  - Account Spend/Headroom table → "bar" chart comparing accounts by spend, headroom, or SoW
  - Subsegment Performance table → "donut" chart for revenue mix, "bar" for margin comparison
  - Margin Trajectory table → "line" or "area" chart for quarterly margin trends over time
  - Deal Pipeline table → "bar" chart for deal values by customer, "donut" for workstream mix
  - Pipeline Stages table → "bar" or "donut" for deal stage distribution
  - Key Facts → "bar" comparing UPS vs FedEx metrics, "line" for projected trends
  CHART TYPE SELECTION — use at least 3 DIFFERENT types across your charts:
  - "bar" → comparing categories (accounts, segments, competitors, deals)
  - "line" → time trends (quarterly revenue, margin trajectory, volume projections)
  - "area" → cumulative/volume trends, growth trajectories
  - "donut" → portfolio mix, market share, allocation breakdowns, composition
  - "stacked_bar" → composition by category, channel mix
  DATA REQUIREMENTS: 4-8 data points per chart. Use REAL numbers from the INTERNAL BUSINESS DATA tables. Value must be a real number (never 0 unless truly zero). For time series, use {{"name": "Q1 2025", "value": 14.1}} format.
• recommendations: 4-5 detailed actions. Each must: (1) name the specific account, segment, or franchise involved, (2) describe the precise tactical step (e.g. "Deploy CCO briefing + Industry Expert + NAAF capacity lock for Ford"), (3) include a dollar or percentage impact estimate grounded in UPS data, (4) specify urgency (high/medium/low) with a concrete deadline or trigger event (e.g. "before Aug 12 RFP close"). Recommendations should span different levers — pricing, capacity, ABM motion, relationship, competitive response
• verdict: Must be substantive — quantify the opportunity/risk, name the top 2-3 accounts affected, and give a clear "do this by when" directive
• thinking_steps: Show genuine analytical depth — each step should add new information, not restate the query

CRITICAL: Return ONLY valid JSON. No markdown. No code fences. No text outside the JSON object."""




def _build_fallback_charts(db: Session, cxo_id: int, query: str) -> list:
    """Build dynamic charts from DB data relevant to the query."""
    colors = ["#FFB500", "#4A2E1C", "#2CA58D", "#0EA5E9", "#7E2D38", "#644117"]
    charts = []
    q_lower = query.lower()

    # Pick chart types based on query context
    accounts = db.query(abm_models.AutoAccount).all()
    subsegments = db.query(abm_models.AutoSubsegment).all()
    margins = db.query(ent_models.EntMarginTrajectory).order_by(ent_models.EntMarginTrajectory.sort_order).all()
    deals = db.query(ent_models.EntStrategicDeal).all()
    pipeline = db.query(ent_models.EntPipelineStage).order_by(ent_models.EntPipelineStage.sort_order).all()

    # Chart 1: Account-level comparison (bar) — always relevant
    if accounts:
        # Pick the most relevant metric based on query
        if any(w in q_lower for w in ["headroom", "opportunity", "growth", "expand"]):
            charts.append({"chart_type": "bar", "title": "Account Growth Headroom ($M)", "x_key": "name", "data_keys": ["value"],
                "data": [{"name": a.name, "value": round(a.headroom, 1)} for a in sorted(accounts, key=lambda x: x.headroom, reverse=True)[:6]],
                "colors": colors})
        elif any(w in q_lower for w in ["sow", "share", "wallet", "penetration"]):
            charts.append({"chart_type": "bar", "title": "Share of Wallet by Account (%)", "x_key": "name", "data_keys": ["value"],
                "data": [{"name": a.name, "value": float(a.sow)} for a in sorted(accounts, key=lambda x: x.sow, reverse=True)[:6]],
                "colors": colors})
        else:
            charts.append({"chart_type": "bar", "title": "Account Annual Spend ($M)", "x_key": "name", "data_keys": ["value"],
                "data": [{"name": a.name, "value": round(a.spend, 1)} for a in sorted(accounts, key=lambda x: x.spend, reverse=True)[:6]],
                "colors": colors})

    # Chart 2: Subsegment mix (donut)
    if subsegments:
        if any(w in q_lower for w in ["margin", "profit", "cost"]):
            charts.append({"chart_type": "bar", "title": "Subsegment Margin Comparison (%)", "x_key": "name", "data_keys": ["value"],
                "data": [{"name": s.name, "value": float(s.margin)} for s in sorted(subsegments, key=lambda x: x.margin, reverse=True)],
                "colors": colors})
        else:
            charts.append({"chart_type": "donut", "title": "Revenue by Subsegment ($M)", "x_key": "name", "data_keys": ["value"],
                "data": [{"name": s.name, "value": round(s.rev, 1)} for s in subsegments],
                "colors": colors})

    # Chart 3: Time series (line) — margin trajectory
    if margins:
        data = [{"name": m.quarter, "value": m.actual_margin or m.plan_margin or 0} for m in margins if (m.actual_margin or m.plan_margin)]
        if data:
            charts.append({"chart_type": "line", "title": "Operating Margin Trajectory (%)", "x_key": "name", "data_keys": ["value"],
                "data": data, "colors": ["#FFB500"]})

    # Chart 4: Deal pipeline (area or bar)
    if deals and not margins:
        deal_data = [{"name": d.customer, "value": d.value} for d in sorted(deals, key=lambda x: x.value, reverse=True)[:6]]
        if deal_data:
            charts.append({"chart_type": "bar", "title": "Enterprise Deal Pipeline ($M)", "x_key": "name", "data_keys": ["value"],
                "data": deal_data, "colors": colors})

    if pipeline and len(charts) < 4:
        pipe_data = [{"name": p.stage, "value": float(p.count)} for p in pipeline]
        if pipe_data:
            charts.append({"chart_type": "donut", "title": "Deals by Pipeline Stage", "x_key": "name", "data_keys": ["value"],
                "data": pipe_data, "colors": colors})

    return charts[:4]


# ── Conversational streaming simulation ──────────────────────────────

_SIM_CLARIFY_PROMPT = """You are the CCO Companion simulation assistant for {{cxo_name}}, {{cxo_title}} at {{firm_name}}.

Your job: understand what SPECIFIC angle the user wants before running a full simulation.

DATA STRATEGY — You have TWO data sources. Use BOTH to frame your clarification:
1. INTERNAL (below): Live portfolio data — account KPIs, signals, pipeline, margins, ABM data, attention items. This is real-time enterprise data. USE THIS FIRST.
2. EXTERNAL (Google Search): Competitor earnings, industry news, stock prices, regulatory changes, tariff updates, market trends, analyst reports. Use Google Search AUTONOMOUSLY to enrich your understanding — max 2 searches per response.
   ALWAYS search for the latest external context relevant to the query (e.g. competitor moves, market conditions, regulatory news) so your options reflect both internal position AND external landscape.

RULES:
- Read the user's query and the conversation history carefully
- If the history contains PRIOR CHAT CONTEXT (e.g. "[Prior chat context about: ...]"), the user came here from a Companion chat conversation. Acknowledge what was already discussed — DON'T start from scratch. Reference the signal/card they were exploring and tailor your clarifying options to build on that prior conversation.
- Write 2-3 sentences acknowledging what they're asking and why it matters to UPS specifically — reference real account names, dollar figures, or KPIs from INTERNAL data AND relevant external context (competitor moves, market shifts) from Google Search
- Present EXACTLY 3 options using <options> tags. NEVER output fewer than 2. Each option MUST be:
  1. DIRECTLY RELEVANT to the user's query — every option must answer a specific angle of what they asked, not generic business topics
  2. ACTIONABLE — each option should lead to a concrete analysis the user can act on (e.g. "Competitive threat assessment on Ford NAAF lanes" not "Explore competitive dynamics")
  3. SPECIFIC — name real accounts, dollar amounts, timeframes, and metrics from internal data. Reference external data from search.
  4. DIFFERENT from each other — vary the analytical lens:
     - Different data dimensions (revenue vs margin vs volume vs competitive)
     - Different scope (single account vs segment vs portfolio-wide)
     - Different timeframes (immediate tactical vs quarterly vs strategic)
- NEVER present generic options like "Explore further" or "Deep dive into data" — every option must state WHAT specific analysis will be run and WHAT decision it helps make
- Do NOT run any analysis yet — just clarify the approach

FORMAT:
<options>[{{"id":"opt1","text":"Angle title","description":"Why this matters — cite specific internal + external data points"}}]</options>

EXPLAINABILITY — Sources & Reasoning:
- ALWAYS end your response with a <sources> tag after the <options> tag.
  Format: <sources>{{"data_used":[{{"source":"name","detail":"specific data point","confidence":"high|medium|low"}}],"reasoning":"1-2 sentences on how you connected the dots"}}</sources>
  - Include 2-4 sources showing what data points you referenced to frame the clarifying options
  - "confidence" MUST follow these rules:
    * "high" = INTERNAL — data from LIVE PORTFOLIO DATA below (account KPIs, signals, pipeline, margins, ABM data)
    * "medium" = EXTERNAL — ANY data from Google Search, websites, stock tickers, news, competitor earnings
    * "low" = inferred/estimated
  - MANDATORY: If source mentions Google, Search, Marketbeat, Yahoo, any website → confidence MUST be "medium". NEVER mark web data as "high".
  - Place <sources> AFTER <options> — it must be the LAST tag

LIVE PORTFOLIO DATA:
{internal_context}"""

_SIM_ANALYSIS_PROMPT = """You are the CCO Companion strategic simulation engine for {{cxo_name}}, {{cxo_title}} at {{firm_name}}.

The user asked a question, selected an analytical angle, and now you must run the FULL simulation.

DATA STRATEGY — You have TWO data sources. Use BOTH for every simulation:
1. INTERNAL (below): Live portfolio data — account KPIs, revenue, margins, pipeline, ABM data, attention items. This is real-time enterprise data. USE THIS AS PRIMARY SOURCE for all UPS-specific numbers.
2. EXTERNAL (Google Search): Use Google Search AUTONOMOUSLY to get competitor data, industry benchmarks, market conditions, stock performance, analyst estimates, regulatory/tariff news, and recent events. Max 2 searches per response.
   CRITICAL: Every simulation MUST blend internal position data with external market context. A simulation using only internal data is incomplete.

METHODOLOGY:
1. DECOMPOSE into UPS-specific sub-problems
2. ANSWER FROM INTERNAL DATA FIRST — use real account/segment numbers from the portfolio data
3. ENRICH WITH EXTERNAL DATA — search for competitor moves, market benchmarks, analyst estimates, regulatory context
4. SYNTHESIZE — combine internal position + external landscape into actionable strategic insight
5. QUANTIFY — project impact using internal numbers informed by external benchmarks

RULES:
- Lead with 2-3 sentences connecting their selected angle to your analysis approach
- Then output <sim_result>JSON</sim_result> with the complete simulation
- If this is a follow-up to a previous simulation, BUILD ON the prior results — don't repeat the same analysis
- Reference specific numbers from BOTH internal portfolio data AND external search results

JSON SCHEMA (must match exactly):
{{
  "thinking_steps": [{{"step":"step name","content":"2-3 sentences of genuine analysis"}}],
  "verdict": "5-8 sentence executive verdict — lead with bottom line, quantify risk/opportunity, name top 2-3 accounts, give timeline",
  "key_metrics": [{{"label":"metric name","value":"concrete number","delta":"+X% or -$XM","positive":true/false}}],
  "charts": [{{"chart_type":"bar|line|area|donut|stacked_bar","title":"Descriptive Title","x_key":"name","data_keys":["value"],"data":[{{"name":"label","value":number}}],"colors":["#FFB500","#4A2E1C","#2CA58D","#0EA5E9","#7E2D38","#644117"]}}],
  "recommendations": [{{"action":"specific action with owner/account","impact":"expected $$ or % outcome","urgency":"high|medium|low"}}],
  "sources_used": ["source"],
  "sources": {{
    "data_used": [{{"source":"data source name","detail":"specific data point used","confidence":"high (INTERNAL from portfolio data)|medium (EXTERNAL from Google Search/web)|low (inferred)"}}],
    "reasoning": "1-2 sentences explaining how you connected internal data + external research to reach your verdict"
  }}
}}
NOTE: Web data (stock prices, news, Marketbeat, Yahoo Finance, competitor data from Google Search) is ALWAYS EXTERNAL/medium confidence. Only LIVE PORTFOLIO DATA below is INTERNAL/high confidence.

CHART GENERATION — THIS IS CRITICAL:
Charts must be UNIQUE and RELEVANT to the specific query. Never reuse the same chart structure across different queries.

HOW TO BUILD CHARTS — pick the most relevant data angles for THIS specific query:
- If query is about ACCOUNTS: bar chart comparing those specific accounts' spend/headroom/SoW/gap
- If query is about TRENDS: line or area chart showing quarterly progression
- If query is about ALLOCATION/MIX: donut chart showing percentage breakdowns
- If query is about COMPETITIVE: bar chart comparing UPS vs competitors on specific metrics
- If query is about PRICING: stacked_bar or bar showing pricing tiers, RPP, or discount levels
- If query is about RISK: bar chart showing risk exposure by account/segment
- If query is about PROJECTION/WHAT-IF: line chart showing baseline vs projected scenario
- If query is about PIPELINE: bar for deal values, donut for stage distribution
- If query is about MARGIN: line chart for trajectory, bar for segment comparison

CHART RULES:
- ALWAYS return 3-4 charts with DIFFERENT chart_types
- Each chart must have 4-8 data points with REAL numbers from the data below
- Chart titles must be SPECIFIC to the query (not generic like "Revenue by Account")
- For what-if scenarios: show BEFORE vs AFTER or BASELINE vs PROJECTED
- For comparisons: show the specific entities being compared
- data format: always {{"name": "label", "value": number}}. data_keys always ["value"]. x_key always "name"
- value must be a real nonzero number. Use actual figures from the data below

KEY METRICS RULES:
- 4-6 metrics directly relevant to the query angle
- Each must have concrete numeric value AND delta
- Deltas should reflect the specific scenario being analyzed (not just current state)
- Include at least: one revenue metric, one margin/profitability metric, one operational metric

RECOMMENDATIONS RULES:
- 4-5 actions spanning different levers (pricing, capacity, ABM, relationship, competitive)
- Each must name specific account/segment, describe precise tactical step, include $$ impact estimate, specify urgency with deadline

THINKING STEPS — 4 steps, each adds NEW information:
1. Decompose: Break into UPS-specific sub-problems
2. External Research: MUST cite specific data from Google Search — competitor earnings, market benchmarks, analyst estimates, regulatory news, stock data. Name sources and cite specific numbers/dates. If you found nothing relevant, say so explicitly.
3. Internal Analysis: Connect internal KPIs/signals/accounts to the query. Reference specific account names, dollar amounts, trend directions from the LIVE PORTFOLIO DATA.
4. Synthesis: Combine internal position + external landscape into strategic insight. Quantify opportunity/risk in dollar terms using both data sets.

CRITICAL: ALWAYS complete the entire JSON. Never truncate. Wrap in <sim_result> tags.

LIVE PORTFOLIO DATA — use these numbers directly in charts, metrics, and analysis:
{internal_context}

<sim_result>{{...complete json...}}</sim_result>"""


_SIM_FOLLOWUP_PROMPT = """You are the CCO Companion strategic simulation engine for {{cxo_name}}, {{cxo_title}} at {{firm_name}}.

You are in an ongoing simulation conversation. The user has already received simulation results and is now asking a follow-up question.

DATA STRATEGY — You have TWO data sources. Use BOTH:
1. INTERNAL (below): Live portfolio data — account KPIs, revenue, margins, pipeline, ABM data. USE THIS AS PRIMARY SOURCE.
2. EXTERNAL (Google Search): Use Google Search AUTONOMOUSLY for competitor data, market benchmarks, industry news, analyst estimates, regulatory updates. Max 2 searches per response.
   Every analysis MUST combine internal UPS position with external market context.

Decide the right response:

1. If the user's message is a CLARIFICATION or DRILL-DOWN on the previous results — run a NEW targeted analysis and output <sim_result>JSON</sim_result> with fresh charts, metrics, and recommendations specific to this new angle. Do NOT repeat the same charts or data from the previous turn. Search for NEW external data relevant to this drill-down.
2. If the user's message is a NEW TOPIC that needs clarification first — ask 1-2 clarifying questions with <options> tags.
3. If the user's message is a SIMPLE QUESTION about the data — answer conversationally (2-3 sentences) without <sim_result> or <options> tags.

For <sim_result> output, follow this schema exactly:
{{
  "thinking_steps": [{{"step":"step name","content":"detail"}}],
  "verdict": "5-8 sentence executive verdict",
  "key_metrics": [{{"label":"name","value":"number","delta":"+X%","positive":true/false}}],
  "charts": [{{"chart_type":"bar|line|area|donut|stacked_bar","title":"Title","x_key":"name","data_keys":["value"],"data":[{{"name":"label","value":number}}],"colors":["#FFB500","#4A2E1C","#2CA58D","#0EA5E9","#7E2D38","#644117"]}}],
  "recommendations": [{{"action":"action","impact":"outcome","urgency":"high|medium|low"}}],
  "sources_used": ["source"],
  "sources": {{
    "data_used": [{{"source":"data source name","detail":"specific data point used","confidence":"high (INTERNAL from portfolio data)|medium (EXTERNAL from Google Search/web)|low (inferred)"}}],
    "reasoning": "1-2 sentences on how you connected the data to reach your conclusion"
  }}
}}
NOTE: Web data (stock prices, news, competitor data from Google Search) = EXTERNAL/medium. Only LIVE PORTFOLIO DATA = INTERNAL/high.

CHART RULES — CRITICAL:
- Charts must be COMPLETELY DIFFERENT from any previous turn — different data, different angles, different chart types
- 3-4 charts with DIFFERENT chart_types, 4-8 data points each, REAL numbers from portfolio data
- Make charts SPECIFIC to the follow-up question, not generic portfolio overviews
- For what-if: show baseline vs projected. For comparison: show specific entities. For trends: show time series.

For <options> output: [{{"id":"opt1","text":"Angle","description":"Why this matters"}}]

EXPLAINABILITY — Sources & Reasoning:
- For text-only and <options> responses (cases 2 and 3), ALWAYS end with a <sources> tag:
  <sources>{{"data_used":[{{"source":"name","detail":"data point","confidence":"high (INTERNAL)|medium (EXTERNAL)|low (inferred)"}}],"reasoning":"brief reasoning chain"}}</sources>
  - Web data (stock prices, news, Google Search results) = EXTERNAL/medium. LIVE PORTFOLIO DATA = INTERNAL/high.
- For <sim_result> responses, include the "sources" field inside the JSON (already in schema above)
- <sources> must be the LAST tag in text/options responses

LIVE PORTFOLIO DATA:
{internal_context}"""


@router.post("/fast/stream")
def fast_simulation_stream(req: schemas.SimStreamRequest, db: Session = Depends(get_db)):
    """Conversational streaming simulation — clarify → analyse → follow-up loop."""
    cxo = db.query(models.CXO).filter(models.CXO.id == req.cxo_id).first()
    if not cxo:
        raise HTTPException(status_code=404, detail="CXO not found")
    firm = db.query(models.Firm).filter(models.Firm.id == cxo.firm_id).first()
    internal_context = _build_internal_context(db, req.cxo_id)

    has_history = req.history and len(req.history) > 0
    replacements = {
        "{{cxo_name}}": cxo.name,
        "{{cxo_title}}": cxo.title,
        "{{firm_name}}": firm.name if firm else "UPS",
        "{internal_context}": internal_context,
    }

    if not has_history:
        # Turn 1: clarify
        template = _SIM_CLARIFY_PROMPT
    elif len(req.history) <= 2:
        # Turn 2: first analysis (user picked an option)
        template = _SIM_ANALYSIS_PROMPT
    else:
        # Turn 3+: follow-up conversation
        template = _SIM_FOLLOWUP_PROMPT

    system_prompt = template
    for k, v in replacements.items():
        system_prompt = system_prompt.replace(k, v)

    history = None
    if req.history:
        history = [{"role": msg.role, "text": msg.text} for msg in req.history]

    user_query = req.query
    if req.document_context:
        user_query += f"\n\nATTACHED DOCUMENT:\n{req.document_context}"

    def event_generator():
        full_text = ""
        try:
            for chunk in stream_chat(system_prompt=system_prompt, message=user_query, history=history):
                if chunk:
                    full_text += chunk
                    yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
        except Exception as e:
            logger.error(f"Sim stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    })


@router.post("/fast/v2", response_model=schemas.FastSimulationRichResponse)
def fast_simulation_v2(req: schemas.SimulationRequest, db: Session = Depends(get_db)):
    internal_context = _build_internal_context(db, req.cxo_id)
    system_prompt = REACT_SYSTEM_PROMPT.format(internal_context=internal_context)

    try:
        client = _get_gemini_client()
        logger.info(f"Simulation with search grounding: {req.query[:80]}")
        raw_text, sources = _gemini_search_query(
            client=client,
            system_prompt=system_prompt,
            user_prompt=req.query,
        )
        parsed = _extract_json(raw_text)

        # Fallback: if parse failed, retry with schema enforcement
        if not parsed:
            logger.info("Direct parse failed, using schema-enforced structuring call")
            structure_prompt = f"""Convert the following research into the required JSON schema. Keep all data, numbers, and insights intact.

ORIGINAL QUERY: {req.query}

RESEARCH OUTPUT:
{raw_text[:6000]}

{f"SEARCH SOURCES: {json.dumps([s.get('title', s.get('url', '')) for s in sources[:5]])}" if sources else ""}

Return ONLY the JSON object matching the schema."""
            raw_retry = _gemini_generate(
                client, system_prompt, structure_prompt,
                schema_model=schemas.FastSimulationRichResponse,
            )
            parsed = _extract_json(raw_retry)
            if not parsed:
                raise ValueError("Could not parse JSON from Gemini response")

        # Inject search sources if AI didn't include them
        if sources and not parsed.get("sources_used"):
            parsed["sources_used"] = [s.get("title", s.get("url", "")) for s in sources[:5]]

        # Ensure charts are never empty — inject fallback if needed
        charts = parsed.get("charts", [])
        valid_charts = [c for c in charts if c.get("data") and any(
            isinstance(d, dict) and d.get("name") and d.get("value", 0) != 0
            for d in c["data"]
        )]
        if not valid_charts:
            parsed["charts"] = _build_fallback_charts(db, req.cxo_id, req.query)

        return schemas.FastSimulationRichResponse(**parsed)

    except Exception as e:
        logger.error(f"Fast simulation v2 failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fast", response_model=schemas.SimulationResponse)
def fast_simulation_legacy(req: schemas.SimulationRequest, db: Session = Depends(get_db)):
    """Legacy endpoint — kept for backwards compatibility."""
    internal_context = _build_internal_context(db, req.cxo_id)
    system_prompt = REACT_SYSTEM_PROMPT.format(internal_context=internal_context)

    try:
        client = _get_gemini_client()
        raw_text, sources = _gemini_search_query(client=client, system_prompt=system_prompt, user_prompt=req.query)

        parsed = _extract_json(raw_text)
        if not parsed:
            logger.info("Legacy: direct parse failed, using schema-enforced call")
            structure_prompt = f"Convert this research into the required JSON schema.\n\nQUERY: {req.query}\n\nRESEARCH:\n{raw_text[:6000]}"
            raw_retry = _gemini_generate(client, system_prompt, structure_prompt, schema_model=schemas.FastSimulationRichResponse)
            parsed = _extract_json(raw_retry)
        if parsed:
            verdict = parsed.get("verdict", "")
            charts = parsed.get("charts", [])
            chart_data = []
            if charts and charts[0].get("data"):
                for pt in charts[0]["data"][:4]:
                    name = pt.get("name", pt.get(charts[0].get("x_key", "name"), ""))
                    val = 0
                    for dk in charts[0].get("data_keys", ["value"]):
                        if dk in pt:
                            val = pt[dk]
                            break
                    chart_data.append({"name": str(name), "value": float(val) if val else 0})

            return schemas.SimulationResponse(
                verdict=verdict,
                chartData=[schemas.DataPoint(**d) for d in chart_data] if chart_data else [
                    schemas.DataPoint(name="Current", value=0),
                    schemas.DataPoint(name="Month 1", value=0),
                    schemas.DataPoint(name="Month 2", value=0),
                    schemas.DataPoint(name="Month 3", value=0),
                ],
            )

        raise ValueError("Could not parse response")

    except Exception as e:
        logger.error(f"Fast simulation legacy failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _extract_json(text: str) -> dict:
    if not text:
        return None

    def ensure_dict(parsed):
        if isinstance(parsed, list):
            if len(parsed) > 0 and isinstance(parsed[0], dict):
                return parsed[0]
            return None
        if isinstance(parsed, dict):
            return parsed
        return None

    # Try direct parse first (fastest path)
    try:
        parsed = json.loads(text.strip())
        res = ensure_dict(parsed)
        if res is not None:
            return res
    except (json.JSONDecodeError, ValueError):
        pass

    # Try extracting from code fences
    match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group(1).strip())
            res = ensure_dict(parsed)
            if res is not None:
                return res
        except (json.JSONDecodeError, ValueError):
            pass

    # Try finding JSON object boundaries
    start = text.find("{")
    if start >= 0:
        depth = 0
        for i in range(start, len(text)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0:
                    try:
                        parsed = json.loads(text[start:i + 1])
                        res = ensure_dict(parsed)
                        if res is not None:
                            return res
                    except (json.JSONDecodeError, ValueError):
                        break

    return None
