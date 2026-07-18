from pydantic import BaseModel
from typing import List, Optional, Any

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

class Signal(SignalBase):
    id: int
    cxo_id: int
    class Config:
        orm_mode = True
