from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

class HomeCardBase(BaseModel):
    tone: str
    tag: str
    title: str
    body: str
    cta: str
    to_view: str

class HomeCard(HomeCardBase):
    id: int
    cxo_id: int
    class Config:
        orm_mode = True


class AttentionItemOut(BaseModel):
    id: int
    cxo_id: int
    title: str
    body: str
    tone: str
    tag: str
    category: str
    signal_type: str
    impact: str
    source: str
    cta_label: str
    cta_action: str
    related_packet_id: Optional[int] = None
    related_account: Optional[str] = None
    delta_value: Optional[str] = None
    confidence: Optional[str] = None
    priority_rank: int = 99
    is_cxo_priority: bool = True
    group_key: str = "signals"
    source_url: Optional[str] = None
    source_date: Optional[str] = None
    investigation_payload: Optional[dict] = None
    recommended_action_summary: Optional[str] = None
    analysis_by: Optional[str] = None
    strategy_tag: Optional[str] = None
    cta2_label: Optional[str] = None
    cta2_action: Optional[str] = None
    sort_order: int = 0
    model_config = {"from_attributes": True}


class AttentionGroupOut(BaseModel):
    key: str          # signals | objective-1 | objective-2
    label: str        # display label
    sub_label: str    # description
    route: str        # frontend view to navigate to when clicking group header
    count: int        # number of items in this group


class AttentionCategoryOut(BaseModel):
    key: str
    label: str
    count: int

class KPIBase(BaseModel):
    label: str
    val: str
    sub: str
    chip: str
    note: str
    spark: List[int]
    up: bool

class KPI(KPIBase):
    id: int
    cxo_id: int
    class Config:
        orm_mode = True

class SignalBase(BaseModel):
    tag: str
    tone: str
    title: str
    metric: Optional[str] = None
    delta: Optional[str] = None
    delta_neg: Optional[bool] = False
    desc: Optional[str] = None
    why: Optional[str] = None
    src: Optional[str] = None
    ago: Optional[str] = None
    rows: Optional[List[List[str]]] = None
    next_action: Optional[str] = None
    open: Optional[bool] = False
    is_row2: Optional[bool] = False
    signal_enrichment: Optional[dict] = None
    timestamp: Optional[str] = None

class Signal(SignalBase):
    id: int
    cxo_id: int
    class Config:
        orm_mode = True

class SignalListOut(BaseModel):
    id: int
    tag: str
    tone: str
    title: str
    metric: Optional[str] = None
    delta: Optional[str] = None
    delta_neg: Optional[bool] = False
    desc: Optional[str] = None
    why: Optional[str] = None
    src: Optional[str] = None
    ago: Optional[str] = None
    is_row2: Optional[bool] = False
    timestamp: Optional[str] = None
    class Config:
        orm_mode = True

class SimulationToMemoryRequest(BaseModel):
    simulation_title: str
    simulation_summary: str
    simulation_type: str  # lite | abm | enterprise
    levers: Optional[list] = None
    metrics: Optional[list] = None
    query: Optional[str] = None
    recommendations: Optional[list] = None
    conversation_trail: Optional[list] = None
    sources_used: Optional[list] = None


class MemoryItemOut(BaseModel):
    id: int
    cxo_id: int
    title: str
    body: str
    status: str
    tags: list
    owners: Optional[str] = None
    region: Optional[str] = None
    coverage: Optional[str] = None
    decision_tree: Optional[list] = None
    activity_log: Optional[list] = None
    learnings: Optional[list] = None
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    cxo_id: int
    session_id: Optional[int] = None
    history: Optional[List[ChatMessage]] = None
    signal_context: Optional[str] = None
    section_context: Optional[str] = None
    view_context: Optional[str] = None
    document_context: Optional[str] = None
    provider: Optional[str] = None  # "gemini" | "slm" — overrides settings.LLM_PROVIDER

class ChatResponse(BaseModel):
    reply: str
    session_id: int
