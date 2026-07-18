from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging

from app.database import get_db
from app.models.chat import ChatSession, ChatMessageRecord

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat-history", tags=["chat-history"])


@router.get("/sessions")
def list_sessions(cxo_id: int = 1, db: Session = Depends(get_db)):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.cxo_id == cxo_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    result = []
    for s in sessions:
        msg_count = db.query(func.count(ChatMessageRecord.id)).filter(ChatMessageRecord.session_id == s.id).scalar()
        first_msg = (
            db.query(ChatMessageRecord)
            .filter(ChatMessageRecord.session_id == s.id, ChatMessageRecord.role == "user")
            .order_by(ChatMessageRecord.created_at)
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
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    messages = (
        db.query(ChatMessageRecord)
        .filter(ChatMessageRecord.session_id == session_id)
        .order_by(ChatMessageRecord.created_at)
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


@router.post("/sessions")
def create_session(cxo_id: int = 1, db: Session = Depends(get_db)):
    session = ChatSession(cxo_id=cxo_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "title": session.title, "created_at": session.created_at.isoformat() if session.created_at else None}


@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    db.delete(session)
    db.commit()
    return {"ok": True}


@router.patch("/sessions/{session_id}")
def update_session(session_id: int, title: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    session.title = title
    db.commit()
    return {"ok": True}
