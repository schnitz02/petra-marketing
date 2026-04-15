import os
import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from src.db.database import get_db, SessionLocal
from src.db.models import AgentRun
from src.agents.orchestrator import run_agent, AGENT_REGISTRY

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/status")
def agent_status(db: Session = Depends(get_db)):
    statuses = {}
    for name in AGENT_REGISTRY:
        last_run = (
            db.query(AgentRun)
            .filter(AgentRun.agent_name == name)
            .order_by(AgentRun.started_at.desc())
            .first()
        )
        if last_run:
            statuses[name] = {
                "status": last_run.status,
                "started_at": last_run.started_at.isoformat() if last_run.started_at else None,
                "completed_at": last_run.completed_at.isoformat() if last_run.completed_at else None,
                "log": last_run.log,
            }
        else:
            statuses[name] = {"status": "never_run", "started_at": None, "completed_at": None, "log": None}
    return statuses


@router.post("/trigger/{name}")
async def trigger_agent(
    name: str,
    db: Session = Depends(get_db),
    x_api_key: str | None = Header(None),
):
    required_key = os.getenv("AGENT_API_KEY")
    if required_key and x_api_key != required_key:
        raise HTTPException(status_code=401, detail="Invalid API key")

    if name not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Unknown agent: {name}")

    try:
        result = await run_agent(name, db)
        return {"status": "ok", "agent": name, "result": result}
    except Exception as e:
        logger.error(f"Agent {name} trigger failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
