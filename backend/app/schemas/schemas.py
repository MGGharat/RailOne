from datetime import datetime, date
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, Field

# Base API Response
class APIResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    message: str = "Operation successful"

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    mobile: str = Field(..., min_length=10, max_length=15)
    gender: Optional[str] = "MALE"
    dob: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: Optional[str] = None
    mobile: Optional[str] = None
    username: Optional[str] = None
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    mobile: str
    gender: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Station Schemas
class StationOut(BaseModel):
    id: int
    code: str
    name: str
    city: str
    state: str
    zone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_wifi: bool
    has_waiting_room: bool
    has_food_court: bool

    class Config:
        from_attributes = True

class StationCreate(BaseModel):
    code: str
    name: str
    city: str
    state: str
    zone: Optional[str] = "IR"
    has_wifi: bool = True
    has_waiting_room: bool = True
    has_food_court: bool = True

# Train & Search Schemas
class ScheduleStopOut(BaseModel):
    stop_number: int
    station_code: str
    station_name: str
    city: str
    arrival_time: Optional[str] = None
    departure_time: Optional[str] = None
    day_offset: int
    platform_number: str
    distance_from_source_km: float
    halt_duration_mins: int

class AvailabilityByClass(BaseModel):
    coach_class: str
    available_seats: int
    status: str  # AVAILABLE, RAC, WL
    fare: float
    tatkal_fare: float

class TrainSearchItem(BaseModel):
    id: int
    train_number: str
    name: str
    train_type: str
    source_station: StationOut
    destination_station: StationOut
    from_station: StationOut
    to_station: StationOut
    departure_time: str
    arrival_time: str
    duration: str
    running_days: List[str]
    catering_available: bool
    availability: List[AvailabilityByClass]

class TrainDetailOut(BaseModel):
    id: int
    train_number: str
    name: str
    train_type: str
    source_station: StationOut
    destination_station: StationOut
    runs_on_days: str
    total_distance_km: float
    catering_available: bool
    schedule: List[ScheduleStopOut]
    availability: List[AvailabilityByClass]

# Passenger Profile Schemas
class PassengerBase(BaseModel):
    full_name: str
    age: int = Field(..., ge=1, le=120)
    gender: str  # MALE, FEMALE, TRANSGENDER
    berth_preference: Optional[str] = "NO_PREFERENCE" # LOWER, MIDDLE, UPPER, SIDE_LOWER, SIDE_UPPER
    nationality: Optional[str] = "INDIAN"
    id_type: Optional[str] = "AADHAAR"
    id_number_masked: Optional[str] = "XXXX-XXXX-1234"

class PassengerCreate(PassengerBase):
    pass

class PassengerUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    berth_preference: Optional[str] = None
    nationality: Optional[str] = None

class PassengerOut(PassengerBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Booking Schemas
class PassengerInput(BaseModel):
    full_name: str
    age: int
    gender: str
    berth_preference: Optional[str] = "NO_PREFERENCE"

class BookingCreateRequest(BaseModel):
    train_id: int
    from_station_id: int
    to_station_id: int
    journey_date: date
    coach_class: str # 1A, 2A, 3A, SL, CC, 2S, EC
    quota: Optional[str] = "GENERAL" # GENERAL, LADIES, SENIOR_CITIZEN, TATKAL, PREMIUM_TATKAL
    passengers: List[PassengerInput]
    payment_method: str = "UPI" # UPI, CARD, NET_BANKING, WALLET

class BookingPassengerOut(BaseModel):
    id: int
    passenger_name: str
    passenger_age: int
    passenger_gender: str
    coach_code: Optional[str] = None
    seat_number: Optional[int] = None
    berth_type: Optional[str] = None
    status: str
    ticket_number: str

    class Config:
        from_attributes = True

class PaymentOut(BaseModel):
    transaction_id: str
    payment_method: str
    amount: float
    status: str
    provider_ref: str
    created_at: datetime

    class Config:
        from_attributes = True

class RefundOut(BaseModel):
    refund_ref: str
    cancellation_fee: float
    refund_amount: float
    status: str
    initiated_at: datetime

    class Config:
        from_attributes = True

class BookingOut(BaseModel):
    id: int
    pnr: str
    booking_id: str
    user_id: int
    train_id: int
    train_number: str
    train_name: str
    from_station: StationOut
    to_station: StationOut
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    journey_date: date
    coach_class: str
    quota: str
    status: str
    total_passengers: int
    base_fare: float
    taxes: float
    convenience_fee: float
    total_amount: float
    created_at: datetime
    passengers: List[BookingPassengerOut]
    payment: Optional[PaymentOut] = None
    refund: Optional[RefundOut] = None
    qr_code_data: Optional[str] = None

    class Config:
        from_attributes = True

class CancellationResponse(BaseModel):
    booking_id: str
    pnr: str
    status: str
    cancellation_fee: float
    refund_amount: float
    refund_status: str
    refund_ref: str

# PNR Schemas
class PNRPassengerItem(BaseModel):
    passenger_name: str
    booking_status: str
    current_status: str
    coach_code: Optional[str] = None
    seat_number: Optional[int] = None
    berth_type: Optional[str] = None

class PNRStatusOut(BaseModel):
    pnr: str
    train_number: str
    train_name: str
    from_station: StationOut
    to_station: StationOut
    journey_date: date
    chart_status: str
    booking_status: str
    coach_class: str
    passengers: List[PNRPassengerItem]

# Live Train Status Schemas
class LiveTimelineStop(BaseModel):
    station_code: str
    station_name: str
    city: str
    scheduled_arrival: Optional[str] = None
    scheduled_departure: Optional[str] = None
    actual_arrival: Optional[str] = None
    actual_departure: Optional[str] = None
    platform: str
    distance_km: float
    status: str  # DEPARTED, CURRENT, UPCOMING
    delay_minutes: int

class LiveTrainStatusOut(BaseModel):
    train_number: str
    train_name: str
    journey_date: date
    current_station: Optional[str] = None
    previous_station: Optional[str] = None
    next_station: Optional[str] = None
    status: str
    overall_delay_minutes: int
    timeline: List[LiveTimelineStop]

# Notifications
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Favourites
class FavouriteRouteCreate(BaseModel):
    from_station_id: int
    to_station_id: int

class FavouriteRouteOut(BaseModel):
    id: int
    from_station: StationOut
    to_station: StationOut
    created_at: datetime

    class Config:
        from_attributes = True

# Admin Schemas
class AdminDashboardStats(BaseModel):
    total_users: int
    total_bookings: int
    today_bookings: int
    total_revenue: float
    cancelled_tickets: int
    active_trains: int
    daily_trends: List[dict]
    popular_routes: List[dict]
    class_distribution: List[dict]

class TrainCreateRequest(BaseModel):
    train_number: str
    name: str
    train_type: str = "SUPERFAST"
    source_station_id: int
    destination_station_id: int
    runs_on_days: str = "MON,TUE,WED,THU,FRI,SAT,SUN"
    catering_available: bool = True
    base_fares: dict # {"SL": 450, "3A": 1200, "2A": 1800, "1A": 2900}
