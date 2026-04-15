from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.db.database import get_db
from src.db.models import SocialSnapshot, SocialPostCache

router = APIRouter()


@router.get("/social-stats/latest")
def latest_stats(db: Session = Depends(get_db)):
    results = {}
    for platform in ["linkedin"]:
        snap = (
            db.query(SocialSnapshot)
            .filter(SocialSnapshot.platform == platform)
            .order_by(SocialSnapshot.scraped_at.desc())
            .first()
        )
        if snap:
            results[platform] = {
                "handle": snap.handle,
                "followers": snap.followers,
                "following": snap.following,
                "posts_count": snap.posts_count,
                "bio": snap.bio,
                "scraped_at": snap.scraped_at.isoformat() if snap.scraped_at else None,
            }
    return results


@router.get("/social-stats/history/{platform}")
def stats_history(platform: str, db: Session = Depends(get_db)):
    snapshots = (
        db.query(SocialSnapshot)
        .filter(SocialSnapshot.platform == platform)
        .order_by(SocialSnapshot.scraped_at.asc())
        .limit(90)
        .all()
    )
    return [
        {
            "followers": s.followers,
            "following": s.following,
            "posts_count": s.posts_count,
            "scraped_at": s.scraped_at.isoformat() if s.scraped_at else None,
        }
        for s in snapshots
    ]


@router.get("/social-stats/posts/{platform}")
def cached_posts(platform: str, db: Session = Depends(get_db)):
    posts = (
        db.query(SocialPostCache)
        .filter(SocialPostCache.platform == platform)
        .order_by(SocialPostCache.posted_at.desc())
        .limit(12)
        .all()
    )
    return [
        {
            "post_id": p.post_id,
            "likes": p.likes,
            "comments": p.comments,
            "thumbnail_url": p.thumbnail_url,
            "caption": p.caption,
            "posted_at": p.posted_at.isoformat() if p.posted_at else None,
        }
        for p in posts
    ]
