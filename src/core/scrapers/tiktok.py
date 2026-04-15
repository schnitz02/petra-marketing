import json
import re
import httpx
import logging

logger = logging.getLogger(__name__)


async def scrape_tiktok(handle: str) -> dict:
    url = f"https://www.tiktok.com/@{handle}"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
    }

    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()

    match = re.search(
        r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>',
        resp.text,
        re.DOTALL,
    )
    if not match:
        raise ValueError("Could not find TikTok rehydration data")

    blob = json.loads(match.group(1))
    user_info = (
        blob.get("__DEFAULT_SCOPE__", {})
        .get("webapp.user-detail", {})
        .get("userInfo", {})
    )
    stats = user_info.get("stats", {})
    user = user_info.get("user", {})

    return {
        "followers": stats.get("followerCount", 0),
        "following": stats.get("followingCount", 0),
        "posts_count": stats.get("videoCount", 0),
        "bio": user.get("signature", ""),
    }
