"""Backend tests for cleaner location tracking + staff PIN endpoints (iter 7).

Local backend under test: preview URL (image/cleaner endpoints).
Admin password comes from backend/.env (loaded by conftest). Cleaner PIN: 1234.
Ensures cleanup: deletes any TEST_ cleaners created; restores PIN back to '1234'.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://expo-book-cleaning.preview.emergentagent.com"
).rstrip("/")
ADMIN_PW = os.environ.get("ADMIN_PASSWORD", "")
DEFAULT_PIN = "1234"

GOOD_PW = {"X-Admin-Password": ADMIN_PW}
WRONG_PW = {"X-Admin-Password": "bad"}


@pytest.fixture(scope="module", autouse=True)
def cleanup_state():
    """Track created cleaners + PIN; restore at end."""
    created_ids = []
    yield created_ids
    # Restore PIN to default (best effort)
    try:
        requests.put(f"{BASE_URL}/api/staff/pin", json={"pin": DEFAULT_PIN}, headers=GOOD_PW, timeout=10)
    except Exception:
        pass
    # Delete every TEST_ cleaner
    try:
        r = requests.get(f"{BASE_URL}/api/cleaners", headers=GOOD_PW, timeout=10)
        if r.ok:
            for c in r.json():
                if c.get("name", "").startswith("TEST_") or c.get("id") in created_ids:
                    requests.delete(f"{BASE_URL}/api/cleaners/{c['id']}", headers=GOOD_PW, timeout=10)
    except Exception:
        pass


# ------------------------ staff PIN ------------------------
class TestStaffPin:
    def test_get_pin_requires_admin(self):
        r = requests.get(f"{BASE_URL}/api/staff/pin", timeout=10)
        assert r.status_code == 401

    def test_get_pin_wrong_admin(self):
        r = requests.get(f"{BASE_URL}/api/staff/pin", headers=WRONG_PW, timeout=10)
        assert r.status_code == 401

    def test_get_pin_ok(self):
        r = requests.get(f"{BASE_URL}/api/staff/pin", headers=GOOD_PW, timeout=10)
        assert r.status_code == 200
        assert r.json().get("pin") == DEFAULT_PIN

    def test_put_pin_rejects_non_digits(self):
        r = requests.put(f"{BASE_URL}/api/staff/pin", json={"pin": "abc"}, headers=GOOD_PW, timeout=10)
        assert r.status_code == 400

    def test_put_pin_rejects_short(self):
        r = requests.put(f"{BASE_URL}/api/staff/pin", json={"pin": "12"}, headers=GOOD_PW, timeout=10)
        assert r.status_code == 400

    def test_put_pin_rejects_long(self):
        r = requests.put(f"{BASE_URL}/api/staff/pin", json={"pin": "123456789"}, headers=GOOD_PW, timeout=10)
        assert r.status_code == 400

    def test_put_pin_requires_admin(self):
        r = requests.put(f"{BASE_URL}/api/staff/pin", json={"pin": "5555"}, timeout=10)
        assert r.status_code == 401

    def test_put_pin_updates_and_old_pin_rejected_then_restore(self):
        # Change to a new pin
        r = requests.put(f"{BASE_URL}/api/staff/pin", json={"pin": "5678"}, headers=GOOD_PW, timeout=10)
        assert r.status_code == 200
        assert r.json().get("pin") == "5678"

        # Old default PIN should no longer work on checkin
        r2 = requests.post(f"{BASE_URL}/api/cleaners/checkin",
                           json={"name": "TEST_OldPin", "pin": DEFAULT_PIN}, timeout=10)
        assert r2.status_code == 401

        # New pin works
        r3 = requests.post(f"{BASE_URL}/api/cleaners/checkin",
                           json={"name": "TEST_NewPin", "pin": "5678"}, timeout=10)
        assert r3.status_code == 200
        cid = r3.json()["cleaner_id"]

        # Cleanup this cleaner + restore PIN
        requests.delete(f"{BASE_URL}/api/cleaners/{cid}", headers=GOOD_PW, timeout=10)
        r4 = requests.put(f"{BASE_URL}/api/staff/pin", json={"pin": DEFAULT_PIN}, headers=GOOD_PW, timeout=10)
        assert r4.status_code == 200
        assert r4.json().get("pin") == DEFAULT_PIN


# ------------------------ /cleaners/checkin ------------------------
class TestCleanerCheckin:
    def test_checkin_ok(self, cleanup_state):
        r = requests.post(f"{BASE_URL}/api/cleaners/checkin",
                          json={"name": "TEST_Alice", "pin": DEFAULT_PIN}, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "cleaner_id" in data and isinstance(data["cleaner_id"], str) and len(data["cleaner_id"]) > 0
        assert data["name"] == "TEST_Alice"
        cleanup_state.append(data["cleaner_id"])

    def test_checkin_wrong_pin(self):
        r = requests.post(f"{BASE_URL}/api/cleaners/checkin",
                          json={"name": "TEST_Bob", "pin": "0000"}, timeout=10)
        assert r.status_code == 401

    def test_checkin_empty_name(self):
        r = requests.post(f"{BASE_URL}/api/cleaners/checkin",
                          json={"name": "   ", "pin": DEFAULT_PIN}, timeout=10)
        assert r.status_code == 400

    def test_checkin_dedupe_same_name(self, cleanup_state):
        r1 = requests.post(f"{BASE_URL}/api/cleaners/checkin",
                           json={"name": "TEST_Dupe", "pin": DEFAULT_PIN}, timeout=10)
        assert r1.status_code == 200
        first_id = r1.json()["cleaner_id"]
        cleanup_state.append(first_id)

        # Same name, different case + extra spaces — should still return same id
        r2 = requests.post(f"{BASE_URL}/api/cleaners/checkin",
                           json={"name": "  test_dupe  ", "pin": DEFAULT_PIN}, timeout=10)
        assert r2.status_code == 200
        assert r2.json()["cleaner_id"] == first_id


# ------------------------ /cleaners/location + /stop ------------------------
class TestCleanerLocation:
    @pytest.fixture(scope="class")
    def cleaner(self):
        r = requests.post(f"{BASE_URL}/api/cleaners/checkin",
                          json={"name": "TEST_Locator", "pin": DEFAULT_PIN}, timeout=10)
        assert r.status_code == 200
        yield r.json()["cleaner_id"]
        # Cleanup after class
        try:
            requests.delete(f"{BASE_URL}/api/cleaners/{r.json()['cleaner_id']}", headers=GOOD_PW, timeout=10)
        except Exception:
            pass

    def test_location_ok_sets_sharing_true(self, cleaner):
        r = requests.post(f"{BASE_URL}/api/cleaners/location",
                          json={"cleaner_id": cleaner, "pin": DEFAULT_PIN,
                                "lat": 53.5461, "lng": -113.4938}, timeout=10)
        assert r.status_code == 200
        assert r.json().get("ok")
        assert "at" in r.json()

        # Verify via admin list
        r2 = requests.get(f"{BASE_URL}/api/cleaners", headers=GOOD_PW, timeout=10)
        assert r2.status_code == 200
        rec = next((c for c in r2.json() if c["id"] == cleaner), None)
        assert rec is not None
        assert rec["sharing"]
        assert abs(rec["lat"] - 53.5461) < 1e-6
        assert abs(rec["lng"] - (-113.4938)) < 1e-6
        assert rec["last_seen"]

    def test_location_wrong_pin(self, cleaner):
        r = requests.post(f"{BASE_URL}/api/cleaners/location",
                          json={"cleaner_id": cleaner, "pin": "0000",
                                "lat": 1.0, "lng": 2.0}, timeout=10)
        assert r.status_code == 401

    def test_location_unknown_cleaner(self):
        r = requests.post(f"{BASE_URL}/api/cleaners/location",
                          json={"cleaner_id": "no-such-id", "pin": DEFAULT_PIN,
                                "lat": 1.0, "lng": 2.0}, timeout=10)
        assert r.status_code == 404

    def test_stop_sets_sharing_false(self, cleaner):
        # First push a location
        requests.post(f"{BASE_URL}/api/cleaners/location",
                      json={"cleaner_id": cleaner, "pin": DEFAULT_PIN,
                            "lat": 53.55, "lng": -113.5}, timeout=10)
        r = requests.post(f"{BASE_URL}/api/cleaners/stop",
                         json={"cleaner_id": cleaner, "pin": DEFAULT_PIN}, timeout=10)
        assert r.status_code == 200
        assert r.json().get("ok")

        r2 = requests.get(f"{BASE_URL}/api/cleaners", headers=GOOD_PW, timeout=10)
        rec = next((c for c in r2.json() if c["id"] == cleaner), None)
        assert rec is not None and not rec["sharing"]


# ------------------------ admin list + delete ------------------------
class TestCleanerAdmin:
    def test_list_requires_admin(self):
        r = requests.get(f"{BASE_URL}/api/cleaners", timeout=10)
        assert r.status_code == 401
        r2 = requests.get(f"{BASE_URL}/api/cleaners", headers=WRONG_PW, timeout=10)
        assert r2.status_code == 401

    def test_list_returns_expected_shape(self, cleanup_state):
        r = requests.post(f"{BASE_URL}/api/cleaners/checkin",
                          json={"name": "TEST_Listing", "pin": DEFAULT_PIN}, timeout=10)
        assert r.status_code == 200
        cid = r.json()["cleaner_id"]
        cleanup_state.append(cid)

        r2 = requests.get(f"{BASE_URL}/api/cleaners", headers=GOOD_PW, timeout=10)
        assert r2.status_code == 200
        rows = r2.json()
        assert isinstance(rows, list)
        rec = next((c for c in rows if c["id"] == cid), None)
        assert rec is not None
        for key in ("id", "name", "sharing", "lat", "lng", "last_seen"):
            assert key in rec

    def test_delete_requires_admin(self, cleanup_state):
        r = requests.post(f"{BASE_URL}/api/cleaners/checkin",
                          json={"name": "TEST_Delete", "pin": DEFAULT_PIN}, timeout=10)
        cid = r.json()["cleaner_id"]
        cleanup_state.append(cid)

        r1 = requests.delete(f"{BASE_URL}/api/cleaners/{cid}", timeout=10)
        assert r1.status_code == 401

        r2 = requests.delete(f"{BASE_URL}/api/cleaners/{cid}", headers=GOOD_PW, timeout=10)
        assert r2.status_code == 200
        assert r2.json().get("ok")

        # Confirm gone
        r3 = requests.get(f"{BASE_URL}/api/cleaners", headers=GOOD_PW, timeout=10)
        assert not any(c["id"] == cid for c in r3.json())

    def test_delete_unknown_returns_404(self):
        r = requests.delete(f"{BASE_URL}/api/cleaners/no-such-id", headers=GOOD_PW, timeout=10)
        assert r.status_code == 404
