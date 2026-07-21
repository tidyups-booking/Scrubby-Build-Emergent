#!/usr/bin/env python3
"""
Backend API Test Suite for Tidyups App Images API
Tests all endpoints against the preview URL backend
"""

import requests
import io
from PIL import Image
import json
import sys

# Configuration
BASE_URL = "https://expo-book-cleaning.preview.emergentagent.com/api"
ADMIN_PASSWORD = "tidyups2026"
ADMIN_HEADERS = {"X-Admin-Password": ADMIN_PASSWORD}
WRONG_PASSWORD_HEADERS = {"X-Admin-Password": "wrongpassword"}

# Expected seeded image labels in order
EXPECTED_LABELS = [
    "Move In / Move Out Cleaning",
    "Deep Cleaning Specialists",
    "We've Got You Covered!",
    "Our Fleet",
    "Tidyups Magic"
]

# Test results tracking
test_results = []
uploaded_test_image_id = None
original_image_order = []


def log_test(test_name, passed, message=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = f"{status}: {test_name}"
    if message:
        result += f" - {message}"
    print(result)
    test_results.append({"test": test_name, "passed": passed, "message": message})
    return passed


def create_test_image():
    """Create a small test PNG image"""
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes


def create_test_text_file():
    """Create a test text file"""
    return io.BytesIO(b"This is a text file, not an image")


print("=" * 80)
print("TIDYUPS APP-IMAGES API TEST SUITE")
print("=" * 80)
print(f"Base URL: {BASE_URL}")
print(f"Admin Password: {ADMIN_PASSWORD}")
print("=" * 80)
print()

# Test 1: GET /api/app-images (public) - should return 5 seeded images
print("Test 1: GET /api/app-images (public endpoint)")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/app-images", timeout=10)
    if response.status_code == 200:
        images = response.json()
        if isinstance(images, list):
            if len(images) == 5:
                # Check if all expected labels are present in order
                actual_labels = [img.get("label", "") for img in images]
                if actual_labels == EXPECTED_LABELS:
                    # Verify structure
                    all_valid = all(
                        "id" in img and "label" in img and "order" in img and "url" in img
                        for img in images
                    )
                    if all_valid:
                        # Store original order for later restoration
                        original_image_order = [img["id"] for img in images]
                        log_test("GET /api/app-images", True, 
                                f"Returned 5 images with correct labels in order")
                        print(f"  Images: {actual_labels}")
                    else:
                        log_test("GET /api/app-images", False, 
                                "Images missing required fields (id, label, order, url)")
                else:
                    log_test("GET /api/app-images", False, 
                            f"Labels mismatch. Expected: {EXPECTED_LABELS}, Got: {actual_labels}")
            else:
                log_test("GET /api/app-images", False, 
                        f"Expected 5 images, got {len(images)}")
        else:
            log_test("GET /api/app-images", False, 
                    f"Expected JSON array, got {type(images)}")
    else:
        log_test("GET /api/app-images", False, 
                f"Expected 200, got {response.status_code}: {response.text}")
except Exception as e:
    log_test("GET /api/app-images", False, f"Exception: {str(e)}")

print()

# Test 2: GET /api/app-images/file/{path} - fetch an image file
print("Test 2: GET /api/app-images/file/{path} (serve image file)")
print("-" * 80)
try:
    # Get images first to find a file URL
    response = requests.get(f"{BASE_URL}/app-images", timeout=10)
    if response.status_code == 200:
        images = response.json()
        # Find an image with /api/app-images/file/ URL
        file_url = None
        for img in images:
            if img["url"].startswith("/api/app-images/file/"):
                file_url = img["url"]
                break
        
        if file_url:
            # Construct full URL
            full_url = f"{BASE_URL.replace('/api', '')}{file_url}"
            file_response = requests.get(full_url, timeout=10)
            if file_response.status_code == 200:
                content_type = file_response.headers.get("Content-Type", "")
                if content_type.startswith("image/"):
                    log_test("GET /api/app-images/file/{path}", True, 
                            f"Image served successfully, Content-Type: {content_type}")
                else:
                    log_test("GET /api/app-images/file/{path}", False, 
                            f"Expected image content-type, got {content_type}")
            else:
                log_test("GET /api/app-images/file/{path}", False, 
                        f"Expected 200, got {file_response.status_code}")
        else:
            log_test("GET /api/app-images/file/{path}", False, 
                    "No image with /api/app-images/file/ URL found in seeded data")
    else:
        log_test("GET /api/app-images/file/{path}", False, 
                "Could not fetch images list to get file URL")
except Exception as e:
    log_test("GET /api/app-images/file/{path}", False, f"Exception: {str(e)}")

print()

# Test 3: POST /api/app-images/upload with valid admin header
print("Test 3: POST /api/app-images/upload (with valid admin header)")
print("-" * 80)
try:
    test_image = create_test_image()
    files = {"file": ("test_image.png", test_image, "image/png")}
    data = {"label": "TEST IMAGE"}
    
    response = requests.post(
        f"{BASE_URL}/app-images/upload",
        files=files,
        data=data,
        headers=ADMIN_HEADERS,
        timeout=30
    )
    
    if response.status_code == 200:
        uploaded_image = response.json()
        if "id" in uploaded_image and "label" in uploaded_image and "url" in uploaded_image:
            uploaded_test_image_id = uploaded_image["id"]
            if uploaded_image["label"] == "TEST IMAGE":
                # Verify it appears in GET /api/app-images
                get_response = requests.get(f"{BASE_URL}/app-images", timeout=10)
                if get_response.status_code == 200:
                    images = get_response.json()
                    found = any(img["id"] == uploaded_test_image_id for img in images)
                    if found:
                        # Verify file URL serves 200
                        file_url = uploaded_image["url"]
                        if file_url.startswith("/api/app-images/file/"):
                            full_url = f"{BASE_URL.replace('/api', '')}{file_url}"
                            file_response = requests.get(full_url, timeout=10)
                            if file_response.status_code == 200:
                                log_test("POST /api/app-images/upload", True, 
                                        f"Image uploaded, appears in list, file serves 200")
                            else:
                                log_test("POST /api/app-images/upload", False, 
                                        f"Image uploaded but file URL returns {file_response.status_code}")
                        else:
                            log_test("POST /api/app-images/upload", False, 
                                    f"Unexpected URL format: {file_url}")
                    else:
                        log_test("POST /api/app-images/upload", False, 
                                "Image uploaded but not found in GET /api/app-images")
                else:
                    log_test("POST /api/app-images/upload", False, 
                            "Image uploaded but could not verify in list")
            else:
                log_test("POST /api/app-images/upload", False, 
                        f"Label mismatch: expected 'TEST IMAGE', got '{uploaded_image['label']}'")
        else:
            log_test("POST /api/app-images/upload", False, 
                    "Response missing required fields")
    else:
        log_test("POST /api/app-images/upload", False, 
                f"Expected 200, got {response.status_code}: {response.text}")
except Exception as e:
    log_test("POST /api/app-images/upload", False, f"Exception: {str(e)}")

print()

# Test 4: POST /api/app-images/upload WITHOUT admin header or with wrong password
print("Test 4: POST /api/app-images/upload (auth validation)")
print("-" * 80)

# Test 4a: No admin header
try:
    test_image = create_test_image()
    files = {"file": ("test_image.png", test_image, "image/png")}
    data = {"label": "UNAUTHORIZED TEST"}
    
    response = requests.post(
        f"{BASE_URL}/app-images/upload",
        files=files,
        data=data,
        timeout=30
    )
    
    if response.status_code == 401:
        log_test("POST /api/app-images/upload (no auth)", True, 
                "Correctly returned 401")
    else:
        log_test("POST /api/app-images/upload (no auth)", False, 
                f"Expected 401, got {response.status_code}")
except Exception as e:
    log_test("POST /api/app-images/upload (no auth)", False, f"Exception: {str(e)}")

# Test 4b: Wrong password
try:
    test_image = create_test_image()
    files = {"file": ("test_image.png", test_image, "image/png")}
    data = {"label": "UNAUTHORIZED TEST"}
    
    response = requests.post(
        f"{BASE_URL}/app-images/upload",
        files=files,
        data=data,
        headers=WRONG_PASSWORD_HEADERS,
        timeout=30
    )
    
    if response.status_code == 401:
        log_test("POST /api/app-images/upload (wrong password)", True, 
                "Correctly returned 401")
    else:
        log_test("POST /api/app-images/upload (wrong password)", False, 
                f"Expected 401, got {response.status_code}")
except Exception as e:
    log_test("POST /api/app-images/upload (wrong password)", False, f"Exception: {str(e)}")

print()

# Test 5: POST /api/app-images/upload with non-image file
print("Test 5: POST /api/app-images/upload (non-image file)")
print("-" * 80)
try:
    text_file = create_test_text_file()
    files = {"file": ("test.txt", text_file, "text/plain")}
    data = {"label": "TEXT FILE TEST"}
    
    response = requests.post(
        f"{BASE_URL}/app-images/upload",
        files=files,
        data=data,
        headers=ADMIN_HEADERS,
        timeout=30
    )
    
    if response.status_code == 400:
        log_test("POST /api/app-images/upload (non-image)", True, 
                "Correctly returned 400 for non-image file")
    else:
        log_test("POST /api/app-images/upload (non-image)", False, 
                f"Expected 400, got {response.status_code}: {response.text}")
except Exception as e:
    log_test("POST /api/app-images/upload (non-image)", False, f"Exception: {str(e)}")

print()

# Test 6: POST /api/app-images/reorder
print("Test 6: POST /api/app-images/reorder")
print("-" * 80)
try:
    # Get current images
    response = requests.get(f"{BASE_URL}/app-images", timeout=10)
    if response.status_code == 200:
        images = response.json()
        current_order = [img["id"] for img in images]
        original_image_order = current_order.copy()  # Save for restoration
        
        # Reverse the order
        reversed_order = list(reversed(current_order))
        
        # Send reorder request
        reorder_response = requests.post(
            f"{BASE_URL}/app-images/reorder",
            json={"order": reversed_order},
            headers=ADMIN_HEADERS,
            timeout=10
        )
        
        if reorder_response.status_code == 200:
            result = reorder_response.json()
            if result.get("ok") == True:
                # Verify new order
                verify_response = requests.get(f"{BASE_URL}/app-images", timeout=10)
                if verify_response.status_code == 200:
                    new_images = verify_response.json()
                    new_order = [img["id"] for img in new_images]
                    if new_order == reversed_order:
                        # Restore original order
                        restore_response = requests.post(
                            f"{BASE_URL}/app-images/reorder",
                            json={"order": original_image_order},
                            headers=ADMIN_HEADERS,
                            timeout=10
                        )
                        if restore_response.status_code == 200:
                            # Verify restoration
                            final_response = requests.get(f"{BASE_URL}/app-images", timeout=10)
                            if final_response.status_code == 200:
                                final_images = final_response.json()
                                final_order = [img["id"] for img in final_images]
                                if final_order == original_image_order:
                                    log_test("POST /api/app-images/reorder", True, 
                                            "Reorder and restore both successful")
                                else:
                                    log_test("POST /api/app-images/reorder", False, 
                                            "Restore order failed")
                            else:
                                log_test("POST /api/app-images/reorder", False, 
                                        "Could not verify restored order")
                        else:
                            log_test("POST /api/app-images/reorder", False, 
                                    f"Restore request failed: {restore_response.status_code}")
                    else:
                        log_test("POST /api/app-images/reorder", False, 
                                f"Order not updated correctly. Expected {reversed_order}, got {new_order}")
                else:
                    log_test("POST /api/app-images/reorder", False, 
                            "Could not verify new order")
            else:
                log_test("POST /api/app-images/reorder", False, 
                        f"Expected {{ok: true}}, got {result}")
        else:
            log_test("POST /api/app-images/reorder", False, 
                    f"Expected 200, got {reorder_response.status_code}: {reorder_response.text}")
    else:
        log_test("POST /api/app-images/reorder", False, 
                "Could not fetch images to test reorder")
except Exception as e:
    log_test("POST /api/app-images/reorder", False, f"Exception: {str(e)}")

print()

# Test 7: DELETE /api/app-images/{id}
print("Test 7: DELETE /api/app-images/{id}")
print("-" * 80)

# Test 7a: Delete the TEST IMAGE uploaded in test 3
if uploaded_test_image_id:
    try:
        response = requests.delete(
            f"{BASE_URL}/app-images/{uploaded_test_image_id}",
            headers=ADMIN_HEADERS,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("ok") == True:
                # Verify it no longer appears in GET
                verify_response = requests.get(f"{BASE_URL}/app-images", timeout=10)
                if verify_response.status_code == 200:
                    images = verify_response.json()
                    found = any(img["id"] == uploaded_test_image_id for img in images)
                    if not found:
                        log_test("DELETE /api/app-images/{id}", True, 
                                "TEST IMAGE deleted and no longer in list")
                    else:
                        log_test("DELETE /api/app-images/{id}", False, 
                                "Image still appears in list after delete")
                else:
                    log_test("DELETE /api/app-images/{id}", False, 
                            "Could not verify deletion")
            else:
                log_test("DELETE /api/app-images/{id}", False, 
                        f"Expected {{ok: true}}, got {result}")
        else:
            log_test("DELETE /api/app-images/{id}", False, 
                    f"Expected 200, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("DELETE /api/app-images/{id}", False, f"Exception: {str(e)}")
else:
    log_test("DELETE /api/app-images/{id}", False, 
            "No TEST IMAGE to delete (upload test failed)")

# Test 7b: DELETE with wrong password
try:
    # Try to delete a non-existent ID with wrong password
    response = requests.delete(
        f"{BASE_URL}/app-images/fake-id-12345",
        headers=WRONG_PASSWORD_HEADERS,
        timeout=10
    )
    
    if response.status_code == 401:
        log_test("DELETE /api/app-images/{id} (wrong password)", True, 
                "Correctly returned 401")
    else:
        log_test("DELETE /api/app-images/{id} (wrong password)", False, 
                f"Expected 401, got {response.status_code}")
except Exception as e:
    log_test("DELETE /api/app-images/{id} (wrong password)", False, f"Exception: {str(e)}")

# Test 7c: DELETE non-existent ID
try:
    response = requests.delete(
        f"{BASE_URL}/app-images/nonexistent-id-99999",
        headers=ADMIN_HEADERS,
        timeout=10
    )
    
    if response.status_code == 404:
        log_test("DELETE /api/app-images/{id} (nonexistent)", True, 
                "Correctly returned 404")
    else:
        log_test("DELETE /api/app-images/{id} (nonexistent)", False, 
                f"Expected 404, got {response.status_code}")
except Exception as e:
    log_test("DELETE /api/app-images/{id} (nonexistent)", False, f"Exception: {str(e)}")

print()

# Test 8: Sanity check - POST /api/quotes on LOCAL backend
print("Test 8: POST /api/quotes (sanity check on LOCAL backend)")
print("-" * 80)
try:
    quote_data = {
        "name": "Backend Test",
        "phone": "5875550000",
        "service_type": "Home Cleaning"
    }
    
    response = requests.post(
        f"{BASE_URL}/quotes",
        json=quote_data,
        timeout=10
    )
    
    if response.status_code == 200:
        quote = response.json()
        if "id" in quote and "status" in quote and "created_at" in quote:
            if quote["name"] == "Backend Test" and quote["phone"] == "5875550000":
                log_test("POST /api/quotes", True, 
                        f"Quote created successfully (id: {quote['id']}, status: {quote['status']})")
            else:
                log_test("POST /api/quotes", False, 
                        "Quote data mismatch")
        else:
            log_test("POST /api/quotes", False, 
                    "Response missing required fields (id, status, created_at)")
    else:
        log_test("POST /api/quotes", False, 
                f"Expected 200, got {response.status_code}: {response.text}")
except Exception as e:
    log_test("POST /api/quotes", False, f"Exception: {str(e)}")

print()

# Final verification: Ensure we have exactly 5 original images
print("Final Verification: Checking image list integrity")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/app-images", timeout=10)
    if response.status_code == 200:
        images = response.json()
        if len(images) == 5:
            actual_labels = [img.get("label", "") for img in images]
            if actual_labels == EXPECTED_LABELS:
                log_test("Final verification", True, 
                        "Image list restored to original 5 images in correct order")
            else:
                log_test("Final verification", False, 
                        f"Labels don't match original. Got: {actual_labels}")
        else:
            log_test("Final verification", False, 
                    f"Expected 5 images, got {len(images)}")
    else:
        log_test("Final verification", False, 
                f"Could not fetch final image list: {response.status_code}")
except Exception as e:
    log_test("Final verification", False, f"Exception: {str(e)}")

print()
print("=" * 80)
print("TEST SUMMARY")
print("=" * 80)

passed_count = sum(1 for r in test_results if r["passed"])
failed_count = len(test_results) - passed_count

print(f"Total Tests: {len(test_results)}")
print(f"Passed: {passed_count}")
print(f"Failed: {failed_count}")
print()

if failed_count > 0:
    print("FAILED TESTS:")
    for r in test_results:
        if not r["passed"]:
            print(f"  ❌ {r['test']}: {r['message']}")
    print()

# Exit with appropriate code
sys.exit(0 if failed_count == 0 else 1)
