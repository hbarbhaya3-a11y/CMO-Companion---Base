from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
import logging

from app.database import get_db
from app.models.chat import SimSession, SimMessageRecord

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/sim-history", tags=["sim-history"])


@router.get("/sessions")
def list_sessions(cxo_id: int = 1, db: Session = Depends(get_db)):
    sessions = (
        db.query(SimSession)
        .filter(SimSession.cxo_id == cxo_id)
        .order_by(SimSession.created_at.desc())
        .all()
    )
    result = []
    for s in sessions:
        msg_count = db.query(func.count(SimMessageRecord.id)).filter(SimMessageRecord.session_id == s.id).scalar()
        first_msg = (
            db.query(SimMessageRecord)
            .filter(SimMessageRecord.session_id == s.id, SimMessageRecord.role == "user")
            .order_by(SimMessageRecord.created_at)
            .first()
        )
        result.append({
            "id": s.id,
            "title": s.title,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "message_count": msg_count,
            "preview": (first_msg.text[:80] + "...") if first_msg and len(first_msg.text) > 80 else (first_msg.text if first_msg else ""),
        })
    return result


@router.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: int, db: Session = Depends(get_db)):
    session = db.query(SimSession).filter(SimSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    messages = (
        db.query(SimMessageRecord)
        .filter(SimMessageRecord.session_id == session_id)
        .order_by(SimMessageRecord.created_at)
        .all()
    )
    return {
        "session_id": session.id,
        "title": session.title,
        "messages": [
            {"role": m.role, "text": m.text, "created_at": m.created_at.isoformat() if m.created_at else None}
            for m in messages
        ],
    }


class CreateSessionReq(BaseModel):
    cxo_id: int = 1
    title: Optional[str] = "New Simulation"


@router.post("/sessions")
def create_session(req: CreateSessionReq, db: Session = Depends(get_db)):
    session = SimSession(cxo_id=req.cxo_id, title=req.title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "title": session.title, "created_at": session.created_at.isoformat() if session.created_at else None}


class SaveMessageReq(BaseModel):
    role: str
    text: str


@router.post("/sessions/{session_id}/messages")
def save_message(session_id: int, req: SaveMessageReq, db: Session = Depends(get_db)):
    session = db.query(SimSession).filter(SimSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    msg = SimMessageRecord(session_id=session_id, role=req.role, text=req.text)
    db.add(msg)
    db.commit()
    return {"ok": True}


@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(SimSession).filter(SimSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    db.delete(session)
    db.commit()
    return {"ok": True}
