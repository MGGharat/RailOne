from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.core.database import get_db
from app.models.models import User, Train, Station, Booking, AuditLog, TrainFare, Coach, Seat
from app.schemas.schemas import StationCreate, StationOut, TrainCreateRequest, UserOut
from app.services.admin_service import AdminService
from app.api.deps import get_current_admin
from app.core.exceptions import AppException, success_response

router = APIRouter(prefix="/admin", tags=["Admin Operations"], dependencies=[Depends(get_current_admin)])

@router.get("/dashboard")
def get_admin_dashboard(db: Session = Depends(get_db)):
    stats = AdminService.get_dashboard_stats(db)
    return success_response(
        data=stats.model_dump(),
        message="Admin analytics retrieved"
    )

@router.get("/users")
def list_admin_users(
    q: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if q:
        q_str = f"%{q}%"
        query = query.filter(
            or_(
                User.email.ilike(q_str),
                User.full_name.ilike(q_str),
                User.mobile.ilike(q_str)
            )
        )
    if role:
        query = query.filter(User.role == role.upper())

    users = query.order_by(User.created_at.desc()).limit(100).all()
    return success_response(
        data=[UserOut.model_validate(u).model_dump() for u in users],
        message="Users retrieved"
    )

@router.get("/bookings")
def list_all_bookings(
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status.upper())
    if q:
        q_str = f"%{q}%"
        query = query.filter(
            or_(
                Booking.pnr.ilike(q_str),
                Booking.booking_id.ilike(q_str)
            )
        )

    bookings = query.order_by(Booking.created_at.desc()).limit(100).all()
    results = []
    for b in bookings:
        results.append({
            "id": b.id,
            "pnr": b.pnr,
            "booking_id": b.booking_id,
            "user_email": b.user.email if b.user else "N/A",
            "train_number": b.train.train_number if b.train else "N/A",
            "train_name": b.train.name if b.train else "N/A",
            "route": f"{b.from_station.code} → {b.to_station.code}",
            "journey_date": b.journey_date.isoformat(),
            "coach_class": b.coach_class,
            "quota": b.quota,
            "passengers_count": b.total_passengers,
            "total_amount": b.total_amount,
            "status": b.status,
            "created_at": b.created_at.isoformat()
        })

    return success_response(
        data=results,
        message="All bookings retrieved"
    )

@router.get("/audit-logs")
def list_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return success_response(
        data=[
            {
                "id": l.id,
                "user_id": l.user_id,
                "action": l.action,
                "resource_type": l.resource_type,
                "resource_id": l.resource_id,
                "details": l.details,
                "ip_address": l.ip_address,
                "timestamp": l.timestamp.isoformat()
            }
            for l in logs
        ],
        message="Audit logs retrieved"
    )

@router.post("/stations")
def create_station(st_in: StationCreate, db: Session = Depends(get_db)):
    existing = db.query(Station).filter(Station.code == st_in.code.upper()).first()
    if existing:
        raise AppException(status_code=400, code="STATION_EXISTS", message="Station code already exists.")

    st = Station(
        code=st_in.code.upper(),
        name=st_in.name,
        city=st_in.city,
        state=st_in.state,
        zone=st_in.zone or "IR",
        has_wifi=st_in.has_wifi,
        has_waiting_room=st_in.has_waiting_room,
        has_food_court=st_in.has_food_court,
        is_active=True
    )
    db.add(st)
    db.commit()
    db.refresh(st)
    return success_response(
        data=StationOut.model_validate(st).model_dump(),
        message="Station created successfully"
    )

@router.post("/trains")
def create_train(t_in: TrainCreateRequest, db: Session = Depends(get_db)):
    existing = db.query(Train).filter(Train.train_number == t_in.train_number).first()
    if existing:
        raise AppException(status_code=400, code="TRAIN_EXISTS", message="Train number already exists.")

    train = Train(
        train_number=t_in.train_number,
        name=t_in.name,
        train_type=t_in.train_type,
        source_station_id=t_in.source_station_id,
        destination_station_id=t_in.destination_station_id,
        runs_on_days=t_in.runs_on_days,
        catering_available=t_in.catering_available,
        is_active=True
    )
    db.add(train)
    db.commit()
    db.refresh(train)

    # Add fares
    for cls_name, fare_val in t_in.base_fares.items():
        fare = TrainFare(
            train_id=train.id,
            coach_class=cls_name,
            base_fare=float(fare_val),
            tatkal_surcharge=float(fare_val) * 0.25,
            superfast_surcharge=45.0,
            gst_percent=5.0
        )
        db.add(fare)

    db.commit()
    return success_response(
        data={"id": train.id, "train_number": train.train_number, "name": train.name},
        message="Train created successfully"
    )

@router.delete("/trains/{id}")
def delete_train(id: int, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.id == id).first()
    if not train:
        raise AppException(status_code=404, code="NOT_FOUND", message="Train not found.")
    train.is_active = not train.is_active
    db.commit()
    state = "activated" if train.is_active else "deactivated"
    return success_response(data={"id": id, "is_active": train.is_active}, message=f"Train {state} successfully")
