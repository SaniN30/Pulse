from sqlalchemy import text

from backend.app.database.connection import engine
from backend.app.database.queries import (
    ACQUISITION_QUERY,
    CUSTOMER_SEGMENT_QUERY,
    REPEAT_RATE_QUERY,
)


def get_acquisition():

    with engine.connect() as connection:
        rows = connection.execute(
            text(ACQUISITION_QUERY)
        ).mappings().all()

    return [dict(row) for row in rows]


def get_customer_segments():

    with engine.connect() as connection:
        rows = connection.execute(
            text(CUSTOMER_SEGMENT_QUERY)
        ).mappings().all()

    return [dict(row) for row in rows]


def get_repeat_rate():

    with engine.connect() as connection:
        row = connection.execute(
            text(REPEAT_RATE_QUERY)
        ).mappings().first()

    return dict(row) if row else {}