"""Tests for NEW features (iter 6):
   - /api/app-settings GET/PUT (business settings)
   - /api/app-settings/logo POST/DELETE
   - /api/app-images/{id} PATCH (fit toggle) + fit field in GET
   - PWA static: /manifest.json, /sw.js, /icons/*
"""
import io
import json
import os
import struct
import zlib

import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://expo-book-cleaning.preview.emergentagent.com"
).rstrip("/")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
WRONG_PW = {"X-Admin-Password": "nope"}
GOOD_PW = {"X-Admin-Password": ADMIN_PASSWORD}

ORIGINAL_BUSINESS = {
    "phone_display": "(780) 718-5092",
    "tollfree_display": "(833) TIDY-UPS",
    "tollfree_sub": "+1 (833) 843-9877",
    "address": "6510 Gateway Boulevard Suite 1020",
    "city_line": "Edmonton, AB T6H 5Z5",
    "website": "tidyupscleaning.com",
    "hours": [
        {"day": "Monday – Friday", "time": "8:00 AM – 6:00 PM"},
        {"day": "Saturday", "time": "9:00 AM – 4:00 PM"},
        {"day": "Sunday", "time": "Closed"},
    ],
}


def _tiny_png_bytes():
    """Return valid 1x1 red PNG bytes."""
    sig = b"\x89PNG\r\n\x1a\n"

    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    raw = b"\x00" + b"\xff\x00\x00"
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


# ==================== app-settings ====================
class TestAppSettingsGet:
    def test_get_returns_defaults_and_computed_fields(self):
        r = requests.get(f"{BASE_URL}/api/app-settings")
        assert r.status_code == 200
        d = r.json()
        # Business fields
        for k in ["phone_display", "tollfree_display", "tollfree_sub",
                  "address", "city_line", "website", "hours", "logo_url"]:
            assert k in d, f"missing key {k}"
        # Computed fields
        assert d["phone_tel"] == "tel:+17807185092"
        assert d["tollfree_tel"] == "tel:+18338439877"
        assert d["maps_url"].startswith("https://maps.google.com/?q=")
        assert d["website_url"].startswith("http")
        # Hours is array of {day,time}
        assert isinstance(d["hours"], list) and len(d["hours"]) >= 1
        for row in d["hours"]:
            assert "day" in row and "time" in row


class TestAppSettingsPut:
    def test_put_no_password_401(self):
        r = requests.put(f"{BASE_URL}/api/app-settings", json={"phone_display": "(999)"})
        assert r.status_code == 401

    def test_put_wrong_password_401(self):
        r = requests.put(f"{BASE_URL}/api/app-settings", json={"phone_display": "(999)"},
                         headers=WRONG_PW)
        assert r.status_code == 401

    def test_put_update_then_restore(self):
        # Update phone_display
        new_phone = "(780) 555-1234"
        r = requests.put(f"{BASE_URL}/api/app-settings",
                         json={"phone_display": new_phone}, headers=GOOD_PW)
        assert r.status_code == 200, r.text
        assert r.json()["phone_display"] == new_phone
        assert r.json()["phone_tel"] == "tel:+17805551234"

        # GET verifies persistence
        r2 = requests.get(f"{BASE_URL}/api/app-settings")
        assert r2.json()["phone_display"] == new_phone

        # Restore
        r3 = requests.put(f"{BASE_URL}/api/app-settings",
                          json={"phone_display": ORIGINAL_BUSINESS["phone_display"]},
                          headers=GOOD_PW)
        assert r3.status_code == 200
        assert r3.json()["phone_display"] == ORIGINAL_BUSINESS["phone_display"]

    def test_put_hours_update_then_restore(self):
        new_hours = [{"day": "Test Day", "time": "9-5"}]
        r = requests.put(f"{BASE_URL}/api/app-settings",
                         json={"hours": new_hours}, headers=GOOD_PW)
        assert r.status_code == 200
        assert r.json()["hours"] == new_hours

        # Restore full hours
        r2 = requests.put(f"{BASE_URL}/api/app-settings",
                          json={"hours": ORIGINAL_BUSINESS["hours"]}, headers=GOOD_PW)
        assert r2.status_code == 200
        assert r2.json()["hours"] == ORIGINAL_BUSINESS["hours"]


class TestAppSettingsLogo:
    def test_logo_upload_and_reset(self):
        # Upload logo
        png = _tiny_png_bytes()
        files = {"file": ("logo.png", io.BytesIO(png), "image/png")}
        r = requests.post(f"{BASE_URL}/api/app-settings/logo",
                          files=files, headers=GOOD_PW)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["logo_url"] and data["logo_url"].startswith("/api/app-images/file/")

        # GET reflects logo
        r2 = requests.get(f"{BASE_URL}/api/app-settings")
        assert r2.json()["logo_url"] == data["logo_url"]

        # Fetch the served logo
        r3 = requests.get(f"{BASE_URL}{data['logo_url']}")
        assert r3.status_code == 200
        assert r3.headers.get("content-type", "").startswith("image/")

        # Reset via DELETE (restore to null)
        r4 = requests.delete(f"{BASE_URL}/api/app-settings/logo", headers=GOOD_PW)
        assert r4.status_code == 200
        assert r4.json()["logo_url"] is None

    def test_logo_upload_wrong_password(self):
        png = _tiny_png_bytes()
        files = {"file": ("logo.png", io.BytesIO(png), "image/png")}
        r = requests.post(f"{BASE_URL}/api/app-settings/logo",
                          files=files, headers=WRONG_PW)
        assert r.status_code == 401

    def test_logo_delete_wrong_password(self):
        r = requests.delete(f"{BASE_URL}/api/app-settings/logo", headers=WRONG_PW)
        assert r.status_code == 401


# ==================== app-images fit ====================
class TestAppImageFit:
    def _get_first_image(self):
        r = requests.get(f"{BASE_URL}/api/app-images")
        assert r.status_code == 200
        imgs = r.json()
        assert len(imgs) > 0
        return imgs[0]

    def test_get_includes_fit_field_default_cover(self):
        r = requests.get(f"{BASE_URL}/api/app-images")
        assert r.status_code == 200
        for img in r.json():
            assert "fit" in img
            assert img["fit"] in ("cover", "contain")

    def test_patch_fit_wrong_password_401(self):
        img = self._get_first_image()
        r = requests.patch(f"{BASE_URL}/api/app-images/{img['id']}",
                           json={"fit": "contain"}, headers=WRONG_PW)
        assert r.status_code == 401

    def test_patch_fit_invalid_value_400(self):
        img = self._get_first_image()
        r = requests.patch(f"{BASE_URL}/api/app-images/{img['id']}",
                           json={"fit": "bogus"}, headers=GOOD_PW)
        assert r.status_code == 400

    def test_patch_fit_toggle_and_restore(self):
        img = self._get_first_image()
        original_fit = img.get("fit", "cover")

        # Set to contain
        r = requests.patch(f"{BASE_URL}/api/app-images/{img['id']}",
                           json={"fit": "contain"}, headers=GOOD_PW)
        assert r.status_code == 200
        assert r.json()["fit"] == "contain"

        # Verify persisted via GET
        r2 = requests.get(f"{BASE_URL}/api/app-images")
        assert next(i for i in r2.json() if i["id"] == img["id"])["fit"] == "contain"

        # Restore
        r3 = requests.patch(f"{BASE_URL}/api/app-images/{img['id']}",
                            json={"fit": original_fit}, headers=GOOD_PW)
        assert r3.status_code == 200
        assert r3.json()["fit"] == original_fit


# ==================== PWA ====================
FRONTEND_URL = "https://expo-book-cleaning.preview.emergentagent.com"


class TestPWA:
    def test_manifest_json(self):
        r = requests.get(f"{FRONTEND_URL}/manifest.json")
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "Tidyups Cleaning"
        assert d["display"] == "standalone"
        assert isinstance(d.get("icons"), list) and len(d["icons"]) >= 3

    def test_service_worker(self):
        r = requests.get(f"{FRONTEND_URL}/sw.js")
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert "javascript" in ct or "application/x-javascript" in ct or ct.startswith("text/"), ct
        assert len(r.content) > 10

    @pytest.mark.parametrize("path", [
        "/icons/icon-192.png",
        "/icons/icon-512.png",
        "/icons/icon-maskable-512.png",
        "/icons/apple-touch-icon.png",
    ])
    def test_icons(self, path):
        r = requests.get(f"{FRONTEND_URL}{path}")
        assert r.status_code == 200, path
        assert r.headers.get("content-type", "").startswith("image/"), path

    def test_index_html_has_pwa_tags(self):
        r = requests.get(f"{FRONTEND_URL}/")
        assert r.status_code == 200
        html = r.text
        assert 'rel="manifest"' in html or "rel='manifest'" in html
        assert "#0A0611" in html
        assert "apple-touch-icon" in html
        assert "serviceWorker" in html or "sw.js" in html
