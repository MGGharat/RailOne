import pytest
from datetime import date, timedelta

def test_cancel_ticket_and_refund(client, auth_headers):
    journey_date = (date.today() + timedelta(days=9)).isoformat()
    book_res = client.post("/api/v1/bookings", json={
        "train_id": 1,
        "from_station_id": 1,
        "to_station_id": 9,
        "journey_date": journey_date,
        "coach_class": "3A",
        "passengers": [{"full_name": "Cancel Test", "age": 30, "gender": "MALE"}]
    }, headers=auth_headers)
    booking = book_res.json()["data"]
    b_id = booking["booking_id"]
    pnr = booking["pnr"]

    cancel_res = client.post(f"/api/v1/bookings/{b_id}/cancel", headers=auth_headers)
    assert cancel_res.status_code == 200
    cancel_data = cancel_res.json()["data"]
    assert cancel_data["status"] == "CANCELLED"
    assert cancel_data["refund_amount"] > 0
    assert cancel_data["cancellation_fee"] >= 120.0
    assert cancel_data["refund_status"] == "PROCESSED"

    pnr_res = client.get(f"/api/v1/pnr/{pnr}")
    assert pnr_res.status_code == 200
    assert pnr_res.json()["data"]["booking_status"] == "CANCELLED"

def test_cancel_already_cancelled_fails(client, auth_headers):
    journey_date = (date.today() + timedelta(days=10)).isoformat()
    book_res = client.post("/api/v1/bookings", json={
        "train_id": 1,
        "from_station_id": 1,
        "to_station_id": 9,
        "journey_date": journey_date,
        "coach_class": "3A",
        "passengers": [{"full_name": "Double Cancel", "age": 29, "gender": "MALE"}]
    }, headers=auth_headers)
    b_id = book_res.json()["data"]["booking_id"]
    client.post(f"/api/v1/bookings/{b_id}/cancel", headers=auth_headers)

    res = client.post(f"/api/v1/bookings/{b_id}/cancel", headers=auth_headers)
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "ALREADY_CANCELLED"

def test_download_ticket_pdf(client, auth_headers):
    res = client.get("/api/v1/bookings/2489100000/ticket-pdf", headers=auth_headers)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000
