import os
import httpx
import logging

logger = logging.getLogger(__name__)

INSTAGRAM_API = "https://i.instagram.com/api/v1/users/web_profile_info/"


async def scrape_instagram(handle: str) -> dict:
    headers = {
        "User-Agent": "Instagram 275.0.0.27.98 Android",
        "x-ig-app-id": "936619743392459",
    }
    cookies = {}
    session_id = os.getenv("INSTAGRAM_SESSION_ID")
    if session_id:
        cookies["sessionid"] = session_id

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            INSTAGRAM_API,
            params={"username": handle},
            headers=headers,
            cookies=cookies,
        )
        resp.raise_for_status()
        data = resp.json()

    user = data.get("data", {}).get("user", {})
    return {
        "followers": user.get("edge_followed_by", {}).get("count", 0),
        "following": user.get("edge_follow", {}).get("count", 0),
        "posts_count": user.get("edge_owner_to_timeline_media", {}).get("count", 0),
        "bio": user.get("biography", ""),
    }
