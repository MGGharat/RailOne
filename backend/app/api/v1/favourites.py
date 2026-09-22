from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, FavouriteRoute, Station
from app.schemas.schemas import FavouriteRouteCreate, FavouriteRouteOut, StationOut
from app.api.deps import get_current_user
from app.core.exceptions import AppException, success_response

router = APIRouter(prefix="/favourites", tags=["Favourite Routes"])

@router.get("")
def list_favourites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    favs = db.query(FavouriteRoute).filter(FavouriteRoute.user_id == current_user.id).all()
    results = []
    for f in favs:
        results.append({
            "id": f.id,
            "from_station": StationOut.from_orm(f.from_station).dict(),
            "to_station": StationOut.from_orm(f.to_station).dict(),
            "created_at": f.created_at.isoformat()
        })
    return success_response(
        data=results,
        message="Favourite routes retrieved"
    )

@router.post("")
def add_favourite(
    fav_in: FavouriteRouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from_st = db.query(Station).filter(Station.id == fav_in.from_station_id).first()
    to_st = db.query(Station).filter(Station.id == fav_in.to_station_id).first()
    if not from_st or not to_st:
        raise AppException(status_code=400, code="INVALID_STATION", message="Source or destination station is invalid.")

    # Avoid duplicate
    existing = db.query(FavouriteRoute).filter(
        FavouriteRoute.user_id == current_user.id,
        FavouriteRoute.from_station_id == fav_in.from_station_id,
        FavouriteRoute.to_station_id == fav_in.to_station_id
    ).first()
    if existing:
        return success_response(data={"id": existing.id}, message="Route already in favourites")

    fav = FavouriteRoute(
        user_id=current_user.id,
        from_station_id=fav_in.from_station_id,
        to_station_id=fav_in.to_station_id
    )
    db.add(fav)
    db.commit()
    db.refresh(fav)

    return success_response(
        data={
            "id": fav.id,
            "from_station": StationOut.from_orm(from_st).dict(),
            "to_station": StationOut.from_orm(to_st).dict(),
            "created_at": fav.created_at.isoformat()
        },
        message="Route added to favourites"
    )

@router.delete("/{id}")
def remove_favourite(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fav = db.query(FavouriteRoute).filter(
        FavouriteRoute.id == id,
        FavouriteRoute.user_id == current_user.id
    ).first()
    if not fav:
        raise AppException(status_code=404, code="NOT_FOUND", message="Favourite route not found.")

    db.delete(fav)
    db.commit()
    return success_response(data={"id": id}, message="Favourite route removed")
