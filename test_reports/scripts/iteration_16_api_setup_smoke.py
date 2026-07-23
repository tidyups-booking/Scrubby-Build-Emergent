import json, os, sys, uuid, time
import requests

BASE = os.environ.get('TEST_BASE_URL', 'https://expo-book-cleaning.preview.emergentagent.com').rstrip('/')
ADMIN = os.environ.get('ADMIN_PASSWORD', 'tidyups2026')
PIN = os.environ.get('CLEANER_PIN', '1234')
H = {'X-Admin-Password': ADMIN, 'Content-Type': 'application/json'}
results = {'base': BASE, 'checks': [], 'seed': {}}

def record(name, ok, status=None, detail=None):
    row = {'name': name, 'ok': bool(ok)}
    if status is not None: row['status'] = status
    if detail is not None: row['detail'] = detail
    results['checks'].append(row)
    print(f"{name}: {'OK' if ok else 'FAIL'}" + (f" status={status}" if status is not None else '') + (f" detail={detail}" if detail else ''))
    if not ok:
        results['failed'] = True

# Required smoke checks
r = requests.post(f'{BASE}/api/admin/login', headers={'X-Admin-Password': ADMIN}, timeout=20)
record('admin_login_correct_password', r.status_code == 200, r.status_code, r.text[:200])
r = requests.post(f'{BASE}/api/admin/login', headers={'X-Admin-Password': 'wrong-password'}, timeout=20)
record('admin_login_wrong_password_401', r.status_code == 401, r.status_code, r.text[:200])
r = requests.get(f'{BASE}/api/app-settings', timeout=20)
body = r.json() if r.ok else {}
record('app_settings_has_review_url', r.status_code == 200 and 'review_url' in body, r.status_code, json.dumps({'review_url': body.get('review_url')})[:200])
original_review_url = body.get('review_url', '')
r = requests.get(f'{BASE}/api/assignments/history', timeout=20)
record('history_without_admin_401', r.status_code == 401, r.status_code, r.text[:200])
r = requests.get(f'{BASE}/api/assignments/history', headers={'X-Admin-Password': ADMIN}, timeout=20)
record('history_with_admin_200', r.status_code == 200 and isinstance(r.json(), list), r.status_code, f'count={len(r.json()) if r.ok else "n/a"}')

# Ensure cleaner PIN is the requested 1234.
r = requests.put(f'{BASE}/api/staff/pin', headers=H, json={'pin': PIN}, timeout=20)
record('staff_pin_set_1234', r.status_code == 200 and r.json().get('pin') == PIN, r.status_code, r.text[:200])

# Seed a UI cleaner and an active assignment for cleaner flow.
cleaner_name = f'TEST_UI_Cleaner_{uuid.uuid4().hex[:6]}'
r = requests.post(f'{BASE}/api/cleaners/checkin', json={'name': cleaner_name, 'pin': PIN}, timeout=20)
record('seed_cleaner_checkin', r.status_code == 200, r.status_code, r.text[:200])
if r.status_code != 200:
    print(json.dumps(results, indent=2)); sys.exit(1)
cleaner = r.json(); cid = cleaner['cleaner_id']
results['seed']['cleaner_id'] = cid
results['seed']['cleaner_name'] = cleaner['name']

payload = {
    'quote_id': f'TEST_UI_active_{uuid.uuid4().hex[:8]}',
    'cleaner_id': cid,
    'customer_name': 'TEST_UI Active Customer',
    'service_type': 'Deep Clean',
    'address': '123 TEST UI Street, Edmonton',
    'phone': '780-555-0101',
    'preferred_date': '2026-07-30',
    'message': 'TEST active assignment for iteration 16 UI verification',
}
r = requests.post(f'{BASE}/api/assignments', headers=H, json=payload, timeout=20)
record('seed_active_assignment', r.status_code == 200 and r.json().get('status') == 'assigned', r.status_code, r.text[:200])
if r.status_code == 200:
    results['seed']['active_assignment_id'] = r.json()['id']

# Seed a done history assignment for send-review UI check.
hist_payload = dict(payload)
hist_payload.update({
    'quote_id': f'TEST_UI_history_{uuid.uuid4().hex[:8]}',
    'customer_name': 'TEST_UI History Customer',
    'phone': '780-555-0202',
    'message': 'TEST history assignment for iteration 16 UI verification',
})
r = requests.post(f'{BASE}/api/assignments', headers=H, json=hist_payload, timeout=20)
record('seed_history_assignment_create', r.status_code == 200, r.status_code, r.text[:200])
if r.status_code == 200:
    hist_id = r.json()['id']
    results['seed']['history_assignment_id'] = hist_id
    r2 = requests.post(f'{BASE}/api/assignments/{hist_id}/status', json={'cleaner_id': cid, 'pin': PIN, 'status': 'done'}, timeout=20)
    record('seed_history_assignment_done', r2.status_code == 200 and r2.json().get('status') == 'done', r2.status_code, r2.text[:200])

# Configure review URL for send-review manual UI action.
test_review_url = f'https://g.page/r/iteration-16-{uuid.uuid4().hex[:6]}'
r = requests.put(f'{BASE}/api/app-settings', headers=H, json={'review_url': test_review_url}, timeout=20)
record('set_review_url_for_ui', r.status_code == 200 and r.json().get('review_url') == test_review_url, r.status_code, r.text[:200])
results['seed']['original_review_url'] = original_review_url
results['seed']['test_review_url'] = test_review_url

# Verify cleaner jobs endpoint sees active assignment.
r = requests.get(f'{BASE}/api/cleaners/{cid}/jobs', headers={'X-Cleaner-Pin': PIN}, timeout=20)
record('cleaner_jobs_has_active_assignment', r.status_code == 200 and any(j.get('id') == results['seed'].get('active_assignment_id') for j in r.json()), r.status_code, f'count={len(r.json()) if r.ok else "n/a"}')

with open('/app/test_reports/iteration_16_api_setup_smoke_results.json', 'w') as f:
    json.dump(results, f, indent=2)

sys.exit(1 if results.get('failed') else 0)
