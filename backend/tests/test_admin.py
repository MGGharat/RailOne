import pytest

def test_admin_dashboard_stats(client, admin_headers):
    res = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total_users"] >= 10
    assert data["total_bookings"] >= 20
    assert data["total_revenue"] > 0
    assert len(data["daily_trends"]) == 7
    assert len(data["popular_routes"]) > 0

def test_admin_dashboard_forbidden_for_regular_user(client, auth_headers):
    res = client.get("/api/v1/admin/dashboard", headers=auth_headers)
    assert res.status_code == 403

def test_admin_list_users(client, admin_headers):
    res = client.get("/api/v1/admin/users", headers=admin_headers)
    assert res.status_code == 200
    users = res.json()["data"]
    assert len(users) >= 10

def test_admin_list_bookings(client, admin_headers):
    res = client.get("/api/v1/admin/bookings", headers=admin_headers)
    assert res.status_code == 200
    bookings = res.json()["data"]
    assert len(bookings) >= 20

def test_admin_audit_logs(client, admin_headers):
    res = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert res.status_code == 200
    logs = res.json()["data"]
    assert len(logs) > 0
