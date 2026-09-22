import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, Date, DateTime, 
    ForeignKey, UniqueConstraint, Index, Text, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole:
    USER = "USER"
    ADMIN = "ADMIN"

class BookingStatus:
    CONFIRMED = "CONFIRMED"
    WAITLISTED = "WAITLISTED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

class PaymentStatus:
    INITIATED = "INITIATED"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

class RefundStatus:
    INITIATED = "INITIATED"
    PROCESSED = "PROCESSED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    mobile = Column(String(20), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    gender = Column(String(20), default="MALE")
    dob = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    role = Column(String(20), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    passengers = relationship("Passenger", back_populates="user", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    favourite_routes = relationship("FavouriteRoute", back_populates="user", cascade="all, delete-orphan")

class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    zone = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    has_wifi = Column(Boolean, default=True)
    has_waiting_room = Column(Boolean, default=True)
    has_food_court = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    train_stops = relationship("TrainStation", back_populates="station")

class Train(Base):
    __tablename__ = "trains"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    train_type = Column(String(50), default="SUPERFAST")
    source_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    destination_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    runs_on_days = Column(String(50), default="MON,TUE,WED,THU,FRI,SAT,SUN")
    total_distance_km = Column(Float, default=0.0)
    catering_available = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    source_station = relationship("Station", foreign_keys=[source_station_id])
    destination_station = relationship("Station", foreign_keys=[destination_station_id])
    schedules = relationship("TrainStation", back_populates="train", order_by="TrainStation.stop_number", cascade="all, delete-orphan")
    coaches = relationship("Coach", back_populates="train", cascade="all, delete-orphan")
    fares = relationship("TrainFare", back_populates="train", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="train")

class TrainStation(Base):
    __tablename__ = "train_stations"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False, index=True)
    stop_number = Column(Integer, nullable=False)
    arrival_time = Column(String(10), nullable=True) # HH:MM
    departure_time = Column(String(10), nullable=True) # HH:MM
    day_offset = Column(Integer, default=0)
    platform_number = Column(String(10), default="1")
    distance_from_source_km = Column(Float, default=0.0)
    halt_duration_mins = Column(Integer, default=2)

    # Relationships
    train = relationship("Train", back_populates="schedules")
    station = relationship("Station", back_populates="train_stops")

    __table_args__ = (
        UniqueConstraint("train_id", "stop_number", name="uq_train_stop"),
        UniqueConstraint("train_id", "station_id", name="uq_train_station"),
    )

class Coach(Base):
    __tablename__ = "coaches"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False, index=True)
    coach_code = Column(String(10), nullable=False)  # e.g., 'B1', 'A1', 'S1'
    coach_class = Column(String(10), nullable=False, index=True) # 1A, 2A, 3A, SL, CC, 2S, EC
    seat_capacity = Column(Integer, default=72)

    # Relationships
    train = relationship("Train", back_populates="coaches")
    seats = relationship("Seat", back_populates="coach", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("train_id", "coach_code", name="uq_train_coach"),
    )

class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("coaches.id"), nullable=False, index=True)
    seat_number = Column(Integer, nullable=False)
    berth_type = Column(String(20), default="LOWER") # LOWER, MIDDLE, UPPER, SIDE_LOWER, SIDE_UPPER, WINDOW

    coach = relationship("Coach", back_populates="seats")
    reservations = relationship("SeatReservation", back_populates="seat")

    __table_args__ = (
        UniqueConstraint("coach_id", "seat_number", name="uq_coach_seat"),
    )

class TrainFare(Base):
    __tablename__ = "train_fares"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False, index=True)
    coach_class = Column(String(10), nullable=False)
    base_fare = Column(Float, nullable=False)
    tatkal_surcharge = Column(Float, default=300.0)
    superfast_surcharge = Column(Float, default=45.0)
    gst_percent = Column(Float, default=5.0)

    train = relationship("Train", back_populates="fares")

    __table_args__ = (
        UniqueConstraint("train_id", "coach_class", name="uq_train_fare_class"),
    )

class Passenger(Base):
    """Saved passenger profile for users"""
    __tablename__ = "passengers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=False)
    berth_preference = Column(String(20), default="NO_PREFERENCE")
    nationality = Column(String(50), default="INDIAN")
    id_type = Column(String(50), default="AADHAAR")
    id_number_masked = Column(String(50), default="XXXX-XXXX-1234")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="passengers")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    pnr = Column(String(10), unique=True, index=True, nullable=False)
    booking_id = Column(String(50), unique=True, index=True, default=lambda: f"RC-{uuid.uuid4().hex[:8].upper()}")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False, index=True)
    from_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    to_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    journey_date = Column(Date, nullable=False, index=True)
    coach_class = Column(String(10), nullable=False)
    quota = Column(String(20), default="GENERAL")
    status = Column(String(20), default=BookingStatus.CONFIRMED, index=True)
    total_passengers = Column(Integer, default=1)
    base_fare = Column(Float, default=0.0)
    taxes = Column(Float, default=0.0)
    convenience_fee = Column(Float, default=35.40)
    total_amount = Column(Float, default=0.0)
    qr_code_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="bookings")
    train = relationship("Train", back_populates="bookings")
    from_station = relationship("Station", foreign_keys=[from_station_id])
    to_station = relationship("Station", foreign_keys=[to_station_id])
    passengers = relationship("BookingPassenger", back_populates="booking", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    refund = relationship("Refund", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    pnr_record = relationship("PNRRecord", back_populates="booking", uselist=False, cascade="all, delete-orphan")

class BookingPassenger(Base):
    __tablename__ = "booking_passengers"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    passenger_name = Column(String(255), nullable=False)
    passenger_age = Column(Integer, nullable=False)
    passenger_gender = Column(String(10), nullable=False)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=True, index=True)
    coach_code = Column(String(10), nullable=True)
    seat_number = Column(Integer, nullable=True)
    berth_type = Column(String(20), nullable=True)
    status = Column(String(20), default=BookingStatus.CONFIRMED)
    ticket_number = Column(String(50), default=lambda: f"TKT-{uuid.uuid4().hex[:10].upper()}")

    booking = relationship("Booking", back_populates="passengers")
    seat = relationship("Seat")
    reservation = relationship("SeatReservation", back_populates="booking_passenger", uselist=False)

class SeatReservation(Base):
    """Guarantees absolute atomic seat exclusivity per journey date"""
    __tablename__ = "seat_reservations"

    id = Column(Integer, primary_key=True, index=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False, index=True)
    journey_date = Column(Date, nullable=False, index=True)
    booking_passenger_id = Column(Integer, ForeignKey("booking_passengers.id"), nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    seat = relationship("Seat", back_populates="reservations")
    booking_passenger = relationship("BookingPassenger", back_populates="reservation")

    __table_args__ = (
        Index("idx_seat_journey_active", "seat_id", "journey_date", "is_active"),
    )

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    transaction_id = Column(String(100), unique=True, index=True, default=lambda: f"TXN-{uuid.uuid4().hex.upper()}")
    payment_method = Column(String(30), default="UPI")  # UPI, CARD, NET_BANKING, WALLET
    amount = Column(Float, nullable=False)
    status = Column(String(20), default=PaymentStatus.SUCCESS)
    provider_ref = Column(String(100), default=lambda: f"SIM-GATEWAY-{uuid.uuid4().hex[:6].upper()}")
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="payment")

class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    refund_ref = Column(String(100), unique=True, index=True, default=lambda: f"REF-{uuid.uuid4().hex.upper()}")
    cancellation_fee = Column(Float, default=120.0)
    refund_amount = Column(Float, nullable=False)
    status = Column(String(20), default=RefundStatus.INITIATED)
    initiated_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="refund")

class PNRRecord(Base):
    __tablename__ = "pnr_records"

    id = Column(Integer, primary_key=True, index=True)
    pnr = Column(String(10), unique=True, index=True, nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    chart_status = Column(String(20), default="PREPARED")  # PREPARED, NOT_PREPARED
    current_status = Column(String(20), default="CONFIRMED")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    booking = relationship("Booking", back_populates="pnr_record")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="BOOKING_CONFIRMED")
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class FavouriteRoute(Base):
    __tablename__ = "favourite_routes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    from_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    to_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="favourite_routes")
    from_station = relationship("Station", foreign_keys=[from_station_id])
    to_station = relationship("Station", foreign_keys=[to_station_id])

class LiveTrainStatus(Base):
    __tablename__ = "live_train_status_logs"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False, index=True)
    journey_date = Column(Date, nullable=False, index=True)
    current_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    last_departed_station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    next_station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    status = Column(String(20), default="ON_TIME") # ON_TIME, DELAYED, CANCELLED
    delay_minutes = Column(Integer, default=0)
    platform = Column(String(10), default="1")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    train = relationship("Train")
    current_station = relationship("Station", foreign_keys=[current_station_id])
    last_departed_station = relationship("Station", foreign_keys=[last_departed_station_id])
    next_station = relationship("Station", foreign_keys=[next_station_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
