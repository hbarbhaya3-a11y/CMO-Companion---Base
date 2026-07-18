from sqlalchemy import Column, Integer, String, Boolean, JSON
from database import Base

class Firm(Base):
    __tablename__ = "tx_firms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    industry = Column(String)

class CXO(Base):
    __tablename__ = "tx_cxos"
    id = Column(Integer, primary_key=True, index=True)
    firm_id = Column(Integer)
    name = Column(String)
    title = Column(String)

class HomeCard(Base):
    __tablename__ = "tx_home_cards"
    id = Column(Integer, primary_key=True, index=True)
    cxo_id = Column(Integer)
    tone = Column(String)  # urgent, amber, green
    tag = Column(String)
    title = Column(String)
    body = Column(String)
    cta = Column(String)
    to_view = Column(String)

class KPI(Base):
    __tablename__ = "tx_kpis"
    id = Column(Integer, primary_key=True, index=True)
    cxo_id = Column(Integer)
    label = Column(String)
    val = Column(String)
    sub = Column(String)
    chip = Column(String)
    note = Column(String)
    spark = Column(JSON)  # array of numbers
    up = Column(Boolean)

class Signal(Base):
    __tablename__ = "tx_signals"
    id = Column(Integer, primary_key=True, index=True)
    cxo_id = Column(Integer)
    tag = Column(String)
    tone = Column(String)
    title = Column(String)
    metric = Column(String, nullable=True)
    delta = Column(String, nullable=True)
    delta_neg = Column(Boolean, default=False)
    desc = Column(String, nullable=True)
    why = Column(String, nullable=True)
    src = Column(String, nullable=True)
    ago = Column(String, nullable=True)
    rows = Column(JSON, nullable=True)  # array of arrays
    next_action = Column(String, nullable=True)
    open = Column(Boolean, default=False)
    is_row2 = Column(Boolean, default=False)  # For the second row smaller signals
