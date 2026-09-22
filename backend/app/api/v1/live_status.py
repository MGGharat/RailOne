from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.live_status_service import LiveTrainService
from app.core.exceptions import AppException, success_response

router = APIRouter(prefix="/live-status", tags=["Live Train Status"])

@router.get("/{train_number}")
def get_live_train_status(
    train_number: str,
    journey_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    status_out = LiveTrainService.get_live_status(db, train_number, journey_date)
    return success_response(
        data=status_out.dict(),
        message=f"Live running status for Train {train_number}"
    )
