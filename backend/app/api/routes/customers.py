from fastapi import APIRouter

from backend.app.services.customer_service import (
    get_acquisition,
    get_customer_segments,
    get_repeat_rate,
)


router = APIRouter(
    prefix="/api",
    tags=["Customers"],
)


@router.get("/acquisition")
def acquisition():
    return get_acquisition()


@router.get("/customer-segments")
def customer_segments():
    return get_customer_segments()


@router.get("/repeat-rate")
def repeat_rate():
    return get_repeat_rate()