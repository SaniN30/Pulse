from fastapi import APIRouter

from backend.app.services.overview_service import (
    get_overview,
    get_revenue,
)


router = APIRouter(
    prefix="/api",
    tags=["Overview"],
)


@router.get("/overview")
def overview():
    return get_overview()


@router.get("/revenue")
def revenue():
    return get_revenue()