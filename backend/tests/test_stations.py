import pytest

def test_list_all_stations(client):
    res = client.get("/api/v1/stations")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]) >= 30

def test_search_station_by_query(client):
    res = client.get("/api/v1/stations?q=Mumbai")
    assert res.status_code == 200
    stations = res.json()["data"]
    assert len(stations) > 0
    codes = [s["code"] for s in stations]
    assert any(c in ["CSMT", "BCT", "BDTS"] for c in codes)

def test_get_station_by_id(client):
    # Retrieve station 1
    res = client.get("/api/v1/stations/1")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["id"] == 1
    assert "code" in data
    assert "name" in data

def test_get_nonexistent_station(client):
    res = client.get("/api/v1/stations/99999")
    assert res.status_code == 404
    assert res.json()["success"] is False

def test_search_station_explicit_endpoint(client):
    res = client.get("/api/v1/stations/search?q=pune")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert any(s["code"] == "PUNE" for s in data["data"])
