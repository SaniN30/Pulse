from sqlalchemy import text

from backend.app.database.connection import engine
from backend.app.database.queries import (
    FUNNEL_QUERY,
    DEVICE_QUERY,
)


def get_funnel():
    with engine.connect() as connection:
        row = connection.execute(
            text(FUNNEL_QUERY)
        ).mappings().first()

    return dict(row) if row else {}


def get_devices():
    with engine.connect() as connection:
        rows = connection.execute(
            text(DEVICE_QUERY)
        ).mappings().all()

    return [dict(row) for row in rows]