import logging
from sqlalchemy.orm import Session
from src.agents.research import ResearchAgent
from src.agents.social_stats import SocialStatsAgent
from src.agents.analytics import AnalyticsAgent
from src.agents.strategy import StrategyAgent
from src.agents.website import WebsiteAgent

logger = logging.getLogger(__name__)

AGENT_REGISTRY = {
    "research": ResearchAgent,
    "social_stats": SocialStatsAgent,
    "analytics": AnalyticsAgent,
    "strategy": StrategyAgent,
    "website": WebsiteAgent,
}


async def run_agent(name: str, db: Session):
    agent_cls = AGENT_REGISTRY.get(name)
    if not agent_cls:
        raise ValueError(f"Unknown agent: {name}")
    agent = agent_cls(db)
    logger.info(f"Running agent: {name}")
    return await agent.execute()
