import pytest

def test_calculate_fare_general(client):
    res = client.get("/api/v1/fares/calculate", params={
        "coach_class": "3A",
        "quota": "GENERAL",
        "passengers_count": 1
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "breakdown" in data["data"]
    assert "total_fare" in data["data"]
    assert data["data"]["coach_class"] == "3A"
    assert data["data"]["breakdown"]["base_fare"] > 0

def test_calculate_fare_tatkal(client):
    res = client.get("/api/v1/fares/calculate", params={
        "coach_class": "2A",
        "quota": "TATKAL",
        "passengers_count": 2
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["passengers_count"] == 2
    assert data["data"]["breakdown"]["tatkal_surcharge"] > 0
    assert data["data"]["total_fare"] > data["data"]["breakdown"]["total_per_passenger"]

def test_calculate_fare_sleeper_no_gst(client):
    res = client.get("/api/v1/fares/calculate", params={
        "coach_class": "SL",
        "quota": "GENERAL",
        "passengers_count": 1
    })
    assert res.status_code == 200
    data = res.json()
    # Non-AC classes do not incur GST
    assert data["data"]["breakdown"]["gst"] == 0.0
