import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from src.db.database import get_db
from src.db.models import ResearchItem

router = APIRouter()


@router.get("/research/items")
def get_research_items(
    competitor: str | None = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(ResearchItem).order_by(ResearchItem.created_at.desc())
    if competitor:
        query = query.filter(ResearchItem.competitor == competitor)
    items = query.limit(limit).all()

    results = []
    for item in items:
        try:
            content = json.loads(item.content) if isinstance(item.content, str) else item.content
        except (json.JSONDecodeError, TypeError):
            content = item.content

        results.append({
            "id": item.id,
            "source": item.source,
            "competitor": item.competitor,
            "content": content,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        })

    return results


@router.get("/research/competitors")
def get_competitors(db: Session = Depends(get_db)):
    names = db.query(distinct(ResearchItem.competitor)).all()
    return [n[0] for n in names if n[0]]


@router.delete("/research/items")
def delete_all_research(db: Session = Depends(get_db)):
    count = db.query(ResearchItem).delete()
    db.commit()
    return {"deleted": count}
