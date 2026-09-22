import uuid
import random
from datetime import datetime, date, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.models import (
    Booking, BookingPassenger, BookingStatus, SeatReservation,
    Coach, Seat, TrainFare, Train, Station, Payment, PaymentStatus,
    Refund, RefundStatus, PNRRecord, Notification, AuditLog, User
)
from app.schemas.schemas import BookingCreateRequest, CancellationResponse
from app.core.exceptions import AppException
from app.core.redis_client import cache

class BookingService:
    @staticmethod
    def generate_pnr(db: Session) -> str:
        while True:
            # Generate 10-digit authentic looking PNR (e.g. 2489XXXXXX or 4512XXXXXX)
            pnr = f"{random.randint(200, 899)}{random.randint(1000000, 9999999)}"
            if not db.query(Booking).filter(Booking.pnr == pnr).first():
                return pnr

    @classmethod
    def create_booking(cls, db: Session, user_id: int, booking_in: BookingCreateRequest) -> Booking:
        train = db.query(Train).filter(Train.id == booking_in.train_id, Train.is_active == True).first()
        if not train:
            raise AppException(status_code=404, code="TRAIN_NOT_FOUND", message="Selected train does not exist or is inactive.")

        from_st = db.query(Station).filter(Station.id == booking_in.from_station_id).first()
        to_st = db.query(Station).filter(Station.id == booking_in.to_station_id).first()
        if not from_st or not to_st:
            raise AppException(status_code=400, code="INVALID_STATIONS", message="Invalid source or destination station.")

        if booking_in.journey_date < date.today():
            raise AppException(status_code=400, code="INVALID_DATE", message="Journey date cannot be in the past.")

        fare_record = db.query(TrainFare).filter(
            TrainFare.train_id == train.id,
            TrainFare.coach_class == booking_in.coach_class
        ).first()
        if not fare_record:
            raise AppException(status_code=400, code="INVALID_CLASS", message=f"Class {booking_in.coach_class} is not available on this train.")

        # Find coaches of this class
        coaches = db.query(Coach).filter(
            Coach.train_id == train.id,
            Coach.coach_class == booking_in.coach_class
        ).all()
        if not coaches:
            raise AppException(status_code=400, code="NO_COACHES", message=f"No coaches found for class {booking_in.coach_class}.")

        coach_ids = [c.id for c in coaches]
        coach_dict = {c.id: c.coach_code for c in coaches}

        # BEGIN ATOMIC CONCURRENCY RESERVATION
        # Lock coordination: acquire distributed / in-memory lock key for (train, class, date)
        lock_key = f"train_booking:{train.id}:{booking_in.coach_class}:{booking_in.journey_date.isoformat()}"
        acquired = cache.acquire_lock(lock_key, timeout_sec=6)
        
        try:
            # Query all seats in these coaches
            all_seats = db.query(Seat).filter(Seat.coach_id.in_(coach_ids)).all()
            
            # Query currently reserved seat IDs for this journey date
            reserved_seat_ids = set(
                row[0] for row in db.query(SeatReservation.seat_id).filter(
                    SeatReservation.journey_date == booking_in.journey_date,
                    SeatReservation.is_active == True,
                    SeatReservation.seat_id.in_([s.id for s in all_seats])
                ).all()
            )

            # Available unreserved seats
            available_seats = [s for s in all_seats if s.id not in reserved_seat_ids]

            pax_count = len(booking_in.passengers)
            if pax_count == 0:
                raise AppException(status_code=400, code="NO_PASSENGERS", message="Please provide at least one passenger.")

            # Calculate Fare
            base_unit = fare_record.base_fare
            if booking_in.quota == "TATKAL":
                base_unit += fare_record.tatkal_surcharge
            total_base = base_unit * pax_count
            taxes = round(total_base * (fare_record.gst_percent / 100.0), 2)
            conv_fee = 35.40
            total_amount = round(total_base + taxes + conv_fee, 2)

            pnr_number = cls.generate_pnr(db)
            booking_uuid = f"RC-{uuid.uuid4().hex[:8].upper()}"

            # If enough seats, CONFIRMED. If not, WAITLISTED.
            booking_status = BookingStatus.CONFIRMED if len(available_seats) >= pax_count else BookingStatus.WAITLISTED

            booking = Booking(
                pnr=pnr_number,
                booking_id=booking_uuid,
                user_id=user_id,
                train_id=train.id,
                from_station_id=from_st.id,
                to_station_id=to_st.id,
                journey_date=booking_in.journey_date,
                coach_class=booking_in.coach_class,
                quota=booking_in.quota or "GENERAL",
                status=booking_status,
                total_passengers=pax_count,
                base_fare=total_base,
                taxes=taxes,
                convenience_fee=conv_fee,
                total_amount=total_amount,
                qr_code_data=f"PNR:{pnr_number}|TRAIN:{train.train_number}|DATE:{booking_in.journey_date}|AMT:{total_amount}",
                created_at=datetime.utcnow()
            )
            db.add(booking)
            db.flush()

            # Assign seats to passengers
            avail_pool = list(available_seats)
            for idx, pax in enumerate(booking_in.passengers):
                chosen_seat = None
                pax_status = booking_status

                if avail_pool and booking_status == BookingStatus.CONFIRMED:
                    # Preference check
                    pref = (pax.berth_preference or "").upper()
                    pref_matches = [s for s in avail_pool if s.berth_type.upper() == pref]
                    if pref_matches:
                        chosen_seat = pref_matches[0]
                        avail_pool.remove(chosen_seat)
                    else:
                        chosen_seat = avail_pool.pop(0)

                bp = BookingPassenger(
                    booking_id=booking.id,
                    passenger_name=pax.full_name,
                    passenger_age=pax.age,
                    passenger_gender=pax.gender,
                    seat_id=chosen_seat.id if chosen_seat else None,
                    coach_code=coach_dict.get(chosen_seat.coach_id) if chosen_seat else None,
                    seat_number=chosen_seat.seat_number if chosen_seat else None,
                    berth_type=chosen_seat.berth_type if chosen_seat else None,
                    status=BookingStatus.CONFIRMED if chosen_seat else f"WL-{idx + 1}",
                    ticket_number=f"TKT-{uuid.uuid4().hex[:10].upper()}"
                )
                db.add(bp)
                db.flush()

                # Lock the seat atomically in seat_reservations
                if chosen_seat:
                    sr = SeatReservation(
                        seat_id=chosen_seat.id,
                        journey_date=booking_in.journey_date,
                        booking_passenger_id=bp.id,
                        is_active=True
                    )
                    db.add(sr)

            # Record PNR Record
            pnr_record = PNRRecord(
                pnr=pnr_number,
                booking_id=booking.id,
                chart_status="PREPARED" if booking_in.journey_date <= date.today() + timedelta(days=1) else "NOT_PREPARED",
                current_status=booking_status
            )
            db.add(pnr_record)

            # Record simulated Payment
            payment = Payment(
                booking_id=booking.id,
                transaction_id=f"TXN-{uuid.uuid4().hex.upper()}",
                payment_method=booking_in.payment_method or "UPI",
                amount=total_amount,
                status=PaymentStatus.SUCCESS,
                provider_ref=f"SIM-GATEWAY-{uuid.uuid4().hex[:6].upper()}",
                created_at=datetime.utcnow()
            )
            db.add(payment)

            # Notification
            notif = Notification(
                user_id=user_id,
                title="Ticket Booked Successfully",
                message=f"Your ticket on {train.name} ({train.train_number}) for {booking_in.journey_date} is {booking_status}. PNR: {pnr_number}.",
                type="BOOKING_CONFIRMED",
                created_at=datetime.utcnow()
            )
            db.add(notif)

            # Audit Log
            audit = AuditLog(
                user_id=user_id,
                action="BOOKING_CREATED",
                resource_type="bookings",
                resource_id=booking_uuid,
                details=f"PNR: {pnr_number}, Train: {train.train_number}, Total: {total_amount}",
                ip_address="127.0.0.1",
                timestamp=datetime.utcnow()
            )
            db.add(audit)

            db.commit()
            db.refresh(booking)
            return booking

        except Exception as e:
            db.rollback()
            raise e
        finally:
            cache.release_lock(lock_key)

    @classmethod
    def cancel_booking(cls, db: Session, user_id: int, booking_id_or_pnr: str) -> CancellationResponse:
        booking = db.query(Booking).filter(
            or_(
                Booking.booking_id == booking_id_or_pnr,
                Booking.pnr == booking_id_or_pnr
            )
        ).first()

        if not booking:
            raise AppException(status_code=404, code="BOOKING_NOT_FOUND", message="Booking not found.")

        # Check permissions: user owns booking or is admin
        user = db.query(User).filter(User.id == user_id).first()
        if booking.user_id != user_id and (not user or user.role != "ADMIN"):
            raise AppException(status_code=403, code="FORBIDDEN", message="You do not have permission to cancel this booking.")

        if booking.status == BookingStatus.CANCELLED:
            raise AppException(status_code=400, code="ALREADY_CANCELLED", message="This booking is already cancelled.")

        # Calculate refund based on standard policy
        # ₹120 per passenger or 20% whichever is higher
        cancellation_fee = max(120.0 * booking.total_passengers, round(booking.total_amount * 0.15, 2))
        refund_amount = max(0.0, round(booking.total_amount - cancellation_fee, 2))

        # Deactivate all seat reservations so seats are immediately freed!
        passenger_ids = [bp.id for bp in booking.passengers]
        reservations = db.query(SeatReservation).filter(
            SeatReservation.booking_passenger_id.in_(passenger_ids),
            SeatReservation.is_active == True
        ).all()
        for res in reservations:
            res.is_active = False

        # Update passenger statuses
        for bp in booking.passengers:
            bp.status = BookingStatus.CANCELLED

        booking.status = BookingStatus.CANCELLED
        booking.updated_at = datetime.utcnow()

        # Update PNR record
        if booking.pnr_record:
            booking.pnr_record.current_status = BookingStatus.CANCELLED
            booking.pnr_record.updated_at = datetime.utcnow()

        # Create Refund record
        refund_ref = f"REF-{uuid.uuid4().hex.upper()}"
        refund = Refund(
            booking_id=booking.id,
            payment_id=booking.payment.id if booking.payment else None,
            refund_ref=refund_ref,
            cancellation_fee=cancellation_fee,
            refund_amount=refund_amount,
            status=RefundStatus.PROCESSED,
            initiated_at=datetime.utcnow(),
            processed_at=datetime.utcnow()
        )
        db.add(refund)

        # Dispatch Notification
        notif = Notification(
            user_id=booking.user_id,
            title="Ticket Cancelled",
            message=f"Booking {booking.booking_id} (PNR: {booking.pnr}) has been cancelled. Refund of ₹{refund_amount:.2f} has been processed.",
            type="TICKET_CANCELLED",
            created_at=datetime.utcnow()
        )
        db.add(notif)

        # Audit Log
        audit = AuditLog(
            user_id=user_id,
            action="BOOKING_CANCELLED",
            resource_type="bookings",
            resource_id=booking.booking_id,
            details=f"Refund: ₹{refund_amount}, Cancellation Fee: ₹{cancellation_fee}",
            ip_address="127.0.0.1",
            timestamp=datetime.utcnow()
        )
        db.add(audit)

        db.commit()

        return CancellationResponse(
            booking_id=booking.booking_id,
            pnr=booking.pnr,
            status=BookingStatus.CANCELLED,
            cancellation_fee=cancellation_fee,
            refund_amount=refund_amount,
            refund_status=RefundStatus.PROCESSED,
            refund_ref=refund_ref
        )

    @staticmethod
    def get_user_bookings(db: Session, user_id: int, status_filter: Optional[str] = None) -> List[Booking]:
        query = db.query(Booking).filter(Booking.user_id == user_id)
        today = date.today()

        if status_filter:
            status_upper = status_filter.upper()
            if status_upper == "UPCOMING":
                query = query.filter(Booking.status == BookingStatus.CONFIRMED, Booking.journey_date >= today)
            elif status_upper == "COMPLETED":
                query = query.filter(or_(Booking.status == BookingStatus.COMPLETED, and_(Booking.status == BookingStatus.CONFIRMED, Booking.journey_date < today)))
            elif status_upper == "CANCELLED":
                query = query.filter(Booking.status == BookingStatus.CANCELLED)

        return query.order_by(Booking.created_at.desc()).all()

    @staticmethod
    def get_booking_by_id_or_pnr(db: Session, identifier: str) -> Optional[Booking]:
        return db.query(Booking).filter(
            or_(
                Booking.booking_id == identifier,
                Booking.pnr == identifier,
                Booking.id == (int(identifier) if identifier.isdigit() else -1)
            )
        ).first()
