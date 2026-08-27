from fastapi import APIRouter

from backend.app.services.payment_service import (
    get_payment_performance,
)


router = APIRouter(
    prefix="/api",
    tags=["Payments"],
)


@router.get("/payments")
def payments():
    return get_payment_performance()