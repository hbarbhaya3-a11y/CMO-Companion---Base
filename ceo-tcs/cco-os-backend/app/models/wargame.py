from sqlalchemy import Column, Integer, String, Text, JSON
from app.database import Base


class WargameCompetitor(Base):
    __tablename__ = "tx_wargame_competitors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    market_share = Column(String)
    threat_level = Column(String)
    positioning = Column(Text)
    strengths = Column(JSON)
    weaknesses = Column(JSON)
    recent_moves = Column(JSON)
    scenarios = Column(JSON)
    tier = Column(String, default="T1")
    sort_order = Column(Integer, default=0)
