from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.db.database import get_db
from src.db.models import Idea, Approval, WebsiteChange

router = APIRouter()


class DecisionBody(BaseModel):
    notes: str | None = None


# ─── Ideas ──────────────────────────────────────────────────────

@router.get("/ideas")
def pending_ideas(db: Session = Depends(get_db)):
    ideas = (
        db.query(Idea)
        .filter(Idea.status == "pending")
        .order_by(Idea.created_at.desc())
        .all()
    )
    return [
        {
            "id": i.id,
            "title": i.title,
            "body": i.body,
            "evidence": i.evidence,
            "status": i.status,
            "created_at": i.created_at.isoformat() if i.created_at else None,
        }
        for i in ideas
    ]


@router.get("/ideas/all")
def all_ideas(db: Session = Depends(get_db)):
    ideas = db.query(Idea).order_by(Idea.created_at.desc()).limit(50).all()
    return [
        {
            "id": i.id,
            "title": i.title,
            "body": i.body,
            "evidence": i.evidence,
            "status": i.status,
            "rejection_notes": i.rejection_notes,
            "created_at": i.created_at.isoformat() if i.created_at else None,
        }
        for i in ideas
    ]


@router.post("/ideas/{idea_id}/approve")
def approve_idea(idea_id: int, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    idea.status = "approved"
    approval = Approval(item_type="idea", item_id=idea_id, decision="approved")
    db.add(approval)
    db.commit()
    return {"status": "approved", "id": idea_id}


@router.post("/ideas/{idea_id}/reject")
def reject_idea(idea_id: int, body: DecisionBody, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    idea.status = "rejected"
    idea.rejection_notes = body.notes
    approval = Approval(
        item_type="idea", item_id=idea_id,
        decision="rejected", notes=body.notes,
    )
    db.add(approval)
    db.commit()
    return {"status": "rejected", "id": idea_id}


# ─── Website Changes ────────────────────────────────────────────

@router.get("/website")
def pending_website_changes(db: Session = Depends(get_db)):
    changes = (
        db.query(WebsiteChange)
        .filter(WebsiteChange.status == "pending")
        .order_by(WebsiteChange.created_at.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "change_type": c.change_type,
            "description": c.description,
            "payload": c.payload,
            "status": c.status,
            "idea_id": c.idea_id,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in changes
    ]


@router.get("/website/all")
def all_website_changes(db: Session = Depends(get_db)):
    changes = db.query(WebsiteChange).order_by(WebsiteChange.created_at.desc()).limit(50).all()
    return [
        {
            "id": c.id,
            "change_type": c.change_type,
            "description": c.description,
            "payload": c.payload,
            "status": c.status,
            "idea_id": c.idea_id,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in changes
    ]


@router.post("/website/{change_id}/approve")
def approve_website_change(change_id: int, db: Session = Depends(get_db)):
    change = db.query(WebsiteChange).filter(WebsiteChange.id == change_id).first()
    if not change:
        raise HTTPException(status_code=404, detail="Website change not found")
    change.status = "approved"
    approval = Approval(item_type="website", item_id=change_id, decision="approved")
    db.add(approval)
    db.commit()
    return {"status": "approved", "id": change_id}


@router.post("/website/{change_id}/reject")
def reject_website_change(change_id: int, body: DecisionBody, db: Session = Depends(get_db)):
    change = db.query(WebsiteChange).filter(WebsiteChange.id == change_id).first()
    if not change:
        raise HTTPException(status_code=404, detail="Website change not found")
    change.status = "rejected"
    approval = Approval(
        item_type="website", item_id=change_id,
        decision="rejected", notes=body.notes,
    )
    db.add(approval)
    db.commit()
    return {"status": "rejected", "id": change_id}
