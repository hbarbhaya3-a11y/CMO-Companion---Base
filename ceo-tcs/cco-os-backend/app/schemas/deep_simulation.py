from pydantic import BaseModel
from typing import List, Optional


class LeverSetting(BaseModel):
    lever_id: str
    value: float


class DeepSimulationRequest(BaseModel):
    levers: List[LeverSetting]
    budget: float = 7.2
    scenario_id: Optional[int] = None
    time_horizon: str = "Q"
    pinned_signals: List[int] = []
    monte_carlo_runs: int = 1000
    cxo_id: int = 1


class MetricBand(BaseModel):
    label: str
    p10: float
    p50: float
    p90: float
    unit: str = ""


class LeverResult(BaseModel):
    lever_id: str
    name: str
    category: str
    contribution_pct: float
    revenue_delta: float
    margin_delta: float


class SensitivityItem(BaseModel):
    lever_name: str
    lever_id: str
    low_impact: float
    high_impact: float
    base_impact: float


class TimeSeriesPoint(BaseModel):
    period: str
    baseline: float
    projected: float
    p10: float
    p90: float


class ComparisonPath(BaseModel):
    label: str
    gap_closure: float
    revenue: float
    margin: float
    win_rate: float


class ComparisonData(BaseModel):
    do_nothing: ComparisonPath
    recommended: ComparisonPath
    hybrid: ComparisonPath


class InteractionWarning(BaseModel):
    message: str
    severity: str  # "info" | "warning" | "critical"
    lever_ids: List[str]


class DeepSimulationResponse(BaseModel):
    scenario_name: str
    gap_closure_pct: float
    revenue_impact: MetricBand
    margin_impact: MetricBand
    win_rate_impact: MetricBand
    volume_impact: MetricBand
    lever_results: List[LeverResult]
    sensitivity: List[SensitivityItem]
    interaction_warnings: List[InteractionWarning]
    verdict: str
    comparison: ComparisonData
    chart_data: List[TimeSeriesPoint]


class LeverDefinitionOut(BaseModel):
    lever_id: str
    lever_group: str
    category: str
    name: str
    description: str
    unit: str
    min_val: float
    max_val: float
    default_val: float
    step: float

    class Config:
        orm_mode = True


class ScenarioOut(BaseModel):
    id: int
    name: str
    description: str
    is_preset: bool
    levers_config: Optional[list] = None
    budget: Optional[float] = None
    time_horizon: Optional[str] = None
    gap_closure_pct: Optional[float] = None

    class Config:
        orm_mode = True


class SaveScenarioRequest(BaseModel):
    cxo_id: int = 1
    name: str
    description: str = ""
    levers_config: list
    budget: float
    time_horizon: str = "Q"
    pinned_signals: list = []
    gap_closure_pct: Optional[float] = None
    results_cache: Optional[dict] = None
