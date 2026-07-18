from pydantic import BaseModel
from typing import List, Optional


class SimulationRequest(BaseModel):
    query: str
    cxo_id: int


class HistoryMessage(BaseModel):
    role: str
    text: str


class SimStreamRequest(BaseModel):
    query: str
    cxo_id: int = 1
    history: Optional[List[HistoryMessage]] = None
    document_context: Optional[str] = None


# --- Legacy (kept for backwards compat) ---
class DataPoint(BaseModel):
    name: str
    value: float


class SimulationResponse(BaseModel):
    verdict: str
    chartData: List[DataPoint]


# --- New Rich Fast Simulation ---
class ThinkingStep(BaseModel):
    step: str = ""
    content: str = ""


class KeyMetric(BaseModel):
    label: str = ""
    value: str = ""
    delta: str = ""
    positive: bool = True


class ChartDataPoint(BaseModel):
    name: str = ""
    value: float = 0


class ChartSpec(BaseModel):
    chart_type: str = "bar"
    title: str = ""
    x_key: str = "name"
    data_keys: List[str] = ["value"]
    data: List[ChartDataPoint] = []
    colors: List[str] = ["#FFB500", "#4A2E1C", "#2CA58D", "#0EA5E9", "#7E2D38", "#644117"]


class Recommendation(BaseModel):
    action: str = ""
    impact: str = ""
    urgency: str = "medium"


class FastSimulationRichResponse(BaseModel):
    thinking_steps: List[ThinkingStep] = []
    verdict: str = ""
    key_metrics: List[KeyMetric] = []
    charts: List[ChartSpec] = []
    recommendations: List[Recommendation] = []
    sources_used: List[str] = []
