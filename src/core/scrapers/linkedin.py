import re
import logging
from curl_cffi import requests

logger = logging.getLogger(__name__)


async def scrape_linkedin(handle: str) -> dict:
    """Scrape public LinkedIn company page for follower count and bio."""
    url = f"https://www.linkedin.com/company/{handle}/"
    try:
        resp = requests.get(url, impersonate="chrome", timeout=15)
        resp.raise_for_status()
        html = resp.text

        followers = 0
        follower_matches = re.findall(r"([\d,]+)\s*followers", html, re.IGNORECASE)
        if follower_matches:
            followers = int(follower_matches[0].replace(",", ""))

        employees = 0
        emp_matches = re.findall(r"([\d,]+)\s*employees", html, re.IGNORECASE)
        if emp_matches:
            employees = int(emp_matches[0].replace(",", ""))

        bio = ""
        desc_matches = re.findall(r'"description":"([^"]{0,500})', html)
        for d in desc_matches:
            if len(d) > len(bio) and d != handle:
                bio = d

        logger.info(f"LinkedIn scraped {handle}: {followers} followers")
        return {
            "followers": followers,
            "following": employees,
            "posts_count": 0,
            "bio": bio,
        }

    except Exception as e:
        logger.error(f"LinkedIn scrape failed for {handle}: {e}")
        return {
            "followers": 0,
            "following": 0,
            "posts_count": 0,
            "bio": "",
        }
