from fastapi import APIRouter, Query

from backend.app.services.product_service import (
    get_categories,
    get_products,
)


router = APIRouter(
    prefix="/api",
    tags=["Products"],
)


@router.get("/categories")
def categories():
    return get_categories()


@router.get("/products")
def products(
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    )
):
    return get_products(limit)