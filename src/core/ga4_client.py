import os
import logging

logger = logging.getLogger(__name__)


class GA4Client:
    def __init__(self):
        self.property_id = os.getenv("GA4_PROPERTY_ID")
        self.credentials = os.getenv("GA4_CREDENTIALS_JSON")
        self._connected = bool(self.property_id and self.credentials)

    @property
    def is_connected(self) -> bool:
        return self._connected

    async def get_seo_metrics(self, days: int = 30) -> dict:
        if not self._connected:
            return {"error": "GA4 not configured"}
        return {
            "sessions": 0,
            "organic_sessions": 0,
            "top_pages": [],
            "message": "GA4 API integration pending — configure GA4_PROPERTY_ID and GA4_CREDENTIALS_JSON",
        }

    async def get_sem_metrics(self, days: int = 30) -> dict:
        if not self._connected:
            return {"error": "GA4 not configured"}
        return {
            "paid_sessions": 0,
            "cost": 0,
            "conversions": 0,
            "message": "GA4 API integration pending",
        }


ga4_client = GA4Client()
