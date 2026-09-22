import pytest
from datetime import date, timedelta

def test_seat_uniqueness_across_consecutive_bookings(client, auth_headers):
    journey_date = (date.today() + timedelta(days=12)).isoformat()
    
    # First booking
    res1 = client.post("/api/v1/bookings", json={
        "train_id": 1,
        "from_station_id": 1,
        "to_station_id": 9,
        "journey_date": journey_date,
        "coach_class": "1A",
        "quota": "GENERAL",
        "passengers": [
            {"full_name": "Passenger Alpha", "age": 28, "gender": "MALE"}
        ]
    }, headers=auth_headers)
    assert res1.status_code == 200
    pax1 = res1.json()["data"]["passengers"][0]
    seat1 = (pax1["coach_code"], pax1["seat_number"])

    # Second booking on exact same train, class, and date
    res2 = client.post("/api/v1/bookings", json={
        "train_id": 1,
        "from_station_id": 1,
        "to_station_id": 9,
        "journey_date": journey_date,
        "coach_class": "1A",
        "quota": "GENERAL",
        "passengers": [
            {"full_name": "Passenger Beta", "age": 30, "gender": "FEMALE"}
        ]
    }, headers=auth_headers)
    assert res2.status_code == 200
    pax2 = res2.json()["data"]["passengers"][0]
    seat2 = (pax2["coach_code"], pax2["seat_number"])

    # Verify no seat collision occurred!
    assert seat1 != seat2, f"Double booking detected! Both got seat: {seat1}"

def test_multi_passenger_seat_allocation(client, auth_headers):
    journey_date = (date.today() + timedelta(days=14)).isoformat()
    res = client.post("/api/v1/bookings", json={
        "train_id": 1,
        "from_station_id": 1,
        "to_station_id": 9,
        "journey_date": journey_date,
        "coach_class": "2A",
        "quota": "GENERAL",
        "passengers": [
            {"full_name": "Family Member 1", "age": 45, "gender": "MALE"},
            {"full_name": "Family Member 2", "age": 42, "gender": "FEMALE"},
            {"full_name": "Family Member 3", "age": 16, "gender": "MALE"}
        ]
    }, headers=auth_headers)
    assert res.status_code == 200
    passengers = res.json()["data"]["passengers"]
    assert len(passengers) == 3

    # Ensure all 3 have distinct seats
    allocated_seats = [(p["coach_code"], p["seat_number"]) for p in passengers]
    assert len(allocated_seats) == len(set(allocated_seats)), "Duplicate seat assigned in same booking!"
