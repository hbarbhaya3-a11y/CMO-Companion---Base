from sqlalchemy import Column, Integer, String, Float, JSON, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class EnterpriseKPI(Base):
    __tablename__ = "tx_enterprise_kpis"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String)
    value = Column(String)
    delta = Column(String)
    delta_label = Column(String)
    status = Column(String)
    sub = Column(String)
    sort_order = Column(Integer, default=0)


class DAPacket(Base):
    __tablename__ = "tx_da_packets"
    id = Column(Integer, primary_key=True, index=True)
    packet_id = Column(Integer, unique=True, index=True)
    customer = Column(String)
    hierarchy = Column(String)
    ref_num = Column(String)
    sub_ind = Column(String)
    analyst = Column(String)
    pld_source = Column(String)
    construct = Column(String)
    bids = Column(JSON)
    scenarios = Column(JSON)
    delta_profit = Column(Float)
    bid_value = Column(Float)
    levers_touched = Column(JSON)
    status = Column(String)
    urgency = Column(String)
    last_update = Column(String)
    workstream = Column(String)


class LiveDeal(Base):
    __tablename__ = "tx_live_deals"
    id = Column(Integer, primary_key=True, index=True)
    workstream = Column(String, index=True)
    account = Column(String)
    val = Column(Float)
    end_date = Column(String, nullable=True)
    margin = Column(Float, nullable=True)
    risk = Column(String, nullable=True)
    churn = Column(Float, nullable=True)
    at_risk = Column(Float, nullable=True)
    whitespace = Column(String, nullable=True)
    source = Column(String, nullable=True)
    competitor = Column(String, nullable=True)
    stage = Column(String, nullable=True)
    action = Column(String)
    owner = Column(String)


class PricingBridge(Base):
    __tablename__ = "tx_pricing_bridge"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String)
    val = Column(Float)
    type = Column(String)


class EntStrategicDeal(Base):
    """Strategic parent deals shown on Enterprise Snapshot."""
    __tablename__ = "tx_ent_strategic_deals"
    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(String, unique=True, index=True)
    customer = Column(String)
    workstream = Column(String, index=True)
    packet_id = Column(Integer, index=True)
    value = Column(Float)
    stage = Column(String)
    urgency = Column(String)
    current_or = Column(Float)
    modeled_or = Column(Float)
    current_margin = Column(Float)
    days_to_close = Column(Integer)
    owner = Column(String)
    playbook = Column(String)
    note = Column(Text)


class EntMarginTrajectory(Base):
    """Plan vs Actual margin trajectory data point."""
    __tablename__ = "tx_ent_margin_trajectory"
    id = Column(Integer, primary_key=True, index=True)
    quarter = Column(String, index=True)
    sort_order = Column(Integer)
    plan_margin = Column(Float, nullable=True)
    actual_margin = Column(Float, nullable=True)
    recovery_margin = Column(Float, nullable=True)


class EntSignalEffect(Base):
    """Market signal → Deal causal effect mapping for Enterprise."""
    __tablename__ = "tx_ent_signal_effects"
    id = Column(Integer, primary_key=True, index=True)
    dot = Column(String)
    sig_type = Column(String)
    title = Column(Text)
    linked_packets = Column(String)
    effect = Column(Text)
    dollar = Column(String)
    color = Column(String)
    sort_order = Column(Integer, default=0)


class DealLeverDefinition(Base):
    """7 CCO intervention levers for Deal Workbench."""
    __tablename__ = "tx_deal_lever_defs"
    id = Column(Integer, primary_key=True, index=True)
    lever_key = Column(String, unique=True, index=True)
    category = Column(String)
    color_key = Column(String)
    title = Column(String)
    description = Column(Text)
    unit = Column(String, default="")
    min_val = Column(Float)
    max_val = Column(Float)
    step = Column(Float)
    default_val = Column(Float)
    options = Column(JSON, nullable=True)
    constraint = Column(String)
    sort_order = Column(Integer, default=0)


class EntInitiative(Base):
    """Past + active Enterprise pricing intervention initiatives."""
    __tablename__ = "tx_ent_initiatives"
    id = Column(Integer, primary_key=True, index=True)
    initiative_id = Column(String, unique=True, index=True)
    name = Column(String)
    scope = Column(String)
    status = Column(String, index=True)
    stage = Column(String)
    owner = Column(String)
    created_date = Column(String)
    end_date = Column(String, nullable=True)
    modeled_profit = Column(Float, default=0)
    actual_profit = Column(Float, default=0)
    modeled_margin = Column(Float, default=0)
    actual_margin = Column(Float, default=0)
    notes = Column(Text)
    levers = Column(JSON)
    affected_packets = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())


class EntLeverActivity(Base):
    """Lever activity heatmap data (L0/L1/L2/L4 packet counts)."""
    __tablename__ = "tx_ent_lever_activity"
    id = Column(Integer, primary_key=True, index=True)
    lvl = Column(String)
    name = Column(String)
    description = Column(Text)
    packets = Column(Integer)
    pct_touched = Column(Integer)
    color_key = Column(String)
    examples = Column(Text)
    sort_order = Column(Integer, default=0)


class EntPipelineStage(Base):
    """Packet pipeline stages."""
    __tablename__ = "tx_ent_pipeline_stages"
    id = Column(Integer, primary_key=True, index=True)
    stage = Column(String)
    count = Column(Integer)
    color_key = Column(String)
    sort_order = Column(Integer, default=0)
