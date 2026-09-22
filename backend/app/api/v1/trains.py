from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Train
from app.services.train_service import TrainService
from app.services.live_status_service import LiveTrainService
from app.schemas.schemas import StationOut
from app.core.exceptions import AppException, success_response

router = APIRouter(prefix="/trains", tags=["Trains"])

@router.get("")
def list_trains(
    q: Optional[str] = Query(None, description="Search train by number or name"),
    db: Session = Depends(get_db)
):
    query = db.query(Train).filter(Train.is_active == True)
    if q:
        query = query.filter(
            (Train.train_number.ilike(f"%{q}%")) | (Train.name.ilike(f"%{q}%"))
        )
    trains = query.limit(50).all()
    results = []
    for t in trains:
        results.append({
            "id": t.id,
            "train_number": t.train_number,
            "train_name": t.name,
            "name": t.name,
            "train_type": t.train_type,
            "source_station": StationOut.model_validate(t.source_station).model_dump() if t.source_station else None,
            "destination_station": StationOut.model_validate(t.destination_station).model_dump() if t.destination_station else None,
            "runs_on_days": t.runs_on_days,
            "total_distance_km": t.total_distance_km,
            "catering_available": t.catering_available
        })
    return success_response(data=results, message="Trains retrieved successfully")

@router.get("/search")
def search_trains(
    from_param: Optional[str] = Query(None, alias="from"),
    to_param: Optional[str] = Query(None, alias="to"),
    from_station_id: Optional[int] = Query(None),
    from_code: Optional[str] = Query(None),
    to_station_id: Optional[int] = Query(None),
    to_code: Optional[str] = Query(None),
    journey_date: date = Query(...),
    coach_class: Optional[str] = Query(None),
    class_type: Optional[str] = Query(None),
    quota: Optional[str] = Query("GENERAL"),
    db: Session = Depends(get_db)
):
    # Handle 'from' and 'to' parameter aliases (can be code, name, or ID)
    if from_param:
        if from_param.isdigit():
            from_station_id = int(from_param)
        else:
            from_code = from_param
    if to_param:
        if to_param.isdigit():
            to_station_id = int(to_param)
        else:
            to_code = to_param

    if from_code and not from_station_id:
        st_from = TrainService.get_station_by_code(db, from_code)
        if not st_from:
            # Try searching by name/city
            st_list = TrainService.get_stations(db, from_code)
            if st_list:
                st_from = st_list[0]
        if st_from:
            from_station_id = st_from.id

    if to_code and not to_station_id:
        st_to = TrainService.get_station_by_code(db, to_code)
        if not st_to:
            st_list = TrainService.get_stations(db, to_code)
            if st_list:
                st_to = st_list[0]
        if st_to:
            to_station_id = st_to.id

    if not from_station_id or not to_station_id:
        raise AppException(status_code=400, code="INVALID_PARAMS", message="Source and destination stations are required.")

    if from_station_id == to_station_id:
        raise AppException(status_code=400, code="SAME_STATIONS", message="Source and destination stations cannot be identical.")

    selected_class = coach_class or class_type

    results = TrainService.search_trains(
        db=db,
        from_station_id=from_station_id,
        to_station_id=to_station_id,
        journey_date=journey_date,
        coach_class=selected_class,
        quota=quota or "GENERAL"
    )

    data = [item.model_dump() for item in results]
    return success_response(
        data=data,
        message=f"Found {len(results)} train(s) for the selected route"
    )

@router.get("/{id}/availability")
def get_seat_availability(
    id: str,
    coach_class: Optional[str] = Query(None),
    class_type: Optional[str] = Query(None),
    journey_date: date = Query(...),
    quota: str = Query("GENERAL"),
    source: Optional[str] = Query(None, alias="from"),
    destination: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db)
):
    selected_class = coach_class or class_type or "SL"
    train_id = None
    if id.isdigit():
        train_id = int(id)
    else:
        tr = db.query(Train).filter(Train.train_number == id).first()
        if tr:
            train_id = tr.id

    if not train_id:
        raise AppException(status_code=404, code="TRAIN_NOT_FOUND", message="Train not found.")

    avail = TrainService.get_seat_availability(db, train_id, selected_class, journey_date, quota)
    avail_dict = avail.model_dump()

    # Add standard fields required by section 10
    avail_count = avail.available_seats
    rac_count = 0
    waiting_count = 0
    status_str = "AVAILABLE" if avail_count > 5 else ("RAC" if avail_count > 0 else "WAITING")
    
    if avail_count <= 0:
        waiting_count = 4
    elif avail_count <= 5:
        rac_count = avail_count

    avail_dict.update({
        "available": avail_count,
        "rac": rac_count,
        "waiting": waiting_count,
        "calculated_status": status_str
    })

    return success_response(
        data=avail_dict,
        message="Seat availability retrieved"
    )

@router.get("/{id}/live-status")
def get_train_live_status(
    id: str,
    journey_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    train_number = id
    if id.isdigit():
        tr = db.query(Train).filter(Train.id == int(id)).first()
        if tr:
            train_number = tr.train_number

    status_data = LiveTrainService.get_live_status(db, train_number, journey_date)
    return success_response(
        data=status_data.model_dump(),
        message="Live train status retrieved successfully"
    )

@router.get("/{id}")
def get_train_detail(
    id: str,
    journey_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    detail = TrainService.get_train_detail(db, id, journey_date)
    if not detail:
        raise AppException(status_code=404, code="TRAIN_NOT_FOUND", message="Train not found.")
    return success_response(
        data=detail.model_dump(),
        message="Train details retrieved"
    )

@router.get("/{id}/schedule")
def get_train_schedule(id: str, db: Session = Depends(get_db)):
    detail = TrainService.get_train_detail(db, id)
    if not detail:
        raise AppException(status_code=404, code="TRAIN_NOT_FOUND", message="Train not found.")
    return success_response(
        data=[s.model_dump() for s in detail.schedule],
        message="Train schedule retrieved"
    )
