import pytest

def test_list_saved_passengers(client, auth_headers):
    res = client.get("/api/v1/passengers", headers=auth_headers)
    assert res.status_code == 200
    passengers = res.json()["data"]
    assert len(passengers) >= 3

def test_add_passenger(client, auth_headers):
    res = client.post("/api/v1/passengers", json={
        "full_name": "Maya Sharma",
        "age": 28,
        "gender": "FEMALE",
        "berth_preference": "WINDOW",
        "nationality": "INDIAN"
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["full_name"] == "Maya Sharma"
    assert data["age"] == 28

def test_update_passenger(client, auth_headers):
    # Add a passenger first
    add_res = client.post("/api/v1/passengers", json={
        "full_name": "Kiran Rao",
        "age": 40,
        "gender": "MALE",
        "berth_preference": "LOWER"
    }, headers=auth_headers)
    pax_id = add_res.json()["data"]["id"]

    res = client.put(f"/api/v1/passengers/{pax_id}", json={
        "full_name": "Kiran S. Rao",
        "age": 41
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["full_name"] == "Kiran S. Rao"

def test_delete_passenger(client, auth_headers):
    add_res = client.post("/api/v1/passengers", json={
        "full_name": "Temp Pax",
        "age": 25,
        "gender": "FEMALE"
    }, headers=auth_headers)
    pax_id = add_res.json()["data"]["id"]

    del_res = client.delete(f"/api/v1/passengers/{pax_id}", headers=auth_headers)
    assert del_res.status_code == 200

def test_passenger_age_validation(client, auth_headers):
    res = client.post("/api/v1/passengers", json={
        "full_name": "Invalid Age Pax",
        "age": -5,
        "gender": "MALE"
    }, headers=auth_headers)
    assert res.status_code == 422
