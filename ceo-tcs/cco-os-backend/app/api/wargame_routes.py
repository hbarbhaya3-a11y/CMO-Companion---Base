from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
import logging
import math
import random
import re

from app.database import get_db
from app.models.wargame import WargameCompetitor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/wargame", tags=["wargame"])

UPS_MARKET_SHARE = 24.0


# ── Schemas ──────────────────────────────────────────────────────

class WargameSimRequest(BaseModel):
    competitor_id: int
    our_pricing: float = Field(ge=10, le=90)
    our_innovation: float = Field(ge=10, le=90)
    their_pricing: float = Field(ge=10, le=90)
    their_innovation: float = Field(ge=10, le=90)
    runs: Optional[int] = Field(default=1000, ge=100, le=10000)


class SharePercentiles(BaseModel):
    p10: float
    p50: float
    p90: float


class WargameSimResponse(BaseModel):
    ourShare: SharePercentiles
    theirShare: SharePercentiles
    winRate: int
    runs: int
    competitor_name: str
    battle_analysis: Optional[str] = None


# ── Monte Carlo Engine ───────────────────────────────────────────

def _parse_share(raw: Optional[str]) -> float:
    if not raw:
        return 10.0
    cleaned = re.sub(r"[^0-9.]", "", raw)
    try:
        val = float(cleaned)
        return val if val > 0 else 10.0
    except (ValueError, TypeError):
        return 10.0


def _gauss_random(mean: float, std: float) -> float:
    u, v = 0.0, 0.0
    while u == 0.0:
        u = random.random()
    while v == 0.0:
        v = random.random()
    return mean + std * math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v)


def run_wargame_sim(our_share, their_share, our_spend, their_spend, our_innovation, their_innovation, runs=1000):
    results = []
    for _ in range(runs):
        sim_our_spend = _gauss_random(our_spend, 0.15)
        sim_their_spend = _gauss_random(their_spend, 0.20)
        sim_our_innov = _gauss_random(our_innovation, 0.15)
        sim_their_innov = _gauss_random(their_innovation, 0.15)
        mkt_sentiment = _gauss_random(0, 0.1)

        sim_our = our_share * (
            1
            + (sim_our_spend - sim_their_spend) * 0.08
            + (sim_our_innov - sim_their_innov) * 0.05
            + mkt_sentiment
        )
        sim_their = their_share * (
            1
            - (sim_our_spend - sim_their_spend) * 0.06
            + (sim_their_innov - sim_our_innov) * 0.04
            - mkt_sentiment
        )
        sim_our = max(1.0, min(60.0, sim_our))
        sim_their = max(1.0, min(60.0, sim_their))
        results.append({"our": round(sim_our, 1), "their": round(sim_their, 1), "delta": round(sim_our - sim_their, 1)})

    def pct(arr):
        s = sorted(arr)
        n = len(s)
        return {"p10": round(s[int(n * 0.1)], 1), "p50": round(s[int(n * 0.5)], 1), "p90": round(s[int(n * 0.9)], 1)}

    win_count = sum(1 for r in results if r["delta"] > 0)
    return {
        "ourShare": pct([r["our"] for r in results]),
        "theirShare": pct([r["their"] for r in results]),
        "winRate": round((win_count / runs) * 100),
        "runs": runs,
    }


# ── Routes ───────────────────────────────────────────────────────

@router.get("/competitors")
def get_competitors(db: Session = Depends(get_db)):
    competitors = db.query(WargameCompetitor).order_by(WargameCompetitor.sort_order).all()
    return [
        {
            "id": c.id, "name": c.name, "market_share": c.market_share,
            "threat_level": c.threat_level, "positioning": c.positioning,
            "strengths": c.strengths or [], "weaknesses": c.weaknesses or [],
            "recent_moves": c.recent_moves or [], "scenarios": c.scenarios or [],
            "tier": c.tier, "sort_order": c.sort_order,
        }
        for c in competitors
    ]


@router.post("/simulate", response_model=WargameSimResponse)
def simulate_wargame(req: WargameSimRequest, db: Session = Depends(get_db)):
    competitor = db.query(WargameCompetitor).filter(WargameCompetitor.id == req.competitor_id).first()
    if not competitor:
        raise HTTPException(404, "Competitor not found")

    our_share = UPS_MARKET_SHARE
    their_share = _parse_share(competitor.market_share)

    try:
        result = run_wargame_sim(
            our_share=our_share,
            their_share=their_share,
            our_spend=req.our_pricing / 50,
            their_spend=req.their_pricing / 50,
            our_innovation=req.our_innovation / 100,
            their_innovation=req.their_innovation / 100,
            runs=req.runs or 1000,
        )
    except Exception as e:
        logger.error(f"Simulation engine error: {e}")
        raise HTTPException(500, f"Simulation engine failed: {e}")

    result["competitor_name"] = competitor.name

    # LLM battle analysis via Vertex AI Gemini
    try:
        from app.utils.llm import _get_gemini_client, _gemini_generate
        system_prompt = "You are a strategic competitive intelligence analyst for UPS. Analyze the results of a market share simulation and provide a concise 'Battle Analysis' (2-3 sentences). Focus on why the win rate is high or low based on the strategy levers. Don't mention raw slider numbers — use terms like 'aggressive pricing', 'innovation focus', etc."
        message = f"""Simulation: UPS ({our_share}%) vs {competitor.name} ({competitor.market_share})
Win Rate: {result['winRate']}% | Our Median Share: {result['ourShare']['p50']}% | Their Median: {result['theirShare']['p50']}%
Our Pricing: {req.our_pricing}/90 | Our Innovation: {req.our_innovation}/90
Their Pricing: {req.their_pricing}/90 | Their Innovation: {req.their_innovation}/90
Competitor Strengths: {', '.join(competitor.strengths or [])}
Competitor Weaknesses: {', '.join(competitor.weaknesses or [])}"""
        client = _get_gemini_client()
        analysis = _gemini_generate(client, system_prompt, message)
        result["battle_analysis"] = analysis if analysis and analysis != "{}" else None
    except Exception as e:
        logger.error(f"LLM analysis failed: {e}")
        result["battle_analysis"] = None

    return result
