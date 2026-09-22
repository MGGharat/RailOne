from sqlalchemy.orm import Session
from app.models.models import Booking, PNRRecord
from app.schemas.schemas import PNRStatusOut, PNRPassengerItem, StationOut
from app.core.exceptions import AppException

class PNRService:
    @staticmethod
    def get_pnr_status(db: Session, pnr: str) -> PNRStatusOut:
        clean_pnr = pnr.strip()
        booking = db.query(Booking).filter(Booking.pnr == clean_pnr).first()
        if not booking:
            raise AppException(status_code=404, code="PNR_NOT_FOUND", message=f"PNR '{clean_pnr}' not found. Please check and try again.")

        train = booking.train
        pnr_rec = booking.pnr_record

        passengers_out = []
        for bp in booking.passengers:
            passengers_out.append(PNRPassengerItem(
                passenger_name=bp.passenger_name,
                booking_status=bp.status,
                current_status=bp.status,
                coach_code=bp.coach_code,
                seat_number=bp.seat_number,
                berth_type=bp.berth_type
            ))

        return PNRStatusOut(
            pnr=booking.pnr,
            train_number=train.train_number,
            train_name=train.name,
            from_station=StationOut.from_orm(booking.from_station),
            to_station=StationOut.from_orm(booking.to_station),
            journey_date=booking.journey_date,
            chart_status=pnr_rec.chart_status if pnr_rec else "PREPARED",
            booking_status=booking.status,
            coach_class=booking.coach_class,
            passengers=passengers_out
        )
