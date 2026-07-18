from pydantic import BaseModel
from typing import List, Optional


class AutoKPIOut(BaseModel):
    id: int
    label: str
    value: str
    delta: str
    delta_label: str
    status: str
    sub: str

    model_config = {"from_attributes": True}


class AutoSubsegmentOut(BaseModel):
    id: int
    name: str
    rev: float
    adv: str
    rpp: float
    margin: float
    sow: int
    status: str

    model_config = {"from_attributes": True}


class AutoAccountOut(BaseModel):
    id: int
    name: str
    tier: str
    subv: str
    spend: float
    sow: int
    headroom: float
    opps: int
    health: str
    milestone: str
    abm: str

    model_config = {"from_attributes": True}


class AutoMarketSignalOut(BaseModel):
    id: int
    time: str
    type: str
    title: str
    source: str
    impact: str
    conf: float
    accounts: list
    why: str
    action: str
    signal_enrichment: Optional[dict] = None

    model_config = {"from_attributes": True}


class AutoMarketSignalListOut(BaseModel):
    id: int
    time: str
    type: str
    title: str
    source: str
    impact: str
    conf: float
    accounts: list
    why: str
    action: str

    model_config = {"from_attributes": True}


class AutoInitiativeOut(BaseModel):
    id: int
    title: str
    pct: int
    items: list
    cta: str

    model_config = {"from_attributes": True}


class ABMInsightsResponse(BaseModel):
    kpis: List[AutoKPIOut]
    subsegments: List[AutoSubsegmentOut]
    accounts: List[AutoAccountOut]
    signals: List[AutoMarketSignalOut]
    initiatives: List[AutoInitiativeOut]
