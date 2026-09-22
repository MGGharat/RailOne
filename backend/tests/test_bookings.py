import pytest
from datetime import date, timedelta

def test_create_booking_success(client, auth_headers):
    journey_date = (date.today() + timedelta(days=7)).isoformat()
    booking_payload = {
        "train_id": 1,
        "from_station_id": 1,
        "to_station_id": 9,
        "journey_date": journey_date,
        "coach_class": "3A",
        "quota": "GENERAL",
        "payment_method": "UPI",
        "passengers": [
            {
                "full_name": "Aarav Sharma",
                "age": 31,
                "gender": "MALE",
                "berth_preference": "LOWER"
            }
        ]
    }

    res = client.post("/api/v1/bookings", json=booking_payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "pnr" in data
    assert len(data["pnr"]) == 10
    assert data["status"] == "CONFIRMED"
    assert data["total_amount"] > 0
    assert len(data["passengers"]) == 1
    assert data["passengers"][0]["seat_number"] is not None
    assert data["passengers"][0]["coach_code"] is not None

def test_booking_past_date_fails(client, auth_headers):
    past_date = (date.today() - timedelta(days=2)).isoformat()
    res = client.post("/api/v1/bookings", json={
        "train_id": 1,
        "from_station_id": 1,
        "to_station_id": 9,
        "journey_date": past_date,
        "coach_class": "3A",
        "passengers": [{"full_name": "Test", "age": 30, "gender": "MALE"}]
    }, headers=auth_headers)
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "INVALID_DATE"

def test_booking_invalid_train(client, auth_headers):
    journey_date = (date.today() + timedelta(days=5)).isoformat()
    res = client.post("/api/v1/bookings", json={
        "train_id": 99999,
        "from_station_id": 1,
        "to_station_id": 9,
        "journey_date": journey_date,
        "coach_class": "3A",
        "passengers": [{"full_name": "Test", "age": 30, "gender": "MALE"}]
    }, headers=auth_headers)
    assert res.status_code == 404

def test_booking_empty_passengers(client, auth_headers):
    journey_date = (date.today() + timedelta(days=5)).isoformat()
    res = client.post("/api/v1/bookings", json={
        "train_id": 1,
        "from_station_id": 1,
        "to_station_id": 9,
        "journey_date": journey_date,
        "coach_class": "3A",
        "passengers": []
    }, headers=auth_headers)
    assert res.status_code == 400

def test_list_user_bookings(client, auth_headers):
    res = client.get("/api/v1/bookings", headers=auth_headers)
    assert res.status_code == 200
    bookings = res.json()["data"]
    assert len(bookings) > 0
    assert "pnr" in bookings[0]

def test_filter_upcoming_bookings(client, auth_headers):
    res = client.get("/api/v1/bookings?status=UPCOMING", headers=auth_headers)
    assert res.status_code == 200
    bookings = res.json()["data"]
    assert isinstance(bookings, list)
