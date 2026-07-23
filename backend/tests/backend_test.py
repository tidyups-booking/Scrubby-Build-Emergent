"""Backend API tests for Tidyups Cleaning quote landing page."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://expo-book-cleaning.preview.emergentagent.com").rstrip("/")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

created_quote_ids = []


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Health ----------
class TestHealth:
    def test_root(self, api):
        r = api.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert "message" in r.json()


# ---------- Create quote ----------
class TestCreateQuote:
    def test_create_quote_minimum_required(self, api):
        payload = {
            "name": "TEST_Jane Doe",
            "phone": "(780) 555-0100",
            "service_type": "Residential Cleaning",
        }
        r = api.post(f"{BASE_URL}/api/quotes", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["phone"] == payload["phone"]
        assert data["service_type"] == payload["service_type"]
        assert data["status"] == "new"
        assert "id" in data and isinstance(data["id"], str)
        assert "created_at" in data
        created_quote_ids.append(data["id"])

    def test_create_quote_full(self, api):
        payload = {
            "name": "TEST_John Full",
            "phone": "(780) 555-0199",
            "email": "test_full@example.com",
            "service_type": "Deep Cleaning",
            "property_type": "House",
            "bedrooms": "3",
            "bathrooms": "2",
            "address": "123 Main St, Edmonton",
            "preferred_date": "2026-02-14",
            "message": "3 bedrooms, 2 pets",
        }
        r = api.post(f"{BASE_URL}/api/quotes", json=payload)
        assert r.status_code == 200
        data = r.json()
        for k, v in payload.items():
            assert data[k] == v
        created_quote_ids.append(data["id"])

    def test_create_quote_bedrooms_bathrooms_persist(self, api):
        """Verify bedrooms/bathrooms are saved and returned via admin GET."""
        payload = {
            "name": "TEST_BedsBaths Persist",
            "phone": "(780) 555-0177",
            "service_type": "Move-in / Move-out",
            "bedrooms": "4",
            "bathrooms": "3.5",
        }
        r = api.post(f"{BASE_URL}/api/quotes", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["bedrooms"] == "4"
        assert data["bathrooms"] == "3.5"
        created_quote_ids.append(data["id"])

        # Verify persistence via admin list
        r2 = requests.get(f"{BASE_URL}/api/quotes", headers={"X-Admin-Password": ADMIN_PASSWORD})
        assert r2.status_code == 200
        match = next((q for q in r2.json() if q["id"] == data["id"]), None)
        assert match is not None, "Newly created lead not found via admin GET"
        assert match["bedrooms"] == "4"
        assert match["bathrooms"] == "3.5"
        assert match["name"] == "TEST_BedsBaths Persist"

    def test_create_quote_missing_required_fails(self, api):
        r = api.post(f"{BASE_URL}/api/quotes", json={"name": "TEST_x"})
        assert r.status_code == 422


# ---------- Admin GET /api/quotes ----------
class TestListQuotesAuth:
    def test_get_quotes_no_header(self, api):
        r = requests.get(f"{BASE_URL}/api/quotes")
        assert r.status_code == 401

    def test_get_quotes_wrong_password(self, api):
        r = requests.get(f"{BASE_URL}/api/quotes", headers={"X-Admin-Password": "wrong"})
        assert r.status_code == 401

    def test_get_quotes_correct_password_returns_list(self, api):
        r = requests.get(f"{BASE_URL}/api/quotes", headers={"X-Admin-Password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # created quotes should be present
        ids = [q["id"] for q in data]
        for cid in created_quote_ids:
            assert cid in ids
        # No mongo _id leaks
        for q in data:
            assert "_id" not in q


# ---------- Admin login ----------
class TestAdminLogin:
    def test_admin_login_correct(self):
        r = requests.post(f"{BASE_URL}/api/admin/login", headers={"X-Admin-Password": ADMIN_PASSWORD})
        assert r.status_code == 200
        assert r.json().get("ok")

    def test_admin_login_wrong(self):
        r = requests.post(f"{BASE_URL}/api/admin/login", headers={"X-Admin-Password": "nope"})
        assert r.status_code == 401


# ---------- Cleanup ----------
def test_zz_cleanup_test_leads():
    """Best-effort cleanup: log count of TEST_ leads remaining."""
    r = requests.get(f"{BASE_URL}/api/quotes", headers={"X-Admin-Password": ADMIN_PASSWORD})
    assert r.status_code == 200
    test_leads = [q for q in r.json() if q["name"].startswith("TEST_")]
    print(f"\n[cleanup] {len(test_leads)} TEST_ leads currently in DB (no delete endpoint)")
