from fastapi import APIRouter
from src.core.ga4_client import ga4_client

router = APIRouter()


@router.get("/ga4/status")
def ga4_status():
    return {
        "connected": ga4_client.is_connected,
        "property_id": ga4_client.property_id or "",
    }


@router.get("/ga4/seo")
async def ga4_seo():
    return await ga4_client.get_seo_metrics()


@router.get("/ga4/sem")
async def ga4_sem():
    return await ga4_client.get_sem_metrics()
