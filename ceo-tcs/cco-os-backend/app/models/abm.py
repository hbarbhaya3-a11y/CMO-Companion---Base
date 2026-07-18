from sqlalchemy import Column, Integer, String, Float, Boolean, JSON
from app.database import Base


class AutoKPI(Base):
    __tablename__ = "tx_auto_kpis"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String)
    value = Column(String)
    delta = Column(String)
    delta_label = Column(String)
    status = Column(String)
    sub = Column(String)


class AutoSubsegment(Base):
    __tablename__ = "tx_auto_subsegments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    rev = Column(Float)
    adv = Column(String)
    rpp = Column(Float)
    margin = Column(Float)
    sow = Column(Integer)
    status = Column(String)


class AutoAccount(Base):
    __tablename__ = "tx_auto_accounts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    tier = Column(String)
    subv = Column(String)
    spend = Column(Float)
    sow = Column(Integer)
    headroom = Column(Float)
    opps = Column(Integer)
    health = Column(String)
    milestone = Column(String)
    abm = Column(String)


class AutoMarketSignal(Base):
    __tablename__ = "tx_auto_market_signals"
    id = Column(Integer, primary_key=True, index=True)
    time = Column(String)
    type = Column(String)
    title = Column(String)
    source = Column(String)
    impact = Column(String)
    conf = Column(Float)
    accounts = Column(JSON)
    why = Column(String)
    action = Column(String)
    signal_enrichment = Column(JSON, nullable=True)


class AutoInitiative(Base):
    __tablename__ = "tx_auto_initiatives"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    pct = Column(Integer)
    items = Column(JSON)
    cta = Column(String)


class ABMAccountDetail(Base):
    __tablename__ = "tx_abm_account_details"
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, index=True)
    name = Column(String)
    tier = Column(String)
    subvertical = Column(String)
    abm_tier = Column(String)
    plan_rev = Column(Float)
    actual_rev = Column(Float)
    gap = Column(Float)
    gap_pct = Column(Float)
    headroom = Column(Float)
    sow = Column(Integer)
    quarters_declining = Column(Integer)
    root_cause = Column(String)
    signals = Column(JSON)
    analog = Column(JSON)
    marketing = Column(JSON)
    as_is = Column(JSON)
    recommended = Column(JSON)
    recommended_lift = Column(JSON)
    play_bullets = Column(JSON)
    status = Column(String, default="declining")


class ABMInitiativeDetail(Base):
    __tablename__ = "tx_abm_initiative_details"
    id = Column(Integer, primary_key=True, index=True)
    initiative_id = Column(String, index=True)
    name = Column(String)
    account = Column(String)
    status = Column(String)
    stage = Column(String)
    owner = Column(String)
    created_date = Column(String)
    end_date = Column(String)
    modeled_rev = Column(Float)
    actual_rev = Column(Float)
    modeled_win_rate = Column(Float)
    actual_win_rate = Column(Float)
    notes = Column(String)
    levers = Column(JSON)
    what_worked = Column(String)
    what_didnt_work = Column(String)
    lesson_learned = Column(String)
