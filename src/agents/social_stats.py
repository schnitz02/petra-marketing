import logging
from datetime import datetime, timezone
from src.agents.base import BaseAgent
from src.db.models import SocialSnapshot
from src.core.scrapers.linkedin import scrape_linkedin

logger = logging.getLogger(__name__)

SOCIAL_HANDLES = {
    "linkedin": "petra-australia",
}


class SocialStatsAgent(BaseAgent):
    name = "social_stats"

    async def run(self):
        today = datetime.now(timezone.utc).date()
        results = []

        scrapers = {
            "linkedin": scrape_linkedin,
        }

        for platform, handle in SOCIAL_HANDLES.items():
            existing = (
                self.db.query(SocialSnapshot)
                .filter(
                    SocialSnapshot.platform == platform,
                    SocialSnapshot.handle == handle,
                )
                .order_by(SocialSnapshot.scraped_at.desc())
                .first()
            )

            if existing and existing.scraped_at.date() == today:
                logger.info(f"Skipping {platform} — already scraped today")
                results.append({"platform": platform, "status": "skipped"})
                continue

            try:
                scraper = scrapers[platform]
                data = await scraper(handle)
                snapshot = SocialSnapshot(
                    platform=platform,
                    handle=handle,
                    followers=data.get("followers", 0),
                    following=data.get("following", 0),
                    posts_count=data.get("posts_count", 0),
                    bio=data.get("bio", ""),
                )
                self.db.add(snapshot)
                self.db.commit()
                results.append({"platform": platform, "status": "ok"})
                logger.info(f"Scraped {platform}: {data.get('followers', 0)} followers")

            except Exception as e:
                logger.error(f"Failed to scrape {platform}: {e}")
                results.append({"platform": platform, "status": "failed", "error": str(e)})

        return results
