from sqlalchemy import text

from backend.app.database.connection import engine
from backend.app.database.queries import (
    CATEGORY_QUERY,
    PRODUCT_QUERY,
)


def get_categories():
    with engine.connect() as connection:
        rows = connection.execute(
            text(CATEGORY_QUERY)
        ).mappings().all()

    return [dict(row) for row in rows]


def get_products(limit: int = 20):

    if limit < 1:
        limit = 1

    if limit > 100:
        limit = 100

    with engine.connect() as connection:
        rows = connection.execute(
            text(PRODUCT_QUERY),
            {"limit": limit},
        ).mappings().all()

    return [dict(row) for row in rows]