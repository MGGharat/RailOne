from datetime import datetime, date, time
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import Train, TrainStation, Station
from app.schemas.schemas import LiveTrainStatusOut, LiveTimelineStop
from app.core.exceptions import AppException

class LiveTrainService:
    @classmethod
    def get_live_status(cls, db: Session, train_number: str, journey_date: Optional[date] = None) -> LiveTrainStatusOut:
        clean_num = train_number.strip()
        train = db.query(Train).filter(Train.train_number == clean_num).first()
        if not train:
            raise AppException(status_code=404, code="TRAIN_NOT_FOUND", message=f"Train number '{clean_num}' not found.")

        if not journey_date:
            journey_date = date.today()

        schedules = db.query(TrainStation).filter(
            TrainStation.train_id == train.id
        ).order_by(TrainStation.stop_number).all()

        if not schedules:
            raise AppException(status_code=404, code="NO_SCHEDULE", message="No schedule found for this train.")

        # Simulate real-time progress based on current system time
        now = datetime.now()
        current_minute_of_day = now.hour * 60 + now.minute

        # Realistic mock delay between 0 and 15 minutes
        simulated_delay = 5 if int(clean_num) % 2 == 0 else 0

        timeline: List[LiveTimelineStop] = []
        current_st_name = None
        prev_st_name = None
        next_st_name = None

        # Determine progression
        total_stops = len(schedules)
        # Select an intermediate stop index based on hour of day to create dynamic, lifelike tracking
        active_idx = (now.hour // 4) % total_stops
        if active_idx == 0:
            active_idx = 1 if total_stops > 1 else 0

        for i, s in enumerate(schedules):
            st = s.station
            sched_dep = s.departure_time or s.arrival_time
            sched_arr = s.arrival_time or s.departure_time

            # Calculate actual with delay
            def add_delay(time_str: Optional[str], delay_mins: int) -> Optional[str]:
                if not time_str:
                    return None
                try:
                    t = datetime.strptime(time_str, "%H:%M")
                    total_m = t.hour * 60 + t.minute + delay_mins
                    new_h = (total_m // 60) % 24
                    new_m = total_m % 60
                    return f"{new_h:02d}:{new_m:02d}"
                except Exception:
                    return time_str

            act_arr = add_delay(sched_arr, simulated_delay)
            act_dep = add_delay(sched_dep, simulated_delay)

            if i < active_idx:
                stop_status = "DEPARTED"
            elif i == active_idx:
                stop_status = "CURRENT"
                current_st_name = f"{st.name} ({st.code})"
                if i > 0:
                    prev_st = schedules[i - 1].station
                    prev_st_name = f"{prev_st.name} ({prev_st.code})"
                if i + 1 < total_stops:
                    nxt_st = schedules[i + 1].station
                    next_st_name = f"{nxt_st.name} ({nxt_st.code})"
            else:
                stop_status = "UPCOMING"
                if next_st_name is None and i == active_idx + 1:
                    next_st_name = f"{st.name} ({st.code})"

            timeline.append(LiveTimelineStop(
                station_code=st.code,
                station_name=st.name,
                city=st.city,
                scheduled_arrival=sched_arr,
                scheduled_departure=sched_dep,
                actual_arrival=act_arr,
                actual_departure=act_dep,
                platform=s.platform_number,
                distance_km=s.distance_from_source_km,
                status=stop_status,
                delay_minutes=simulated_delay if stop_status != "DEPARTED" else 0
            ))

        if not current_st_name:
            current_st_name = f"{schedules[0].station.name} ({schedules[0].station.code})"

        return LiveTrainStatusOut(
            train_number=train.train_number,
            train_name=train.name,
            journey_date=journey_date,
            current_station=current_st_name,
            previous_station=prev_st_name,
            next_station=next_st_name,
            status="ON_TIME" if simulated_delay == 0 else f"RUNNING LATE BY {simulated_delay} MINS",
            overall_delay_minutes=simulated_delay,
            timeline=timeline
        )
