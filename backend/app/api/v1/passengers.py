from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Passenger, User
from app.schemas.schemas import PassengerCreate, PassengerUpdate, PassengerOut
from app.api.deps import get_current_user
from app.core.exceptions import AppException, success_response

router = APIRouter(prefix="/passengers", tags=["Passengers"])

@router.get("")
def list_passengers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    passengers = db.query(Passenger).filter(Passenger.user_id == current_user.id).all()
    return success_response(
        data=[PassengerOut.model_validate(p).model_dump() for p in passengers],
        message="Saved passengers retrieved"
    )

@router.post("")
def create_passenger(
    pax_in: PassengerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pax = Passenger(
        user_id=current_user.id,
        full_name=pax_in.full_name,
        age=pax_in.age,
        gender=pax_in.gender,
        berth_preference=pax_in.berth_preference or "NO_PREFERENCE",
        nationality=pax_in.nationality or "INDIAN",
        id_type=pax_in.id_type or "AADHAAR",
        id_number_masked=pax_in.id_number_masked or "XXXX-XXXX-1234"
    )
    db.add(pax)
    db.commit()
    db.refresh(pax)
    return success_response(
        data=PassengerOut.model_validate(pax).model_dump(),
        message="Passenger profile saved"
    )

@router.put("/{id}")
def update_passenger(
    id: int,
    pax_in: PassengerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pax = db.query(Passenger).filter(Passenger.id == id, Passenger.user_id == current_user.id).first()
    if not pax:
        raise AppException(status_code=404, code="PASSENGER_NOT_FOUND", message="Passenger not found.")

    if pax_in.full_name:
        pax.full_name = pax_in.full_name
    if pax_in.age:
        pax.age = pax_in.age
    if pax_in.gender:
        pax.gender = pax_in.gender
    if pax_in.berth_preference:
        pax.berth_preference = pax_in.berth_preference
    if pax_in.nationality:
        pax.nationality = pax_in.nationality

    db.commit()
    db.refresh(pax)
    return success_response(
        data=PassengerOut.model_validate(pax).model_dump(),
        message="Passenger profile updated"
    )

@router.delete("/{id}")
def delete_passenger(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pax = db.query(Passenger).filter(Passenger.id == id, Passenger.user_id == current_user.id).first()
    if not pax:
        raise AppException(status_code=404, code="PASSENGER_NOT_FOUND", message="Passenger not found.")

    db.delete(pax)
    db.commit()
    return success_response(
        data={"id": id},
        message="Passenger profile removed"
    )
