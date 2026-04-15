import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from src.db.database import SessionLocal
from src.agents.orchestrator import run_agent
import asyncio

logger = logging.getLogger(__name__)


def _run_sync(agent_name: str):
    db = SessionLocal()
    try:
        asyncio.run(run_agent(agent_name, db))
    except Exception as e:
        logger.error(f"Scheduled {agent_name} failed: {e}")
    finally:
        db.close()


class AgentScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()

        # Research agent — daily at 06:00 UTC
        self.scheduler.add_job(
            _run_sync, CronTrigger(hour=6, minute=0),
            args=["research"], id="research_daily", replace_existing=True,
        )

        # Social stats agent — daily at 09:30 UTC
        self.scheduler.add_job(
            _run_sync, CronTrigger(hour=9, minute=30),
            args=["social_stats"], id="social_stats_daily", replace_existing=True,
        )

        # Analytics agent — daily at 20:00 UTC
        self.scheduler.add_job(
            _run_sync, CronTrigger(hour=20, minute=0),
            args=["analytics"], id="analytics_daily", replace_existing=True,
        )

        # Strategy agent — weekly on Monday at 07:00 UTC
        self.scheduler.add_job(
            _run_sync, CronTrigger(day_of_week="mon", hour=7, minute=0),
            args=["strategy"], id="strategy_weekly", replace_existing=True,
        )

        # Website agent — daily at 12:00 UTC
        self.scheduler.add_job(
            _run_sync, CronTrigger(hour=12, minute=0),
            args=["website"], id="website_daily", replace_existing=True,
        )

    def start(self):
        self.scheduler.start()
        logger.info("Agent scheduler started")

    def stop(self):
        self.scheduler.shutdown(wait=False)
        logger.info("Agent scheduler stopped")
