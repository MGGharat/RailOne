from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.pnr_service import PNRService
from app.core.exceptions import AppException, success_response

router = APIRouter(prefix="/pnr", tags=["PNR Status"])

@router.get("/{pnr}")
def check_pnr_status(pnr: str, db: Session = Depends(get_db)):
    res = PNRService.get_pnr_status(db, pnr)
    return success_response(
        data=res.dict(),
        message="PNR status retrieved successfully"
    )
