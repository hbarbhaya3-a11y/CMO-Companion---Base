from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.abm import AutoKPI, AutoSubsegment, AutoAccount, AutoMarketSignal, AutoInitiative
from app.schemas.abm import ABMInsightsResponse, AutoMarketSignalOut, AutoMarketSignalListOut
from typing import List

router = APIRouter(prefix="/api/abm", tags=["abm"])


@router.get("/insights", response_model=ABMInsightsResponse)
def get_abm_insights(db: Session = Depends(get_db)):
    kpis = db.query(AutoKPI).all()
    subsegments = db.query(AutoSubsegment).all()
    accounts = db.query(AutoAccount).order_by(AutoAccount.spend.desc()).all()
    signals = db.query(AutoMarketSignal).all()
    initiatives = db.query(AutoInitiative).all()
    return ABMInsightsResponse(
        kpis=kpis,
        subsegments=subsegments,
        accounts=accounts,
        signals=signals,
        initiatives=initiatives,
    )


@router.get("/signals", response_model=List[AutoMarketSignalListOut])
def get_market_signals(db: Session = Depends(get_db)):
    return db.query(AutoMarketSignal).all()


@router.get("/signals/{signal_id}", response_model=AutoMarketSignalOut)
def get_market_signal_detail(signal_id: int, db: Session = Depends(get_db)):
    sig = db.query(AutoMarketSignal).filter(AutoMarketSignal.id == signal_id).first()
    if not sig:
        raise HTTPException(status_code=404, detail="Signal not found")
    return sig
