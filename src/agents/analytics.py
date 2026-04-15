import logging
from src.agents.base import BaseAgent

logger = logging.getLogger(__name__)


class AnalyticsAgent(BaseAgent):
    name = "analytics"

    async def run(self):
        logger.info("Analytics agent — fetching post engagement metrics")
        # Requires Meta Graph API tokens to fetch engagement.
        # Gracefully returns empty when not configured.
        return {"status": "no_api_keys", "message": "Meta Graph API not configured"}
