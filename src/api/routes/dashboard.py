import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.db.database import get_db
from src.db.models import (
    SocialSnapshot, AgentRun, Idea, WebsiteChange,
    ResearchItem, SocialPostCache, SocialAnalysis, Approval,
)

router = APIRouter()


@router.get("/overview")
def overview(db: Session = Depends(get_db)):
    latest_snapshots = []
    for platform in ["linkedin"]:
        snap = (
            db.query(SocialSnapshot)
            .filter(SocialSnapshot.platform == platform)
            .order_by(SocialSnapshot.scraped_at.desc())
            .first()
        )
        if snap:
            latest_snapshots.append({
                "platform": snap.platform,
                "handle": snap.handle,
                "followers": snap.followers,
                "scraped_at": snap.scraped_at.isoformat() if snap.scraped_at else None,
            })

    last_research = (
        db.query(AgentRun)
        .filter(AgentRun.agent_name == "research", AgentRun.status == "completed")
        .order_by(AgentRun.completed_at.desc())
        .first()
    )

    pending_ideas = db.query(func.count(Idea.id)).filter(Idea.status == "pending").scalar() or 0
    pending_website = db.query(func.count(WebsiteChange.id)).filter(WebsiteChange.status == "pending").scalar() or 0

    return {
        "social_health": latest_snapshots,
        "pending_ideas": pending_ideas,
        "pending_content": 0,
        "website_changes": pending_website,
        "published_posts": 0,
        "total_reach": 0,
        "last_research": last_research.completed_at.isoformat() if last_research and last_research.completed_at else None,
    }


@router.get("/calendar")
def calendar(db: Session = Depends(get_db)):
    return {"events": [], "message": "Content pipeline not enabled"}


@router.delete("/reset")
def reset_all_data(db: Session = Depends(get_db)):
    """Clear all data from all tables. Development use only."""
    counts = {}
    for model in [ResearchItem, SocialSnapshot, SocialPostCache, SocialAnalysis,
                  AgentRun, Idea, Approval, WebsiteChange]:
        count = db.query(model).delete()
        counts[model.__tablename__] = count
    db.commit()
    return {"deleted": counts}


@router.post("/seed-history")
def seed_history(db: Session = Depends(get_db)):
    """Seed realistic historical LinkedIn follower data for trend graph."""
    latest = (
        db.query(SocialSnapshot)
        .filter(SocialSnapshot.platform == "linkedin")
        .order_by(SocialSnapshot.scraped_at.desc())
        .first()
    )
    current_followers = latest.followers if latest else 380
    bio = latest.bio if latest else ""

    existing = db.query(SocialSnapshot).filter(SocialSnapshot.platform == "linkedin").count()
    if existing > 5:
        return {"status": "skipped", "message": "History already seeded"}

    now = datetime.now(timezone.utc)
    snapshots = []
    followers = max(current_followers - 90, 200)

    for i in range(90):
        date = now - timedelta(days=90 - i)
        growth = random.randint(0, 3)
        followers += growth
        snapshots.append(SocialSnapshot(
            platform="linkedin",
            handle="petra-australia",
            followers=min(followers, current_followers if i == 89 else followers),
            following=latest.following if latest else 0,
            posts_count=latest.posts_count if latest else 0,
            bio=bio,
            scraped_at=date,
        ))

    snapshots[-1].followers = current_followers
    for s in snapshots:
        db.add(s)
    db.commit()
    return {"status": "ok", "seeded": len(snapshots)}


@router.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    snapshots = {}
    for platform in ["linkedin"]:
        entries = (
            db.query(SocialSnapshot)
            .filter(SocialSnapshot.platform == platform)
            .order_by(SocialSnapshot.scraped_at.desc())
            .limit(30)
            .all()
        )
        snapshots[platform] = [
            {"followers": e.followers, "date": e.scraped_at.isoformat()}
            for e in reversed(entries)
        ]
    return {"platforms": snapshots}
