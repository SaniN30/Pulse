from sqlalchemy import text

from backend.app.database.connection import engine
from backend.app.database.queries import (
    OVERVIEW_QUERY,
    REVENUE_QUERY,
)


def get_overview():
    with engine.connect() as connection:
        row = connection.execute(
            text(OVERVIEW_QUERY)
        ).mappings().first()

    return dict(row) if row else {}


def get_revenue():
    with engine.connect() as connection:
        rows = connection.execute(
            text(REVENUE_QUERY)
        ).mappings().all()

    return [dict(row) for row in rows]