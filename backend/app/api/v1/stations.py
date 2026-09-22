from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.train_service import TrainService
from app.schemas.schemas import StationOut
from app.core.exceptions import AppException, success_response

router = APIRouter(prefix="/stations", tags=["Stations"])

@router.get("")
@router.get("/search")
def get_stations(
    q: Optional[str] = Query(None, description="Search by station code, name or city"),
    db: Session = Depends(get_db)
):
    stations = TrainService.get_stations(db, q)
    return success_response(
        data=[StationOut.model_validate(s).model_dump() for s in stations],
        message="Stations retrieved"
    )

@router.get("/{id}")
def get_station_by_id(id: int, db: Session = Depends(get_db)):
    st = TrainService.get_station_by_id(db, id)
    if not st:
        raise AppException(status_code=404, code="STATION_NOT_FOUND", message="Station not found.")
    return success_response(
        data=StationOut.model_validate(st).model_dump(),
        message="Station retrieved"
    )
