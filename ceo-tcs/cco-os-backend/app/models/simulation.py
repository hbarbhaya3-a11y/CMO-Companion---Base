from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, DateTime
from sqlalchemy.sql import func
from app.database import Base


class LeverDefinition(Base):
    __tablename__ = "tx_lever_definitions"
    id = Column(Integer, primary_key=True, index=True)
    lever_id = Column(String, unique=True, index=True)
    lever_group = Column(String, index=True)  # automotive | enterprise | shared
    category = Column(String, index=True)     # marketing | sales | service | pricing | network | partnership | policy | portfolio | deal_mgmt | investment
    name = Column(String)
    description = Column(String)
    unit = Column(String)          # "$M" | "%" | "count" | "days" | "pp" (percentage points)
    min_val = Column(Float)
    max_val = Column(Float)
    default_val = Column(Float)
    step = Column(Float)
    impact_coefficients = Column(JSON)  # {"revenue": 0.8, "margin": 0.3, "win_rate": 0.5, ...}
    interaction_keys = Column(JSON)     # lever_ids this interacts with


class Scenario(Base):
    __tablename__ = "tx_scenarios"
    id = Column(Integer, primary_key=True, index=True)
    cxo_id = Column(Integer, index=True)
    name = Column(String)
    description = Column(String)
    is_preset = Column(Boolean, default=False)
    levers_config = Column(JSON)   # [{lever_id, value}, ...]
    budget = Column(Float)
    time_horizon = Column(String, default="Q")
    pinned_signals = Column(JSON)  # [signal_id, ...]
    gap_closure_pct = Column(Float, nullable=True)
    results_cache = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class ScenarioResult(Base):
    __tablename__ = "tx_scenario_results"
    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, index=True)
    run_at = Column(DateTime, server_default=func.now())
    monte_carlo_iterations = Column(Integer)
    results = Column(JSON)
    sensitivity = Column(JSON)
