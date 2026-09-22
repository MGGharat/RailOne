import pytest

def test_list_notifications(client, auth_headers):
    res = client.get("/api/v1/notifications", headers=auth_headers)
    assert res.status_code == 200
    notifs = res.json()["data"]
    assert isinstance(notifs, list)
    assert len(notifs) > 0

def test_mark_notification_read(client, auth_headers):
    res = client.get("/api/v1/notifications", headers=auth_headers)
    notif_id = res.json()["data"][0]["id"]

    read_res = client.put(f"/api/v1/notifications/{notif_id}/read", headers=auth_headers)
    assert read_res.status_code == 200
    assert read_res.json()["data"]["is_read"] is True

def test_mark_all_notifications_read(client, auth_headers):
    res = client.put("/api/v1/notifications/read-all", headers=auth_headers)
    assert res.status_code == 200
    assert "updated_count" in res.json()["data"]
