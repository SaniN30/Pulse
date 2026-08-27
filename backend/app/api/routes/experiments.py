from fastapi import APIRouter

from backend.app.services.experiment_service import (
    get_experiment,
    get_experiment_statistics,
)


router = APIRouter(
    prefix="/api",
    tags=["Experiments"],
)


@router.get("/experiment")
def experiment():
    return get_experiment()


@router.get("/experiment/statistics")
def experiment_statistics():
    return get_experiment_statistics()