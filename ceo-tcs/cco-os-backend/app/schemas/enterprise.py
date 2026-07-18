from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime


class EnterpriseKPIOut(BaseModel):
    id: int
    label: str
    value: str
    delta: str
    delta_label: str
    status: str
    sub: str
    sort_order: int = 0
    model_config = {"from_attributes": True}


class DAPacketOut(BaseModel):
    id: int
    packet_id: int
    customer: str
    hierarchy: str
    ref_num: str
    sub_ind: str
    analyst: str
    pld_source: str
    construct: str
    bids: list
    scenarios: list
    delta_profit: float
    bid_value: float
    levers_touched: list
    status: str
    urgency: str
    last_update: str
    workstream: str
    model_config = {"from_attributes": True}


class LiveDealOut(BaseModel):
    id: int
    workstream: str
    account: str
    val: float
    end_date: Optional[str] = None
    margin: Optional[float] = None
    risk: Optional[str] = None
    churn: Optional[float] = None
    at_risk: Optional[float] = None
    whitespace: Optional[str] = None
    source: Optional[str] = None
    competitor: Optional[str] = None
    stage: Optional[str] = None
    action: str
    owner: str
    model_config = {"from_attributes": True}


class PricingBridgeOut(BaseModel):
    id: int
    label: str
    val: float
    type: str
    model_config = {"from_attributes": True}


class EntStrategicDealOut(BaseModel):
    id: int
    deal_id: str
    customer: str
    workstream: str
    packet_id: int
    value: float
    stage: str
    urgency: str
    current_or: float
    modeled_or: float
    current_margin: float
    days_to_close: int
    owner: str
    playbook: str
    note: str
    model_config = {"from_attributes": True}


class EntMarginTrajectoryOut(BaseModel):
    id: int
    quarter: str
    sort_order: int
    plan_margin: Optional[float] = None
    actual_margin: Optional[float] = None
    recovery_margin: Optional[float] = None
    model_config = {"from_attributes": True}


class EntSignalEffectOut(BaseModel):
    id: int
    dot: str
    sig_type: str
    title: str
    linked_packets: str
    effect: str
    dollar: str
    color: str
    sort_order: int
    model_config = {"from_attributes": True}


class DealLeverDefinitionOut(BaseModel):
    id: int
    lever_key: str
    category: str
    color_key: str
    title: str
    description: str
    unit: str
    min_val: float
    max_val: float
    step: float
    default_val: float
    options: Optional[List[str]] = None
    constraint: str
    sort_order: int
    model_config = {"from_attributes": True}


class EntInitiativeOut(BaseModel):
    id: int
    initiative_id: str
    name: str
    scope: str
    status: str
    stage: str
    owner: str
    created_date: str
    end_date: Optional[str] = None
    modeled_profit: float
    actual_profit: float
    modeled_margin: float
    actual_margin: float
    notes: str
    levers: list
    affected_packets: int
    model_config = {"from_attributes": True}


class EntInitiativeCreate(BaseModel):
    name: str
    scope: str = "Portfolio · all Enterprise packets"
    status: str = "pending-approval"
    stage: str = "Routed for sign-off"
    owner: str = "M. Guffey (CCO)"
    created_date: Optional[str] = None
    end_date: Optional[str] = None
    modeled_profit: float = 0
    actual_profit: float = 0
    modeled_margin: float = 0
    actual_margin: float = 0
    notes: str = ""
    levers: list = []
    affected_packets: int = 0


class EntLeverActivityOut(BaseModel):
    id: int
    lvl: str
    name: str
    description: str
    packets: int
    pct_touched: int
    color_key: str
    examples: str
    sort_order: int
    model_config = {"from_attributes": True}


class EntPipelineStageOut(BaseModel):
    id: int
    stage: str
    count: int
    color_key: str
    sort_order: int
    model_config = {"from_attributes": True}


class EnterpriseInsightsResponse(BaseModel):
    kpis: List[EnterpriseKPIOut]
    packets: List[DAPacketOut]
    deals: List[LiveDealOut]
    bridge: List[PricingBridgeOut]


class EnterpriseSnapshotResponse(BaseModel):
    kpis: List[EnterpriseKPIOut]
    margin_trajectory: List[EntMarginTrajectoryOut]
    signal_effects: List[EntSignalEffectOut]
    strategic_deals: List[EntStrategicDealOut]


class DAOverviewResponse(BaseModel):
    packets: List[DAPacketOut]
    lever_activity: List[EntLeverActivityOut]
    pipeline_stages: List[EntPipelineStageOut]


class SimulateRequest(BaseModel):
    levers: dict = Field(..., description="Lever key → numeric value map")


class SimulationOption(BaseModel):
    id: int
    label: str
    tag: str
    color_key: str
    rev_lift: float
    margin_lift_bps: float
    profit_lift: float
    leakage_change: float
    win_rate_change: float
    realization_change: float
    risk: str
    confidence: str
    affected_packets: int
    key_moves: List[str]
    autozone_resolution: str


class SimulationResponse(BaseModel):
    outcomes: dict
    options: List[SimulationOption]
    governance_required: List[str]
    affected_packets: int
