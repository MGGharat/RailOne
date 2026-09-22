import pytest
from datetime import date, timedelta

def test_train_search_mumbai_delhi(client):
    target_date = (date.today() + timedelta(days=5)).isoformat()
    res = client.get(f"/api/v1/trains/search?from_code=CSMT&to_code=NDLS&journey_date={target_date}")
    assert res.status_code == 200
    trains = res.json()["data"]
    assert len(trains) > 0
    assert any("12951" in t["train_number"] for t in trains)

def test_train_search_mumbai_pune(client):
    target_date = (date.today() + timedelta(days=3)).isoformat()
    res = client.get(f"/api/v1/trains/search?from_code=CSMT&to_code=PUNE&journey_date={target_date}")
    assert res.status_code == 200
    trains = res.json()["data"]
    assert len(trains) > 0
    assert any("12123" in t["train_number"] for t in trains)

def test_train_search_invalid_stations(client):
    target_date = date.today().isoformat()
    res = client.get(f"/api/v1/trains/search?from_code=NONEXIST&to_code=UNKNOWN&journey_date={target_date}")
    assert res.status_code == 400

def test_get_train_detail_by_number(client):
    res = client.get("/api/v1/trains/12951")
    assert res.status_code == 200
    train = res.json()["data"]
    assert train["train_number"] == "12951"
    assert "Mumbai Rajdhani" in train["name"]
    assert len(train["schedule"]) >= 5
    assert len(train["availability"]) > 0

def test_get_train_schedule(client):
    res = client.get("/api/v1/trains/12951/schedule")
    assert res.status_code == 200
    schedule = res.json()["data"]
    assert len(schedule) >= 5
    assert schedule[0]["stop_number"] == 1
    assert schedule[0]["station_code"] in ["BCT", "CSMT"]

def test_get_seat_availability(client):
    target_date = (date.today() + timedelta(days=4)).isoformat()
    # Check 3A availability on train 1
    res = client.get(f"/api/v1/trains/1/availability?coach_class=3A&journey_date={target_date}")
    assert res.status_code == 200
    avail = res.json()["data"]
    assert avail["coach_class"] == "3A"
    assert "status" in avail
    assert avail["fare"] > 0

def test_list_trains_catalog(client):
    res = client.get("/api/v1/trains")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]) >= 10
    assert "train_number" in data["data"][0]

def test_train_search_with_alias_params(client):
    target_date = (date.today() + timedelta(days=5)).isoformat()
    # Using 'from' and 'to' and 'class_type' query aliases
    res = client.get(f"/api/v1/trains/search?from=CSMT&to=NDLS&journey_date={target_date}&class_type=3A")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]) > 0

def test_train_search_same_source_dest_error(client):
    target_date = (date.today() + timedelta(days=5)).isoformat()
    res = client.get(f"/api/v1/trains/search?from_code=CSMT&to_code=CSMT&journey_date={target_date}")
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "SAME_STATIONS"

def test_train_live_status(client):
    res = client.get("/api/v1/trains/12951/live-status")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["train_number"] == "12951"
    assert "timeline" in data["data"]
    assert len(data["data"]["timeline"]) > 0
