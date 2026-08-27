from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text

from backend.app.database.connection import engine

from backend.app.api.routes import (
    overview,
    funnel,
    payments,
    products,
    customers,
    experiments,
)


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="ProductPulse Analytics API",
    description=(
        "Analytics API powering the ProductPulse "
        "product, business, and data analytics platform."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get(
    "/api/health",
    tags=["System"],
)
def health_check():

    try:

        with engine.connect() as connection:

            database = connection.execute(
                text("SELECT current_database()")
            ).scalar()

        return {
            "status": "healthy",
            "database": database,
        }

    except Exception as exc:

        return {
            "status": "unhealthy",
            "database": None,
            "error": str(exc),
        }


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    overview.router
)

app.include_router(
    funnel.router
)

app.include_router(
    payments.router
)

app.include_router(
    products.router
)

app.include_router(
    customers.router
)

app.include_router(
    experiments.router
)