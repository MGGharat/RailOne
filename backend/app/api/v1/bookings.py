from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Booking
from app.schemas.schemas import BookingCreateRequest, BookingOut, BookingPassengerOut, PaymentOut, RefundOut, StationOut
from app.services.booking_service import BookingService
from app.services.ticket_pdf_service import TicketPDFService
from app.api.deps import get_current_user
from app.core.exceptions import AppException, success_response

router = APIRouter(prefix="/bookings", tags=["Bookings"])

def serialize_booking(b: Booking) -> dict:
    from_st = StationOut.model_validate(b.from_station)
    to_st = StationOut.model_validate(b.to_station)
    
    # Get times from schedule if available
    dep_time = None
    arr_time = None
    for s in b.train.schedules:
        if s.station_id == b.from_station_id:
            dep_time = s.departure_time or s.arrival_time
        if s.station_id == b.to_station_id:
            arr_time = s.arrival_time or s.departure_time

    return {
        "id": b.id,
        "pnr": b.pnr,
        "booking_id": b.booking_id,
        "user_id": b.user_id,
        "train_id": b.train_id,
        "train_number": b.train.train_number,
        "train_name": b.train.name,
        "from_station": from_st.model_dump(),
        "to_station": to_st.model_dump(),
        "departure_time": dep_time or "17:00",
        "arrival_time": arr_time or "08:35",
        "journey_date": b.journey_date.isoformat(),
        "coach_class": b.coach_class,
        "quota": b.quota,
        "status": b.status,
        "total_passengers": b.total_passengers,
        "base_fare": b.base_fare,
        "taxes": b.taxes,
        "convenience_fee": b.convenience_fee,
        "total_amount": b.total_amount,
        "qr_code_data": b.qr_code_data,
        "created_at": b.created_at.isoformat(),
        "passengers": [
            {
                "id": bp.id,
                "passenger_name": bp.passenger_name,
                "passenger_age": bp.passenger_age,
                "passenger_gender": bp.passenger_gender,
                "coach_code": bp.coach_code,
                "seat_number": bp.seat_number,
                "berth_type": bp.berth_type,
                "status": bp.status,
                "ticket_number": bp.ticket_number
            }
            for bp in b.passengers
        ],
        "payment": {
            "transaction_id": b.payment.transaction_id,
            "payment_method": b.payment.payment_method,
            "amount": b.payment.amount,
            "status": b.payment.status,
            "provider_ref": b.payment.provider_ref,
            "created_at": b.payment.created_at.isoformat()
        } if b.payment else None,
        "refund": {
            "refund_ref": b.refund.refund_ref,
            "cancellation_fee": b.refund.cancellation_fee,
            "refund_amount": b.refund.refund_amount,
            "status": b.refund.status,
            "initiated_at": b.refund.initiated_at.isoformat()
        } if b.refund else None
    }

@router.post("")
def create_booking(
    booking_in: BookingCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = BookingService.create_booking(db, current_user.id, booking_in)
    return success_response(
        data=serialize_booking(booking),
        message=f"Booking confirmed successfully! PNR: {booking.pnr}"
    )

@router.get("")
@router.get("/my")
def list_my_bookings(
    status: Optional[str] = Query(None, description="UPCOMING, COMPLETED, or CANCELLED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookings = BookingService.get_user_bookings(db, current_user.id, status)
    return success_response(
        data=[serialize_booking(b) for b in bookings],
        message="User bookings retrieved"
    )

@router.get("/{id}")
def get_booking_details(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = BookingService.get_booking_by_id_or_pnr(db, id)
    if not booking:
        raise AppException(status_code=404, code="BOOKING_NOT_FOUND", message="Booking not found.")

    if booking.user_id != current_user.id and current_user.role != "ADMIN":
        raise AppException(status_code=403, code="FORBIDDEN", message="Permission denied.")

    return success_response(
        data=serialize_booking(booking),
        message="Booking details retrieved"
    )

@router.post("/{id}/cancel")
def cancel_booking(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resp = BookingService.cancel_booking(db, current_user.id, id)
    return success_response(
        data=resp.model_dump(),
        message="Ticket cancellation and refund processed successfully."
    )

@router.get("/{id}/ticket-pdf")
def download_ticket_pdf(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = BookingService.get_booking_by_id_or_pnr(db, id)
    if not booking:
        raise AppException(status_code=404, code="BOOKING_NOT_FOUND", message="Booking not found.")

    if booking.user_id != current_user.id and current_user.role != "ADMIN":
        raise AppException(status_code=403, code="FORBIDDEN", message="Permission denied.")

    pdf_bytes = TicketPDFService.generate_ticket_pdf(booking)
    filename = f"RailOne_Ticket_{booking.pnr}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "application/pdf"
        }
    )
