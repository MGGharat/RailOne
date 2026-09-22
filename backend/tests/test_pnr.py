import pytest

def test_pnr_status_valid(client):
    # Seeded PNR
    pnr = "2489100000"
    res = client.get(f"/api/v1/pnr/{pnr}")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["pnr"] == pnr
    assert "train_number" in data
    assert "train_name" in data
    assert len(data["passengers"]) > 0
    assert "chart_status" in data

def test_pnr_status_invalid(client):
    res = client.get("/api/v1/pnr/0000000000")
    assert res.status_code == 404
    assert res.json()["success"] is False

def test_pnr_passenger_fields(client):
    pnr = "2489100000"
    res = client.get(f"/api/v1/pnr/{pnr}")
    pax = res.json()["data"]["passengers"][0]
    assert "passenger_name" in pax
    assert "booking_status" in pax
    assert "current_status" in pax
