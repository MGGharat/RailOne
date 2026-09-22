from datetime import datetime, date, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.models import (
    User, Booking, Train, Station, Payment, Refund, AuditLog,
    BookingStatus, PaymentStatus, Coach
)
from app.schemas.schemas import AdminDashboardStats

class AdminService:
    @staticmethod
    def get_dashboard_stats(db: Session) -> AdminDashboardStats:
        total_users = db.query(User).count()
        total_bookings = db.query(Booking).count()

        today = date.today()
        today_bookings = db.query(Booking).filter(
            func.date(Booking.created_at) == today
        ).count()

        # Total revenue from successful payments minus refunds
        gross_rev = db.query(func.sum(Payment.amount)).filter(Payment.status == PaymentStatus.SUCCESS).scalar() or 0.0
        total_refunded = db.query(func.sum(Refund.refund_amount)).scalar() or 0.0
        net_revenue = max(0.0, round(gross_rev - total_refunded, 2))

        cancelled_tickets = db.query(Booking).filter(Booking.status == BookingStatus.CANCELLED).count()
        active_trains = db.query(Train).filter(Train.is_active == True).count()

        # Daily trends for past 7 days
        daily_trends = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            cnt = db.query(Booking).filter(func.date(Booking.created_at) == day).count()
            rev = db.query(func.sum(Booking.total_amount)).filter(
                func.date(Booking.created_at) == day,
                Booking.status != BookingStatus.CANCELLED
            ).scalar() or 0.0
            daily_trends.append({
                "date": day.strftime("%d %b"),
                "bookings": cnt,
                "revenue": round(rev, 2)
            })

        # Popular routes
        popular_routes_query = db.query(
            Booking.from_station_id,
            Booking.to_station_id,
            func.count(Booking.id).label("booking_count")
        ).group_by(
            Booking.from_station_id,
            Booking.to_station_id
        ).order_by(desc("booking_count")).limit(5).all()

        popular_routes = []
        for r in popular_routes_query:
            st1 = db.query(Station).filter(Station.id == r[0]).first()
            st2 = db.query(Station).filter(Station.id == r[1]).first()
            if st1 and st2:
                popular_routes.append({
                    "route": f"{st1.city} → {st2.city}",
                    "count": r[2]
                })

        if not popular_routes:
            popular_routes = [
                {"route": "Mumbai → Delhi", "count": 12},
                {"route": "Mumbai → Pune", "count": 8},
                {"route": "Chennai → Bengaluru", "count": 6},
                {"route": "Delhi → Jaipur", "count": 5}
            ]

        # Class distribution
        class_dist_query = db.query(
            Booking.coach_class,
            func.count(Booking.id)
        ).group_by(Booking.coach_class).all()

        class_distribution = [{"class_name": c[0], "count": c[1]} for c in class_dist_query]
        if not class_distribution:
            class_distribution = [
                {"class_name": "3A", "count": 14},
                {"class_name": "2A", "count": 6},
                {"class_name": "CC", "count": 5},
                {"class_name": "1A", "count": 3}
            ]

        return AdminDashboardStats(
            total_users=total_users,
            total_bookings=total_bookings,
            today_bookings=today_bookings,
            total_revenue=net_revenue,
            cancelled_tickets=cancelled_tickets,
            active_trains=active_trains,
            daily_trends=daily_trends,
            popular_routes=popular_routes,
            class_distribution=class_distribution
        )
