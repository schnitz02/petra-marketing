import json
import os
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from anthropic import Anthropic
from src.db.database import get_db
from src.db.models import SocialSnapshot, SocialAnalysis
from src.agents.base import parse_claude_json

logger = logging.getLogger(__name__)
router = APIRouter()

COMPANY_NAME = "Petra Industries"
INDUSTRY = "carpentry_and_tiling"


@router.get("/social-stats/analysis/{platform}")
def get_analysis(platform: str, db: Session = Depends(get_db)):
    analysis = (
        db.query(SocialAnalysis)
        .filter(SocialAnalysis.platform == platform)
        .order_by(SocialAnalysis.generated_at.desc())
        .first()
    )
    if not analysis:
        return None

    try:
        content = json.loads(analysis.analysis)
    except (json.JSONDecodeError, TypeError):
        content = analysis.analysis

    return {
        "platform": analysis.platform,
        "analysis": content,
        "generated_at": analysis.generated_at.isoformat() if analysis.generated_at else None,
    }


@router.post("/social-stats/analysis/{platform}")
def generate_analysis(platform: str, db: Session = Depends(get_db)):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    snap = (
        db.query(SocialSnapshot)
        .filter(SocialSnapshot.platform == platform)
        .order_by(SocialSnapshot.scraped_at.desc())
        .first()
    )
    if not snap:
        raise HTTPException(status_code=404, detail=f"No data for {platform}")

    prompt = (
        f"You are a social media analyst for {COMPANY_NAME}, "
        f"an Australian {INDUSTRY} brand.\n\n"
        f"Platform: {platform}\n"
        f"Current stats:\n"
        f"- Followers: {snap.followers}\n"
        f"- Following: {snap.following}\n"
        f"- Posts: {snap.posts_count}\n"
        f"- Bio: {snap.bio}\n\n"
        f"Provide a JSON response with exactly these keys:\n"
        f'- "summary": 2-3 sentence plain-English summary of current performance\n'
        f'- "benchmarks": How these numbers compare to typical Australian {INDUSTRY} brand benchmarks\n'
        f'- "recommendations": List of exactly 3 specific, actionable improvements\n\n'
        f"Return ONLY valid JSON, no markdown."
    )

    try:
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text
        parsed = parse_claude_json(raw)

        record = SocialAnalysis(
            platform=platform,
            analysis=json.dumps(parsed),
        )
        db.add(record)
        db.commit()

        return {
            "platform": platform,
            "analysis": parsed,
            "generated_at": record.generated_at.isoformat() if record.generated_at else None,
        }

    except Exception as e:
        logger.error(f"Analysis generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
