from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
import logging

from app.database import get_db
from app.models import domain as domain_models
from app.models.simulation import LeverDefinition, Scenario, ScenarioResult
from app.schemas import deep_simulation as schemas
from app.utils.simulation_engine import run_monte_carlo, generate_preset_lever_settings
from app.utils.llm import _get_gemini_client, _gemini_generate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/simulation", tags=["deep-simulation"])


@router.get("/levers", response_model=List[schemas.LeverDefinitionOut])
def get_levers(db: Session = Depends(get_db)):
    levers = db.query(LeverDefinition).order_by(LeverDefinition.lever_group, LeverDefinition.category).all()
    return levers


@router.get("/scenarios", response_model=List[schemas.ScenarioOut])
def get_scenarios(cxo_id: int = 1, db: Session = Depends(get_db)):
    scenarios = db.query(Scenario).filter(Scenario.cxo_id == cxo_id).all()
    return scenarios


@router.get("/scenarios/{scenario_id}", response_model=schemas.ScenarioOut)
def get_scenario(scenario_id: int, db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.post("/scenarios/save", response_model=schemas.ScenarioOut)
def save_scenario(req: schemas.SaveScenarioRequest, db: Session = Depends(get_db)):
    scenario = Scenario(
        cxo_id=req.cxo_id,
        name=req.name,
        description=req.description,
        is_preset=False,
        levers_config=req.levers_config,
        budget=req.budget,
        time_horizon=req.time_horizon,
        pinned_signals=req.pinned_signals,
        gap_closure_pct=req.gap_closure_pct,
        results_cache=req.results_cache,
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return scenario


@router.post("/deep", response_model=schemas.DeepSimulationResponse)
def deep_simulation(req: schemas.DeepSimulationRequest, db: Session = Depends(get_db)):
    lever_defs_db = db.query(LeverDefinition).all()
    lever_definitions = {
        ld.lever_id: {
            "name": ld.name,
            "description": ld.description,
            "category": ld.category,
            "unit": ld.unit,
            "min_val": ld.min_val,
            "max_val": ld.max_val,
            "default_val": ld.default_val,
            "step": ld.step,
            "impact_coefficients": ld.impact_coefficients or {},
            "interaction_keys": ld.interaction_keys or [],
        }
        for ld in lever_defs_db
    }

    lever_settings = req.levers
    if req.scenario_id:
        scenario = db.query(Scenario).filter(Scenario.id == req.scenario_id).first()
        if scenario and scenario.levers_config:
            lever_settings = [
                schemas.LeverSetting(**ls) for ls in scenario.levers_config
            ]

    if not lever_settings:
        raise HTTPException(status_code=400, detail="No levers provided")

    mc_results = run_monte_carlo(
        lever_settings=lever_settings,
        lever_definitions=lever_definitions,
        budget=req.budget,
        n_iterations=req.monte_carlo_runs,
        time_horizon=req.time_horizon,
    )

    # AI verdict generation via Gemini
    verdict = _generate_verdict(req, mc_results, lever_definitions, db)

    # Enrich interaction warnings with AI context
    warnings = mc_results["interaction_warnings"]
    if warnings:
        ai_warnings = _enrich_warnings(warnings, mc_results, db)
        if ai_warnings:
            warnings = ai_warnings

    scenario_name = "Custom Hybrid"
    if req.scenario_id:
        sc = db.query(Scenario).filter(Scenario.id == req.scenario_id).first()
        if sc:
            scenario_name = sc.name

    return schemas.DeepSimulationResponse(
        scenario_name=scenario_name,
        gap_closure_pct=mc_results["gap_closure_pct"],
        revenue_impact=mc_results["revenue_impact"],
        margin_impact=mc_results["margin_impact"],
        win_rate_impact=mc_results["win_rate_impact"],
        volume_impact=mc_results["volume_impact"],
        lever_results=mc_results["lever_results"],
        sensitivity=mc_results["sensitivity"],
        interaction_warnings=warnings,
        verdict=verdict,
        comparison=mc_results["comparison"],
        chart_data=mc_results["chart_data"],
    )


def _generate_verdict(req, mc_results, lever_definitions, db) -> str:
    cxo = db.query(domain_models.CXO).filter(domain_models.CXO.id == req.cxo_id).first()
    firm = db.query(domain_models.Firm).filter(domain_models.Firm.id == cxo.firm_id).first() if cxo else None

    active_levers = ", ".join([
        f"{lever_definitions.get(ls.lever_id, {}).get('name', ls.lever_id)}: {ls.value}{lever_definitions.get(ls.lever_id, {}).get('unit', '')}"
        for ls in req.levers[:10]
    ])

    revenue = mc_results["revenue_impact"]
    margin = mc_results["margin_impact"]
    win_rate = mc_results["win_rate_impact"]
    gap = mc_results["gap_closure_pct"]

    system_prompt = f"""You are a strategic simulation narrator for {cxo.name if cxo else 'the CCO'}, {cxo.title if cxo else 'Chief Commercial Officer'} at {firm.name if firm else 'UPS'}.

Given simulation results from a Monte Carlo model, write a concise strategic verdict (3-5 sentences).
Be specific, quantitative, and actionable. Reference the actual numbers. Use executive tone — no AI bromides.
Mention which levers drive the most impact and any risks from interaction effects.

Format: plain text, no markdown. Executive briefing style."""

    user_prompt = f"""Simulation Results:
- Gap closure: {gap}%
- Revenue impact: {revenue.p10} to {revenue.p90} $M (P50: {revenue.p50}$M)
- Margin impact: {margin.p10} to {margin.p90} pp (P50: {margin.p50}pp)
- Win rate impact: {win_rate.p10} to {win_rate.p90} pp (P50: {win_rate.p50}pp)
- Budget: ${req.budget}M/quarter
- Time horizon: {req.time_horizon}
- Active levers: {active_levers}
- Top contributors: {', '.join([f"{lr.name} ({lr.contribution_pct}%)" for lr in mc_results['lever_results'][:5]])}
- Interaction warnings: {len(mc_results['interaction_warnings'])} detected"""

    try:
        client = _get_gemini_client()
        verdict = _gemini_generate(client, system_prompt, user_prompt)
        if verdict and verdict != "{}":
            return verdict.strip().strip('"')
    except Exception as e:
        logger.warning(f"Gemini verdict generation failed: {e}")

    return (
        f"This scenario closes {gap}% of the commercial gap with a projected revenue impact of "
        f"${revenue.p50}M (P50) and margin improvement of {margin.p50}pp at ${req.budget}M/quarter budget. "
        f"Win rate uplift of {win_rate.p50}pp is concentrated in the top {len(req.levers)} active levers. "
        f"{'Interaction effects detected — review warnings before committing.' if mc_results['interaction_warnings'] else 'No adverse interaction effects detected.'}"
    )


def _enrich_warnings(warnings, mc_results, db) -> list:
    return warnings
