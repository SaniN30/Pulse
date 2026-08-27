from fastapi import APIRouter

from backend.app.services.funnel_service import (
    get_funnel,
    get_devices,
)


router = APIRouter(
    prefix="/api",
    tags=["Funnel"],
)


@router.get("/funnel")
def funnel():
    return get_funnel()


@router.get("/devices")
def devices():
    return get_devices()