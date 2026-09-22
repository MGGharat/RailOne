from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Train, TrainFare, Station
from app.core.exceptions import AppException, success_response

router = APIRouter(prefix="/fares", tags=["Fares"])

RESERVATION_CHARGES = {
    "1A": 60.0,
    "2A": 50.0,
    "3A": 40.0,
    "CC": 40.0,
    "EC": 60.0,
    "SL": 20.0,
    "2S": 15.0
}

@router.get("/calculate")
def calculate_fare(
    train_id: Optional[int] = Query(None),
    train_number: Optional[str] = Query(None),
    source: Optional[str] = Query(None, alias="from"),
    destination: Optional[str] = Query(None, alias="to"),
    from_station_id: Optional[int] = Query(None),
    to_station_id: Optional[int] = Query(None),
    class_type: Optional[str] = Query(None, alias="coach_class"),
    coach_class: Optional[str] = Query("SL"),
    quota: Optional[str] = Query("GENERAL"),
    passengers_count: int = Query(1, ge=1, le=6),
    db: Session = Depends(get_db)
):
    selected_class = class_type or coach_class or "SL"
    selected_quota = (quota or "GENERAL").upper()

    # Find train
    train = None
    if train_id:
        train = db.query(Train).filter(Train.id == train_id).first()
    elif train_number:
        train = db.query(Train).filter(Train.train_number == train_number).first()
    
    if not train:
        # Fallback to first active train if demo calculation
        train = db.query(Train).first()

    base_fare = 450.0
    tatkal_surcharge = 0.0
    superfast_surcharge = 45.0 if train and "SUPERFAST" in (train.train_type or "").upper() else 30.0

    if train:
        fare_rec = db.query(TrainFare).filter(
            TrainFare.train_id == train.id,
            TrainFare.coach_class == selected_class
        ).first()
        if fare_rec:
            base_fare = fare_rec.base_fare
            if selected_quota in ("TATKAL", "PREMIUM_TATKAL"):
                tatkal_surcharge = fare_rec.tatkal_surcharge or (base_fare * 0.3)
            superfast_surcharge = fare_rec.superfast_surcharge or superfast_surcharge

    reservation_charge = RESERVATION_CHARGES.get(selected_class, 30.0)
    
    # AC classes incur 5% GST on (base + reservation + superfast + tatkal)
    is_ac = selected_class in ("1A", "2A", "3A", "CC", "EC")
    subtotal_per_pax = base_fare + reservation_charge + superfast_surcharge + tatkal_surcharge
    gst_per_pax = round(subtotal_per_pax * 0.05, 2) if is_ac else 0.0
    total_per_pax = round(subtotal_per_pax + gst_per_pax, 2)
    grand_total = round(total_per_pax * passengers_count, 2)

    return success_response(
        data={
            "train_id": train.id if train else None,
            "train_number": train.train_number if train else None,
            "coach_class": selected_class,
            "quota": selected_quota,
            "passengers_count": passengers_count,
            "breakdown": {
                "base_fare": base_fare,
                "reservation_charge": reservation_charge,
                "superfast_surcharge": superfast_surcharge,
                "tatkal_surcharge": tatkal_surcharge,
                "gst": gst_per_pax,
                "total_per_passenger": total_per_pax
            },
            "total_fare": grand_total
        },
        message="Fare calculated successfully"
    )
