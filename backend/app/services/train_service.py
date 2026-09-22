import json
from datetime import date, datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.core.exceptions import AppException
from app.models.models import Station, Train, TrainStation, Coach, Seat, TrainFare, SeatReservation
from app.schemas.schemas import StationOut, TrainSearchItem, AvailabilityByClass, TrainDetailOut, ScheduleStopOut
from app.core.redis_client import cache

class TrainService:
    @staticmethod
    def get_stations(db: Session, query: Optional[str] = None) -> List[Station]:
        cache_key = f"stations:query:{query.lower() if query else 'all'}"
        # We can query DB
        stmt = db.query(Station).filter(Station.is_active == True)
        if query:
            q_str = f"%{query}%"
            stmt = stmt.filter(
                or_(
                    Station.code.ilike(q_str),
                    Station.name.ilike(q_str),
                    Station.city.ilike(q_str),
                    Station.state.ilike(q_str)
                )
            )
        return stmt.order_by(Station.name).limit(50).all()

    @staticmethod
    def get_station_by_id(db: Session, station_id: int) -> Optional[Station]:
        return db.query(Station).filter(Station.id == station_id).first()

    @staticmethod
    def get_station_by_code(db: Session, code: str) -> Optional[Station]:
        return db.query(Station).filter(Station.code.ilike(code.strip())).first()

    @staticmethod
    def get_seat_availability(
        db: Session, 
        train_id: int, 
        coach_class: str, 
        journey_date: date, 
        quota: str = "GENERAL"
    ) -> AvailabilityByClass:
        # Check cache
        cache_key = f"avail:{train_id}:{coach_class}:{journey_date.isoformat()}:{quota}"
        # Calculate live from coaches & seat_reservations
        coaches = db.query(Coach).filter(
            Coach.train_id == train_id,
            Coach.coach_class == coach_class
        ).all()
        
        coach_ids = [c.id for c in coaches]
        total_seats = sum(c.seat_capacity for c in coaches)
        if total_seats == 0:
            total_seats = 64 # fallback default capacity if no coach mapped

        # Count active booked seats
        booked_count = 0
        if coach_ids:
            booked_count = db.query(SeatReservation).join(
                Seat, SeatReservation.seat_id == Seat.id
            ).filter(
                Seat.coach_id.in_(coach_ids),
                SeatReservation.journey_date == journey_date,
                SeatReservation.is_active == True
            ).count()

        available_count = max(0, total_seats - booked_count)

        # Fares
        fare_record = db.query(TrainFare).filter(
            TrainFare.train_id == train_id,
            TrainFare.coach_class == coach_class
        ).first()

        base_fare = fare_record.base_fare if fare_record else 500.0
        tatkal_surcharge = fare_record.tatkal_surcharge if fare_record else 250.0
        tatkal_fare = base_fare + tatkal_surcharge

        if quota.upper() == "TATKAL":
            # Tatkal pool is subset
            tatkal_seats = max(0, int(available_count * 0.3))
            status_text = f"AVAILABLE {tatkal_seats}" if tatkal_seats > 0 else "TATKAL WL 3"
            return AvailabilityByClass(
                coach_class=coach_class,
                available_seats=tatkal_seats,
                status=status_text,
                fare=tatkal_fare,
                tatkal_fare=tatkal_fare
            )

        if available_count > 5:
            status_text = f"AVAILABLE {available_count}"
        elif available_count > 0:
            status_text = f"RAC {available_count}"
        else:
            status_text = f"WL {abs(available_count) + 4}"

        return AvailabilityByClass(
            coach_class=coach_class,
            available_seats=available_count,
            status=status_text,
            fare=base_fare,
            tatkal_fare=tatkal_fare
        )

    @classmethod
    def search_trains(
        cls,
        db: Session,
        from_station_id: int,
        to_station_id: int,
        journey_date: date,
        coach_class: Optional[str] = None,
        quota: str = "GENERAL"
    ) -> List[TrainSearchItem]:
        # Validate past date
        if journey_date < date.today():
            raise AppException(status_code=400, code="INVALID_DATE", message="Journey date cannot be in the past")

        # Identify day of week
        # Monday is 0, Sunday is 6
        days_map = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
        day_str = days_map[journey_date.weekday()]

        from_st = cls.get_station_by_id(db, from_station_id)
        to_st = cls.get_station_by_id(db, to_station_id)

        if not from_st or not to_st:
            return []

        def find_pairs_for_stations(from_ids: List[int], to_ids: List[int]):
            ts_from = db.query(TrainStation).filter(TrainStation.station_id.in_(from_ids)).subquery()
            ts_to = db.query(TrainStation).filter(TrainStation.station_id.in_(to_ids)).subquery()

            return db.query(
                Train,
                ts_from.c.stop_number.label("from_stop"),
                ts_from.c.departure_time.label("from_dep"),
                ts_to.c.stop_number.label("to_stop"),
                ts_to.c.arrival_time.label("to_arr"),
                ts_to.c.day_offset.label("to_day"),
                ts_from.c.station_id.label("actual_from_id"),
                ts_to.c.station_id.label("actual_to_id")
            ).join(
                ts_from, Train.id == ts_from.c.train_id
            ).join(
                ts_to, Train.id == ts_to.c.train_id
            ).filter(
                ts_from.c.stop_number < ts_to.c.stop_number,
                Train.is_active == True,
                or_(
                    Train.runs_on_days.contains(day_str),
                    Train.runs_on_days.ilike("%DAILY%"),
                    Train.runs_on_days.ilike("%ALL%")
                )
            ).all()

        train_pairs = list(find_pairs_for_stations([from_station_id], [to_station_id]))

        # Include city-wide alternatives (e.g. BCT/CSMT/BDTS in Mumbai to NDLS/DLI in Delhi)
        # so passengers always discover all available trains between the two metro regions
        if from_st and to_st:
            same_city_from = [
                s.id for s in db.query(Station).filter(Station.city.ilike(from_st.city.strip()), Station.is_active == True).all()
            ]
            same_city_to = [
                s.id for s in db.query(Station).filter(Station.city.ilike(to_st.city.strip()), Station.is_active == True).all()
            ]
            if same_city_from and same_city_to:
                city_pairs = find_pairs_for_stations(same_city_from, same_city_to)
                existing_train_ids = {p[0].id for p in train_pairs}
                for cp in city_pairs:
                    if cp[0].id not in existing_train_ids:
                        train_pairs.append(cp)
                        existing_train_ids.add(cp[0].id)

        results = []
        seen_train_ids = set()

        for item in train_pairs:
            train_obj = item[0]
            if train_obj.id in seen_train_ids:
                continue
            seen_train_ids.add(train_obj.id)

            from_dep = item[2] or "00:00"
            to_arr = item[4] or "00:00"
            day_offset = item[5] or 0
            actual_from_id = item[6]
            actual_to_id = item[7]

            pair_from_st = cls.get_station_by_id(db, actual_from_id) or from_st
            pair_to_st = cls.get_station_by_id(db, actual_to_id) or to_st

            # Calculate duration
            try:
                t1 = datetime.strptime(from_dep, "%H:%M")
                t2 = datetime.strptime(to_arr, "%H:%M")
                diff_minutes = (t2.hour * 60 + t2.minute + (day_offset * 1440)) - (t1.hour * 60 + t1.minute)
                if diff_minutes < 0:
                    diff_minutes += 1440
                hours = diff_minutes // 60
                mins = diff_minutes % 60
                duration_str = f"{hours}h {mins:02d}m"
            except Exception:
                duration_str = "N/A"

            # Get classes
            available_classes = []
            fares = db.query(TrainFare).filter(TrainFare.train_id == train_obj.id).all()
            for fare in fares:
                if coach_class and fare.coach_class != coach_class:
                    continue
                avail = cls.get_seat_availability(db, train_obj.id, fare.coach_class, journey_date, quota)
                available_classes.append(avail)

            results.append(TrainSearchItem(
                id=train_obj.id,
                train_number=train_obj.train_number,
                name=train_obj.name,
                train_type=train_obj.train_type,
                source_station=StationOut.model_validate(train_obj.source_station),
                destination_station=StationOut.model_validate(train_obj.destination_station),
                from_station=StationOut.model_validate(pair_from_st),
                to_station=StationOut.model_validate(pair_to_st),
                departure_time=from_dep,
                arrival_time=to_arr,
                duration=duration_str,
                running_days=train_obj.runs_on_days.split(","),
                catering_available=train_obj.catering_available,
                availability=available_classes
            ))

        return results

    @classmethod
    def get_train_detail(cls, db: Session, train_id_or_number: str, journey_date: Optional[date] = None) -> Optional[TrainDetailOut]:
        if journey_date is None:
            journey_date = date.today()

        train = db.query(Train).filter(
            or_(
                Train.id == (int(train_id_or_number) if train_id_or_number.isdigit() else -1),
                Train.train_number == train_id_or_number
            )
        ).first()

        if not train:
            return None

        # Build schedule stops
        schedules = db.query(TrainStation).filter(
            TrainStation.train_id == train.id
        ).order_by(TrainStation.stop_number).all()

        schedule_stops = []
        for s in schedules:
            st = s.station
            schedule_stops.append(ScheduleStopOut(
                stop_number=s.stop_number,
                station_code=st.code,
                station_name=st.name,
                city=st.city,
                arrival_time=s.arrival_time,
                departure_time=s.departure_time,
                day_offset=s.day_offset,
                platform_number=s.platform_number,
                distance_from_source_km=s.distance_from_source_km,
                halt_duration_mins=s.halt_duration_mins
            ))

        # Build availability
        fares = db.query(TrainFare).filter(TrainFare.train_id == train.id).all()
        availability = []
        for fare in fares:
            avail = cls.get_seat_availability(db, train.id, fare.coach_class, journey_date)
            availability.append(avail)

        return TrainDetailOut(
            id=train.id,
            train_number=train.train_number,
            name=train.name,
            train_type=train.train_type,
            source_station=StationOut.model_validate(train.source_station),
            destination_station=StationOut.model_validate(train.destination_station),
            runs_on_days=train.runs_on_days,
            total_distance_km=train.total_distance_km,
            catering_available=train.catering_available,
            schedule=schedule_stops,
            availability=availability
        )
