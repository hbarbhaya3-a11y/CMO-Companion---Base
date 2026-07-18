from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ChatSession(Base):
    __tablename__ = "tx_chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    cxo_id = Column(Integer, default=1)
    title = Column(String, default="New Chat")
    created_at = Column(DateTime, server_default=func.now())
    messages = relationship("ChatMessageRecord", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessageRecord.created_at")


class ChatMessageRecord(Base):
    __tablename__ = "tx_chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("tx_chat_sessions.id", ondelete="CASCADE"), index=True)
    role = Column(String)
    text = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    session = relationship("ChatSession", back_populates="messages")


class SimSession(Base):
    __tablename__ = "tx_sim_sessions"
    id = Column(Integer, primary_key=True, index=True)
    cxo_id = Column(Integer, default=1)
    title = Column(String, default="New Simulation")
    created_at = Column(DateTime, server_default=func.now())
    messages = relationship("SimMessageRecord", back_populates="session", cascade="all, delete-orphan", order_by="SimMessageRecord.created_at")


class SimMessageRecord(Base):
    __tablename__ = "tx_sim_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("tx_sim_sessions.id", ondelete="CASCADE"), index=True)
    role = Column(String)
    text = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    session = relationship("SimSession", back_populates="messages")
