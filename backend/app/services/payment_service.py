from sqlalchemy import text

from backend.app.database.connection import engine
from backend.app.database.queries import PAYMENT_QUERY


def get_payment_performance():
    with engine.connect() as connection:
        rows = connection.execute(
            text(PAYMENT_QUERY)
        ).mappings().all()

    return [dict(row) for row in rows]