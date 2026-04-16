from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.db.database import get_db
from src.db.models import DailyReview, Idea

router = APIRouter()


@router.get("/latest")
def get_latest_review(db: Session = Depends(get_db)):
    review = (
        db.query(DailyReview)
        .order_by(DailyReview.review_date.desc())
        .first()
    )
    if not review:
        return None
    return {
        "id": review.id,
        "review_date": review.review_date.isoformat() if review.review_date else None,
        "score": review.score,
        "sentiment": review.sentiment,
        "sections": review.sections,
        "created_at": review.created_at.isoformat() if review.created_at else None,
    }


@router.get("/history")
def get_review_history(db: Session = Depends(get_db)):
    reviews = (
        db.query(DailyReview)
        .order_by(DailyReview.review_date.desc())
        .limit(30)
        .all()
    )
    return [
        {
            "id": r.id,
            "review_date": r.review_date.isoformat() if r.review_date else None,
            "score": r.score,
            "sentiment": r.sentiment,
        }
        for r in reviews
    ]


@router.get("/{review_id}")
def get_review_by_id(review_id: int, db: Session = Depends(get_db)):
    review = db.query(DailyReview).filter(DailyReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return {
        "id": review.id,
        "review_date": review.review_date.isoformat() if review.review_date else None,
        "score": review.score,
        "sentiment": review.sentiment,
        "sections": review.sections,
        "created_at": review.created_at.isoformat() if review.created_at else None,
    }


class CreateIdeaRequest(BaseModel):
    action: str
    context: str = ""


@router.post("/create-idea")
def create_idea_from_review(req: CreateIdeaRequest, db: Session = Depends(get_db)):
    idea = Idea(
        title=req.action[:200],
        body=req.action,
        evidence=req.context or "Generated from Daily Review recommendation",
        status="pending",
    )
    db.add(idea)
    db.commit()
    return {"id": idea.id, "title": idea.title, "status": "pending"}
