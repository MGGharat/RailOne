from fastapi import APIRouter
from app.api.v1 import (
    auth, stations, trains, passengers, bookings,
    pnr, live_status, payments, notifications, favourites, admin, fares
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(stations.router)
api_router.include_router(trains.router)
api_router.include_router(passengers.router)
api_router.include_router(bookings.router)
api_router.include_router(pnr.router)
api_router.include_router(live_status.router)
api_router.include_router(payments.router)
api_router.include_router(notifications.router)
api_router.include_router(favourites.router)
api_router.include_router(admin.router)
api_router.include_router(fares.router)
