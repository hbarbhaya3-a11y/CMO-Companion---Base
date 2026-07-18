from sqlalchemy import Column, Integer, String, Boolean, JSON, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

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
    signal_enrichment = Column(JSON, nullable=True)
    timestamp = Column(String, nullable=True)


class AttentionItem(Base):
    """CXO attention items shown on Home — populated by background monitoring agents.
    Aggregates signals across DA packets, market events, KPI breaches, customer movements.
    Each item carries full investigation context so CTA click opens a fully-loaded chat surface."""
    __tablename__ = "tx_attention_items"
    id = Column(Integer, primary_key=True, index=True)
    cxo_id = Column(Integer, index=True, default=1)
    title = Column(String)
    body = Column(Text)
    tone = Column(String, index=True)        # urgent | amber | green
    tag = Column(String)                     # HIGH PRIORITY | EMERGING RISK | OPPORTUNITY
    category = Column(String, index=True)    # critical | competitive | customer | margin | opportunities | network | macro
    signal_type = Column(String)             # RFP | Competitor | Earnings | M&A | Tariff | Production | Plant | Exec Move | Volume | Healthcare | Override | Network
    impact = Column(String)                  # high | med | low
    source = Column(String)
    cta_label = Column(String)
    cta_action = Column(String)              # frontend view key: investigate | decision | signals | history | deal-workbench | abm-account
    related_packet_id = Column(Integer, nullable=True)
    related_account = Column(String, nullable=True)
    delta_value = Column(String, nullable=True)   # e.g. "+$48M", "-$17M"
    confidence = Column(String, nullable=True)    # e.g. "95%"
    priority_rank = Column(Integer, default=99, index=True)   # lower = higher priority (Home shows top N)
    is_cxo_priority = Column(Boolean, default=True)           # gate for Home visibility
    group_key = Column(String, index=True, default="signals") # signals | objective-1 | objective-2
    source_url = Column(String, nullable=True)                # public source citation URL
    source_date = Column(String, nullable=True)               # publication date for citation
    # Investigation payload — JSON with full context for context-aware chat surface
    # Shape: { seed_question, ai_response, kpis: [{label,val,sub,neg}], follow_ups: [str],
    #          affected_accounts: [str], context_summary, recommended_action }
    investigation_payload = Column(JSON, nullable=True)
    recommended_action_summary = Column(String, nullable=True)
    analysis_by = Column(String, nullable=True)
    strategy_tag = Column(String, nullable=True)         # Grow | Retain | Board Prep
    cta2_label = Column(String, nullable=True)
    cta2_action = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())


class SavedBrief(Base):
    __tablename__ = "tx_saved_briefs"
    id = Column(Integer, primary_key=True, index=True)
    cxo_id = Column(Integer, index=True, default=1)
    context_type = Column(String, index=True)
    context_key = Column(String, index=True)
    stakeholder = Column(String, index=True)
    tone = Column(String, default="confident")
    length = Column(String, default="standard")
    brief_data = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class MemoryItem(Base):
    __tablename__ = "tx_memory_items"
    id = Column(Integer, primary_key=True, index=True)
    cxo_id = Column(Integer, index=True, default=1)
    title = Column(String)
    body = Column(Text)
    status = Column(String, index=True)          # current | resolved
    tags = Column(JSON)                           # [["tag","tone"], ...]
    owners = Column(String, nullable=True)
    region = Column(String, nullable=True)
    coverage = Column(String, nullable=True)
    decision_tree = Column(JSON, nullable=True)   # [{key,label,sub,type,color,parent,order}]
    activity_log = Column(JSON, nullable=True)    # [{id,step,change,context,delta,notes}]
    learnings = Column(JSON, nullable=True)       # [{title,body,category}]
    created_at = Column(DateTime, server_default=func.now())
