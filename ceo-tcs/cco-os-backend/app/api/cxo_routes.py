from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import domain as models
from app.schemas import domain as schemas

router = APIRouter(prefix="/api/cxo/{cxo_id}", tags=["cxo"])

@router.get("/home", response_model=List[schemas.HomeCard])
def get_home_cards(cxo_id: int, db: Session = Depends(get_db)):
    cards = db.query(models.HomeCard).filter(models.HomeCard.cxo_id == cxo_id).all()
    if not cards:
        raise HTTPException(status_code=404, detail="No home cards found for CXO")
    return cards

@router.get("/kpis", response_model=List[schemas.KPI])
def get_kpis(cxo_id: int, db: Session = Depends(get_db)):
    kpis = db.query(models.KPI).filter(models.KPI.cxo_id == cxo_id).all()
    return kpis

@router.get("/signals", response_model=List[schemas.SignalListOut])
def get_signals(cxo_id: int, db: Session = Depends(get_db)):
    signals = db.query(models.Signal).filter(models.Signal.cxo_id == cxo_id).all()
    return signals


@router.get("/signals/{signal_id}", response_model=schemas.Signal)
def get_signal_detail(cxo_id: int, signal_id: int, db: Session = Depends(get_db)):
    sig = db.query(models.Signal).filter(
        models.Signal.cxo_id == cxo_id,
        models.Signal.id == signal_id,
    ).first()
    if not sig:
        raise HTTPException(status_code=404, detail="Signal not found")
    return sig


# ============================================================
# ATTENTION ITEMS — CXO Home "What needs your attention"
# Populated by background monitoring agents (later)
# ============================================================
ATTENTION_CATEGORIES = [
    ("all", "All"),
    ("critical", "Critical"),
    ("competitive", "Competitive"),
    ("customer", "Customer"),
    ("margin", "Margin & Pricing"),
    ("opportunities", "Opportunities"),
    ("network", "Network & Capacity"),
    ("macro", "Macro & Policy"),
]


@router.get("/attention", response_model=List[schemas.AttentionItemOut])
def get_attention(
    cxo_id: int,
    category: Optional[str] = Query(None, description="Filter by category key"),
    priority_only: bool = Query(True, description="Only return is_cxo_priority items (Home view)"),
    limit: Optional[int] = Query(None, description="Cap results (Home top-N)"),
    db: Session = Depends(get_db),
):
    """Returns CXO attention items. Home uses priority_only=True (default) so only items
    explicitly flagged for CXO attention surface — not every signal."""
    q = db.query(models.AttentionItem).filter(models.AttentionItem.cxo_id == cxo_id)
    if priority_only:
        q = q.filter(models.AttentionItem.is_cxo_priority == True)
    if category and category != "all":
        q = q.filter(models.AttentionItem.category == category)
    q = q.order_by(models.AttentionItem.priority_rank, models.AttentionItem.sort_order, models.AttentionItem.id)
    if limit:
        q = q.limit(limit)
    return q.all()


@router.get("/attention/categories", response_model=List[schemas.AttentionCategoryOut])
def get_attention_categories(cxo_id: int, db: Session = Depends(get_db)):
    """Returns categories + live counts for filter pills (priority items only)."""
    items = db.query(models.AttentionItem).filter(
        models.AttentionItem.cxo_id == cxo_id,
        models.AttentionItem.is_cxo_priority == True,
    ).all()
    counts = {}
    for it in items:
        counts[it.category] = counts.get(it.category, 0) + 1
    result = []
    for key, label in ATTENTION_CATEGORIES:
        count = len(items) if key == "all" else counts.get(key, 0)
        result.append(schemas.AttentionCategoryOut(key=key, label=label, count=count))
    return result


ATTENTION_GROUPS = [
    {"key":"signals", "label":"Linked to Signals", "sub_label":"Cross-portfolio market intelligence & macro events", "route":"signals"},
    {"key":"objective-1", "label":"Objective I · Automotive Segment Growth", "sub_label":"Account-level ABM plays · Deep Simulation", "route":"decision"},
    {"key":"objective-2", "label":"Objective II · Digital Deal Analyser", "sub_label":"Packet-level pricing intervention · Deep Simulation", "route":"decision"},
]


@router.get("/attention/groups", response_model=List[schemas.AttentionGroupOut])
def get_attention_groups(cxo_id: int, db: Session = Depends(get_db)):
    """Groups for Home — links cards to signals page or to one of two CXO objectives."""
    items = db.query(models.AttentionItem).filter(
        models.AttentionItem.cxo_id == cxo_id,
        models.AttentionItem.is_cxo_priority == True,
    ).all()
    counts = {}
    for it in items:
        counts[it.group_key] = counts.get(it.group_key, 0) + 1
    return [schemas.AttentionGroupOut(**g, count=counts.get(g["key"], 0)) for g in ATTENTION_GROUPS]


@router.get("/attention/{item_id}", response_model=schemas.AttentionItemOut)
def get_attention_item(cxo_id: int, item_id: int, db: Session = Depends(get_db)):
    """Fetch a single attention item — used when frontend deep-links into investigation."""
    item = db.query(models.AttentionItem).filter(
        models.AttentionItem.cxo_id == cxo_id,
        models.AttentionItem.id == item_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Attention item not found")
    return item
