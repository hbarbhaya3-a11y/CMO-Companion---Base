from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone, timedelta

_EST = timezone(timedelta(hours=-5))
def _est_now():
    return datetime.now(_EST)

from app.database import get_db
from app.models.enterprise import (
    EnterpriseKPI, DAPacket, LiveDeal, PricingBridge,
    EntStrategicDeal, EntMarginTrajectory, EntSignalEffect,
    DealLeverDefinition, EntInitiative, EntLeverActivity, EntPipelineStage,
)
from app.schemas.enterprise import (
    EnterpriseInsightsResponse, EnterpriseSnapshotResponse, DAOverviewResponse,
    DAPacketOut, DealLeverDefinitionOut, EntInitiativeOut, EntInitiativeCreate,
    SimulateRequest, SimulationResponse, SimulationOption,
)

router = APIRouter(prefix="/api/enterprise", tags=["enterprise"])


@router.get("/insights", response_model=EnterpriseInsightsResponse)
def get_enterprise_insights(db: Session = Depends(get_db)):
    kpis = db.query(EnterpriseKPI).order_by(EnterpriseKPI.sort_order).all()
    packets = db.query(DAPacket).all()
    deals = db.query(LiveDeal).all()
    bridge = db.query(PricingBridge).all()
    return EnterpriseInsightsResponse(kpis=kpis, packets=packets, deals=deals, bridge=bridge)


@router.get("/snapshot", response_model=EnterpriseSnapshotResponse)
def get_enterprise_snapshot(db: Session = Depends(get_db)):
    """Landing screen for Objective 2 — Enterprise Business Snapshot."""
    kpis = db.query(EnterpriseKPI).order_by(EnterpriseKPI.sort_order).all()
    margin_traj = db.query(EntMarginTrajectory).order_by(EntMarginTrajectory.sort_order).all()
    signal_effects = db.query(EntSignalEffect).order_by(EntSignalEffect.sort_order).all()
    strategic_deals = db.query(EntStrategicDeal).all()
    return EnterpriseSnapshotResponse(
        kpis=kpis, margin_trajectory=margin_traj,
        signal_effects=signal_effects, strategic_deals=strategic_deals,
    )


@router.get("/da-overview", response_model=DAOverviewResponse)
def get_da_overview(db: Session = Depends(get_db)):
    """Deal Analyser Snapshot — bird's eye view of packets + lever activity + pipeline."""
    packets = db.query(DAPacket).all()
    lever_activity = db.query(EntLeverActivity).order_by(EntLeverActivity.sort_order).all()
    pipeline = db.query(EntPipelineStage).order_by(EntPipelineStage.sort_order).all()
    return DAOverviewResponse(packets=packets, lever_activity=lever_activity, pipeline_stages=pipeline)


@router.get("/packets", response_model=List[DAPacketOut])
def get_packets(db: Session = Depends(get_db)):
    return db.query(DAPacket).all()


@router.get("/packets/{packet_id}", response_model=DAPacketOut)
def get_packet(packet_id: int, db: Session = Depends(get_db)):
    pkt = db.query(DAPacket).filter(DAPacket.packet_id == packet_id).first()
    if not pkt:
        raise HTTPException(status_code=404, detail="Packet not found")
    return pkt


@router.get("/deal-levers", response_model=List[DealLeverDefinitionOut])
def get_deal_levers(db: Session = Depends(get_db)):
    """7 CCO intervention levers for Deal Experimentation Workbench."""
    return db.query(DealLeverDefinition).order_by(DealLeverDefinition.sort_order).all()


@router.get("/initiatives", response_model=List[EntInitiativeOut])
def get_initiatives(db: Session = Depends(get_db)):
    return db.query(EntInitiative).order_by(EntInitiative.created_at.desc()).all()


@router.post("/initiatives", response_model=EntInitiativeOut)
def create_initiative(payload: EntInitiativeCreate, db: Session = Depends(get_db)):
    iid = f"PINI-{_est_now().strftime('%Y-%m')}-{_est_now().strftime('%H%M%S')}"
    ini = EntInitiative(
        initiative_id=iid,
        name=payload.name,
        scope=payload.scope,
        status=payload.status,
        stage=payload.stage,
        owner=payload.owner,
        created_date=payload.created_date or _est_now().strftime("%b %d, %Y"),
        end_date=payload.end_date,
        modeled_profit=payload.modeled_profit,
        actual_profit=payload.actual_profit,
        modeled_margin=payload.modeled_margin,
        actual_margin=payload.actual_margin,
        notes=payload.notes,
        levers=payload.levers,
        affected_packets=payload.affected_packets,
    )
    db.add(ini)
    db.commit()
    db.refresh(ini)
    return ini


# ============================================================
# SIMULATION ENGINE — deterministic causal model
# ============================================================
BASELINE = {
    "ent_rev": 9420.0, "margin": 6.2, "leakage": 46.0,
    "realization": 84.0, "win_rate": 68.0, "modeled_profit": 810.0,
}


def _compute_outcomes(levers: dict) -> dict:
    l2 = levers.get("l2Ceiling", 1)
    l0 = levers.get("l0Floor", 150)
    l1 = levers.get("l1AccCeiling", 20)
    l4 = levers.get("l4ZoneMin", 1)
    rigor = levers.get("scenarioRigor", 3)
    overlay = levers.get("seniorAnalyst", 20)
    posture = levers.get("macroPosture", 1)

    l2_delta = l2 - 1
    l0_delta = l0 - 150
    l1_delta = 20 - l1
    l4_mult = l4 - 1
    rigor_delta = rigor - 3
    overlay_delta = overlay - 20
    posture_mult = 1.0 if posture == 0 else -0.6 if posture == 2 else 0.3

    margin_lift = (-l2_delta * 0.12 + l0_delta * 0.05 + l1_delta * 0.06
                   + l4_mult * 0.18 + rigor_delta * 0.08 + overlay_delta * 0.018
                   + posture_mult * 0.05)
    rev_lift = (l2_delta * 8 + l0_delta * 12 - l1_delta * 4
                + overlay_delta * 4.2 + posture_mult * 22 + rigor_delta * 14)
    leakage_change = (-(l1_delta * 6) - (abs(l2_delta) * 4 if l2_delta > 0 else 0)
                      - (overlay_delta * 0.5))
    win_rate_change = (l2_delta * 0.4) + overlay_delta * 0.12 + posture_mult * -0.8 + (l1_delta * -0.2)
    real_change = l1_delta * 0.6 + l0_delta * 0.05 + overlay_delta * 0.05 + l4_mult * 1.4 + rigor_delta * 0.6
    profit_lift = l0_delta * 18 + l2_delta * 6 + l1_delta * 5 + l4_mult * 24 + overlay_delta * 4 + posture_mult * 18

    affected = 0
    if l2 != 1: affected += 23
    if l0 != 150: affected += 64
    if l1 != 20: affected += 142
    if l4 != 1: affected += 89
    if rigor != 3: affected += 187
    if overlay != 20: affected += abs(overlay - 20)
    affected = min(187, affected)

    return {
        "ent_rev_new": BASELINE["ent_rev"] + rev_lift,
        "margin_new": BASELINE["margin"] + margin_lift,
        "leakage_new": max(0.0, BASELINE["leakage"] + leakage_change),
        "realization_new": min(100.0, max(0.0, BASELINE["realization"] + real_change)),
        "win_rate_new": BASELINE["win_rate"] + win_rate_change,
        "modeled_profit_new": BASELINE["modeled_profit"] + profit_lift,
        "rev_lift": rev_lift, "margin_lift": margin_lift,
        "leakage_change": leakage_change, "win_rate_change": win_rate_change,
        "realization_change": real_change, "profit_lift": profit_lift,
        "affected_packets": affected,
    }


def _compute_governance(levers: dict) -> list:
    required = []
    if levers.get("l2Ceiling", 1) != 1:
        required.extend(["CFO", "Pricing Committee"])
    if levers.get("l0Floor", 150) != 150:
        required.append("CFO")
    if levers.get("l1AccCeiling", 20) != 20:
        required.extend(["VP Revenue Management", "CFO"])
    if levers.get("l4ZoneMin", 1) != 1:
        required.append("CFO")
    if levers.get("macroPosture", 1) != 1:
        required.append("CEO")
    if levers.get("scenarioRigor", 3) != 3 or levers.get("seniorAnalyst", 20) != 20:
        required.append("VP Revenue Management")
    return list(dict.fromkeys(required))


@router.post("/simulate", response_model=SimulationResponse)
def simulate(req: SimulateRequest):
    outcomes = _compute_outcomes(req.levers)
    governance = _compute_governance(req.levers)

    base_rev = outcomes["rev_lift"] or 8.0
    base_margin = outcomes["margin_lift"] * 100 or 50.0
    base_profit = outcomes["profit_lift"] or 24.0

    options = [
        SimulationOption(
            id=0, label="Defensive", tag="Tightest guardrails · max margin protection", color_key="green",
            rev_lift=round(base_rev * 0.45) or 4,
            margin_lift_bps=round(base_margin * 1.35) or 78,
            profit_lift=round(base_profit * 1.25) or 34,
            leakage_change=-22.0, win_rate_change=-1.4, realization_change=4.0,
            risk="Low (margin)", confidence="P50 · ±$8M", affected_packets=142,
            key_moves=[
                "L2 Tier ceiling: 66.8% (sub-TARGET · tight)",
                "L1 Accessorial ceiling: 16% Off (–4pp)",
                "L0 DIM Divisor floor: 156",
                "L4 Zone Min: Raise 5%",
                "AutoZone S3: not approved · re-stage required",
            ],
            autozone_resolution="blocked",
        ),
        SimulationOption(
            id=1, label="Balanced · Recommended", tag="Margin recovery + AutoZone resolution path", color_key="gold",
            rev_lift=round(base_rev * 0.85) or 12,
            margin_lift_bps=round(base_margin * 0.9) or 60,
            profit_lift=round(base_profit * 1.1) or 28,
            leakage_change=-14.0, win_rate_change=0.0, realization_change=3.0,
            risk="Medium", confidence="P50 · ±$12M", affected_packets=178,
            key_moves=[
                "L2 Tier ceiling: 119.3% (above TARGET · enables AutoZone S3)",
                "L1 Accessorial ceiling: 18% Off (–2pp)",
                "L0 DIM Divisor floor: 154",
                "Senior analyst overlay: 25 packets",
                "AutoZone S3: approved · single-use",
            ],
            autozone_resolution="partial",
        ),
        SimulationOption(
            id=2, label="Aggressive", tag="Permissive policy · captures share at margin cost", color_key="amber",
            rev_lift=round(base_rev * 1.4) or 22,
            margin_lift_bps=round(base_margin * 0.3) or 22,
            profit_lift=round(base_profit * 0.6) or 16,
            leakage_change=8.0, win_rate_change=3.2, realization_change=-1.0,
            risk="Higher", confidence="P50 · ±$18M", affected_packets=187,
            key_moves=[
                "L2 Tier ceiling: 143.1% (max bracket)",
                "L1 Accessorial ceiling: 22% Off (+2pp)",
                "L0 DIM Divisor floor: 150 (hold)",
                "Macro posture: Aggressive",
                "AutoZone S3: approved as normal · sets precedent",
            ],
            autozone_resolution="resolved",
        ),
    ]

    return SimulationResponse(
        outcomes=outcomes, options=options,
        governance_required=governance, affected_packets=outcomes["affected_packets"],
    )
