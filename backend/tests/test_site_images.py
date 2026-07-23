"""Backend tests for the Site Image Manager (hero + gallery).

Covers:
- GET /api/site-images (public)
- POST /api/site-images/upload (admin protected; requires image mime)
- DELETE /api/site-images/{id} (admin protected; soft delete)
- GET /api/site-images/file/{path} (public serve)
- Regression: quote form still works, Twilio SMS non-blocking
"""
import io
import os
import struct
import zlib
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://expo-book-cleaning.preview.emergentagent.com").rstrip("/")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")


def _tiny_png_bytes() -> bytes:
    """Return a valid 1x1 PNG image."""
    # Manually construct a minimal 1x1 red PNG
    sig = b"\x89PNG\r\n\x1a\n"

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)  # 1x1, 8-bit RGB
    raw = b"\x00\xff\x00\x00"  # filter byte + one red pixel
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


PNG_BYTES = _tiny_png_bytes()


# Track ids to clean up
_created_ids = []


class TestGetSiteImages:
    def test_get_public_no_auth(self):
        r = requests.get(f"{BASE_URL}/api/site-images")
        assert r.status_code == 200
        data = r.json()
        assert "hero" in data and "gallery" in data and "why" in data
        assert data["hero"] is not None
        assert data["hero"]["label"] == "Our Fleet"
        assert data["hero"]["section"] == "hero"
        assert isinstance(data["gallery"], list)
        assert len(data["gallery"]) >= 4
        # No mongo _id leaks
        assert "_id" not in data["hero"]
        assert "_id" not in data["why"]
        for g in data["gallery"]:
            assert "_id" not in g
            assert g["section"] == "gallery"

    def test_seeded_gallery_labels_present(self):
        r = requests.get(f"{BASE_URL}/api/site-images")
        labels = {g["label"] for g in r.json()["gallery"]}
        for expected in {"Serving Edmonton", "Home & Office Service", "Our Team", "On The Road"}:
            assert expected in labels

    def test_why_section_seeded(self):
        """NEW: verify 'why' section exists with expected default label and URL."""
        r = requests.get(f"{BASE_URL}/api/site-images")
        assert r.status_code == 200
        data = r.json()
        assert data["why"] is not None, "Expected 'why' object in site-images response"
        why = data["why"]
        assert why["section"] == "why"
        assert why["label"] == "Why Tidyups"
        assert isinstance(why["url"], str) and len(why["url"]) > 0
        # Default should point to the customer-assets Weekend Plans URL when unmodified
        assert "Weekend%20Plans" in why["url"] or "Weekend Plans" in why["url"] or why["url"].startswith("/api/site-images/file/"), \
            f"Unexpected why url: {why['url']}"


class TestUploadAuth:
    def test_upload_requires_admin_header(self):
        files = {"file": ("t.png", PNG_BYTES, "image/png")}
        r = requests.post(f"{BASE_URL}/api/site-images/upload", files=files, data={"section": "gallery"})
        assert r.status_code == 401

    def test_upload_wrong_password(self):
        files = {"file": ("t.png", PNG_BYTES, "image/png")}
        r = requests.post(
            f"{BASE_URL}/api/site-images/upload",
            files=files, data={"section": "gallery"},
            headers={"X-Admin-Password": "nope"},
        )
        assert r.status_code == 401

    def test_upload_rejects_non_image(self):
        files = {"file": ("t.txt", b"hello world", "text/plain")}
        r = requests.post(
            f"{BASE_URL}/api/site-images/upload",
            files=files, data={"section": "gallery"},
            headers={"X-Admin-Password": ADMIN_PASSWORD},
        )
        assert r.status_code == 400
        assert "image" in r.text.lower()

    def test_upload_rejects_bad_section(self):
        files = {"file": ("t.png", PNG_BYTES, "image/png")}
        r = requests.post(
            f"{BASE_URL}/api/site-images/upload",
            files=files, data={"section": "footer"},
            headers={"X-Admin-Password": ADMIN_PASSWORD},
        )
        assert r.status_code == 400


class TestGalleryUploadAndDelete:
    def test_upload_then_get_then_delete(self):
        # Baseline count
        before = requests.get(f"{BASE_URL}/api/site-images").json()["gallery"]
        before_count = len(before)

        files = {"file": ("TEST_pic.png", PNG_BYTES, "image/png")}
        r = requests.post(
            f"{BASE_URL}/api/site-images/upload",
            files=files, data={"section": "gallery", "label": "TEST_upload"},
            headers={"X-Admin-Password": ADMIN_PASSWORD},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["section"] == "gallery"
        assert body["label"] == "TEST_upload"
        assert body["url"].startswith("/api/site-images/file/")
        assert "id" in body
        new_id = body["id"]
        _created_ids.append(new_id)

        # Verify GET returns the new item
        got = requests.get(f"{BASE_URL}/api/site-images").json()["gallery"]
        assert len(got) == before_count + 1
        assert any(g["id"] == new_id for g in got)

        # Serve the file — must return image bytes with image/ content-type
        file_url = f"{BASE_URL}{body['url']}"
        rf = requests.get(file_url)
        assert rf.status_code == 200
        assert rf.headers.get("Content-Type", "").startswith("image/")
        assert len(rf.content) > 0

        # Delete requires admin
        r_noauth = requests.delete(f"{BASE_URL}/api/site-images/{new_id}")
        assert r_noauth.status_code == 401

        # Delete with admin
        rd = requests.delete(
            f"{BASE_URL}/api/site-images/{new_id}",
            headers={"X-Admin-Password": ADMIN_PASSWORD},
        )
        assert rd.status_code == 200
        assert rd.json().get("ok")
        _created_ids.remove(new_id)

        # Verify soft-deleted (gone from GET)
        after = requests.get(f"{BASE_URL}/api/site-images").json()["gallery"]
        assert not any(g["id"] == new_id for g in after)
        assert len(after) == before_count

    def test_delete_unknown_id_returns_404(self):
        r = requests.delete(
            f"{BASE_URL}/api/site-images/does-not-exist-abc",
            headers={"X-Admin-Password": ADMIN_PASSWORD},
        )
        assert r.status_code == 404


class TestHeroReplace:
    def test_hero_upload_replaces_previous(self):
        # Use pymongo to restore original hero after test since API can't un-soft-delete.
        from pymongo import MongoClient
        mongo = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        db = mongo[os.environ.get("DB_NAME", "test_database")]

        original = requests.get(f"{BASE_URL}/api/site-images").json()["hero"]
        assert original is not None
        original_id = original["id"]

        files = {"file": ("TEST_hero.png", PNG_BYTES, "image/png")}
        r = requests.post(
            f"{BASE_URL}/api/site-images/upload",
            files=files, data={"section": "hero", "label": "TEST_hero"},
            headers={"X-Admin-Password": ADMIN_PASSWORD},
        )
        assert r.status_code == 200, r.text
        new_hero = r.json()
        assert new_hero["section"] == "hero"
        assert new_hero["url"].startswith("/api/site-images/file/")
        new_id = new_hero["id"]
        _created_ids.append(new_id)

        current = requests.get(f"{BASE_URL}/api/site-images").json()["hero"]
        assert current["id"] == new_id
        assert current["id"] != original_id

        # Delete the test hero via API
        rd = requests.delete(
            f"{BASE_URL}/api/site-images/{new_id}",
            headers={"X-Admin-Password": ADMIN_PASSWORD},
        )
        assert rd.status_code == 200
        _created_ids.remove(new_id)

        # Restore original hero via direct DB update (un-soft-delete)
        db.site_images.update_one({"id": original_id}, {"$set": {"is_deleted": False}})
        restored = requests.get(f"{BASE_URL}/api/site-images").json()["hero"]
        assert restored is not None
        assert restored["id"] == original_id
        assert restored["label"] == "Our Fleet"
        mongo.close()


class TestWhyReplace:
    """NEW: verify 'why' section replace behaves like hero (soft-delete previous)."""
    def test_why_upload_replaces_previous_and_restore(self):
        from pymongo import MongoClient
        mongo = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        db = mongo[os.environ.get("DB_NAME", "test_database")]

        original = requests.get(f"{BASE_URL}/api/site-images").json()["why"]
        assert original is not None, "Baseline 'why' image missing"
        original_id = original["id"]

        files = {"file": ("TEST_why.png", PNG_BYTES, "image/png")}
        r = requests.post(
            f"{BASE_URL}/api/site-images/upload",
            files=files, data={"section": "why", "label": "TEST_why"},
            headers={"X-Admin-Password": ADMIN_PASSWORD},
        )
        assert r.status_code == 200, r.text
        new_why = r.json()
        assert new_why["section"] == "why"
        assert new_why["url"].startswith("/api/site-images/file/")
        new_id = new_why["id"]
        _created_ids.append(new_id)

        # GET returns the new one
        current = requests.get(f"{BASE_URL}/api/site-images").json()["why"]
        assert current is not None
        assert current["id"] == new_id
        assert current["id"] != original_id

        # File is served
        rf = requests.get(f"{BASE_URL}{new_why['url']}")
        assert rf.status_code == 200
        assert rf.headers.get("Content-Type", "").startswith("image/")

        # Only one active 'why' doc
        active_count = db.site_images.count_documents({"section": "why", "is_deleted": False})
        assert active_count == 1, f"expected 1 active why, got {active_count}"

        # Cleanup: delete uploaded why + restore original
        rd = requests.delete(
            f"{BASE_URL}/api/site-images/{new_id}",
            headers={"X-Admin-Password": ADMIN_PASSWORD},
        )
        assert rd.status_code == 200
        _created_ids.remove(new_id)

        db.site_images.update_one({"id": original_id}, {"$set": {"is_deleted": False}})
        restored = requests.get(f"{BASE_URL}/api/site-images").json()["why"]
        assert restored is not None
        assert restored["id"] == original_id
        assert restored["label"] == "Why Tidyups"
        mongo.close()


class TestReorder:
    ORIGINAL_ORDER = ["Serving Edmonton", "Home & Office Service", "Our Team", "On The Road"]

    def _get_gallery(self):
        return requests.get(f"{BASE_URL}/api/site-images").json()["gallery"]

    def test_reorder_requires_admin(self):
        r = requests.post(f"{BASE_URL}/api/site-images/reorder", json={"order": []})
        assert r.status_code == 401

    def test_reorder_wrong_password(self):
        r = requests.post(
            f"{BASE_URL}/api/site-images/reorder",
            json={"order": []},
            headers={"X-Admin-Password": "nope"},
        )
        assert r.status_code == 401

    def test_reorder_reverses_and_restores(self):
        gallery = self._get_gallery()
        assert len(gallery) >= 4
        original_ids = [g["id"] for g in gallery]
        original_labels = [g["label"] for g in gallery]
        assert original_labels[:4] == self.ORIGINAL_ORDER, f"Baseline mismatch: {original_labels}"

        # Reverse order
        reversed_ids = list(reversed(original_ids))
        r = requests.post(
            f"{BASE_URL}/api/site-images/reorder",
            json={"order": reversed_ids},
            headers={"X-Admin-Password": ADMIN_PASSWORD},
        )
        assert r.status_code == 200, r.text
        assert r.json().get("ok")

        # Verify GET returns reversed ordering with sequential 'order' fields
        after = self._get_gallery()
        assert [g["id"] for g in after] == reversed_ids
        for idx, g in enumerate(after):
            assert g["order"] == idx, f"expected order={idx} got {g['order']} for {g['label']}"

        # Restore original order (per iteration note: leave DB unchanged)
        r2 = requests.post(
            f"{BASE_URL}/api/site-images/reorder",
            json={"order": original_ids},
            headers={"X-Admin-Password": ADMIN_PASSWORD},
        )
        assert r2.status_code == 200
        restored = self._get_gallery()
        assert [g["label"] for g in restored[:4]] == self.ORIGINAL_ORDER
        for idx, g in enumerate(restored):
            assert g["order"] == idx

    def test_reorder_ignores_hero_or_bogus_ids(self):
        """Reorder should silently skip non-gallery/nonexistent IDs and still return 200."""
        gallery_before = self._get_gallery()
        original_ids = [g["id"] for g in gallery_before]
        # Include a bogus id — endpoint should not error
        r = requests.post(
            f"{BASE_URL}/api/site-images/reorder",
            json={"order": original_ids + ["nonexistent-id-xyz"]},
            headers={"X-Admin-Password": ADMIN_PASSWORD},
        )
        assert r.status_code == 200
        # Order preserved
        after = self._get_gallery()
        assert [g["id"] for g in after[:len(original_ids)]] == original_ids


class TestQuoteRegression:
    def test_create_quote_still_works(self):
        payload = {
            "name": "TEST_ImgIter Regression",
            "phone": "(780) 555-0133",
            "service_type": "Home Cleaning",
        }
        r = requests.post(f"{BASE_URL}/api/quotes", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == payload["name"]

    def test_wrong_admin_password_still_401(self):
        r = requests.get(f"{BASE_URL}/api/quotes", headers={"X-Admin-Password": "wrong"})
        assert r.status_code == 401


def test_zz_cleanup():
    """Best-effort: delete any test-created ids left dangling."""
    for iid in list(_created_ids):
        try:
            requests.delete(
                f"{BASE_URL}/api/site-images/{iid}",
                headers={"X-Admin-Password": ADMIN_PASSWORD},
                timeout=10,
            )
        except Exception:
            pass
