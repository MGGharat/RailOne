from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import NotificationOut
from app.services.notification_service import NotificationService
from app.api.deps import get_current_user
from app.core.exceptions import success_response

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = NotificationService.get_user_notifications(db, current_user.id)
    return success_response(
        data=[NotificationOut.from_orm(n).dict() for n in notifs],
        message="Notifications retrieved"
    )

@router.put("/{id}/read")
def mark_notification_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = NotificationService.mark_as_read(db, id, current_user.id)
    return success_response(
        data=NotificationOut.from_orm(notif).dict(),
        message="Notification marked as read"
    )

@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = NotificationService.mark_all_as_read(db, current_user.id)
    return success_response(
        data={"updated_count": count},
        message="All notifications marked as read"
    )
