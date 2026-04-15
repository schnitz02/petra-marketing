import re
import logging

logger = logging.getLogger(__name__)


async def scrape_facebook(handle: str) -> dict:
    try:
        from curl_cffi.requests import AsyncSession

        url = f"https://socialblade.com/facebook/user/{handle}"
        async with AsyncSession() as session:
            resp = await session.get(url, impersonate="chrome")
            resp.raise_for_status()
            text = resp.text

        followers_match = re.search(r'id="rawCount"[^>]*>([\d,]+)', text)
        followers = int(followers_match.group(1).replace(",", "")) if followers_match else 0

        return {
            "followers": followers,
            "following": 0,
            "posts_count": 0,
            "bio": "",
        }

    except ImportError:
        logger.warning("curl_cffi not available — Facebook scraping disabled")
        return {"followers": 0, "following": 0, "posts_count": 0, "bio": ""}
    except Exception as e:
        logger.error(f"Facebook scrape failed: {e}")
        return {"followers": 0, "following": 0, "posts_count": 0, "bio": ""}
