import pytest

def test_user_registration(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "testnewuser@example.com",
        "password": "Password@123",
        "full_name": "Test User",
        "mobile": "9811122233",
        "gender": "MALE"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "testnewuser@example.com"

def test_user_registration_duplicate_email(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "user@railone.demo",
        "password": "Password@123",
        "full_name": "Duplicate User",
        "mobile": "9998887776"
    })
    assert res.status_code == 400
    assert res.json()["success"] is False

def test_user_login_success(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "user@railone.demo",
        "password": "User@12345"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["role"] == "USER"

def test_user_login_invalid_password(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "user@railone.demo",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
    assert res.json()["success"] is False

def test_user_login_nonexistent_email(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com",
        "password": "Password@123"
    })
    assert res.status_code == 401

def test_get_current_user_profile(client, auth_headers):
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["email"] == "user@railone.demo"

def test_update_profile(client, auth_headers):
    res = client.put("/api/v1/auth/me", json={
        "full_name": "Aarav Sharma Updated",
        "address": "Bandra West, Mumbai"
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["data"]["full_name"] == "Aarav Sharma Updated"

def test_token_refresh(client):
    login_res = client.post("/api/v1/auth/login", json={
        "email": "user@railone.demo",
        "password": "User@12345"
    })
    refresh_token = login_res.json()["data"]["refresh_token"]

    res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert res.status_code == 200
    assert "access_token" in res.json()["data"]

def test_user_login_with_mobile(client):
    res = client.post("/api/v1/auth/login", json={
        "mobile": "9876543210",
        "password": "User@12345"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "user@railone.demo"

def test_user_registration_with_first_and_last_name(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "rohit.verma@example.com",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "first_name": "Rohit",
        "last_name": "Verma",
        "mobile": "9822334455"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["data"]["user"]["full_name"] == "Rohit Verma"

def test_user_registration_password_mismatch(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "mismatch@example.com",
        "password": "Password123",
        "confirm_password": "DifferentPassword123",
        "full_name": "Mismatch User",
        "mobile": "9877001122"
    })
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "PASSWORD_MISMATCH"
