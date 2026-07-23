import json, os, requests, sys
BASE = os.environ.get('TEST_BASE_URL', 'https://expo-book-cleaning.preview.emergentagent.com').rstrip('/')
ADMIN = os.environ.get('ADMIN_PASSWORD', 'tidyups2026')
PIN = os.environ.get('CLEANER_PIN', '1234')
H = {'X-Admin-Password': ADMIN, 'Content-Type': 'application/json'}
results = {'checks': []}
def record(name, ok, status=None, detail=None):
    row={'name':name,'ok':bool(ok)}
    if status is not None: row['status']=status
    if detail is not None: row['detail']=detail
    results['checks'].append(row)
    print(f"{name}: {'OK' if ok else 'FAIL'}" + (f" status={status}" if status is not None else '') + (f" detail={detail}" if detail else ''))
    if not ok: results['failed']=True
try:
    seed=json.load(open('/app/test_reports/iteration_16_api_setup_smoke_results.json')).get('seed', {})
except Exception as e:
    print(f'Could not read seed file: {e}')
    seed={}
# Verify post-UI review URL and restore original.
r=requests.get(f'{BASE}/api/app-settings', timeout=20)
review = r.json().get('review_url') if r.ok else None
record('post_ui_app_settings_get', r.status_code==200 and 'review_url' in r.json(), r.status_code, f'review_url={review}')
original = seed.get('original_review_url','')
r=requests.put(f'{BASE}/api/app-settings', headers=H, json={'review_url': original}, timeout=20)
record('restore_original_review_url', r.status_code==200 and r.json().get('review_url')==original, r.status_code, f'restored={r.json().get("review_url") if r.ok else None}')
# Confirm history smoke still authorized/unauthorized.
r=requests.get(f'{BASE}/api/assignments/history', timeout=20)
record('cleanup_history_without_admin_401', r.status_code==401, r.status_code, r.text[:160])
r=requests.get(f'{BASE}/api/assignments/history', headers={'X-Admin-Password': ADMIN}, timeout=20)
record('cleanup_history_with_admin_200', r.status_code==200 and isinstance(r.json(), list), r.status_code, f'count={len(r.json()) if r.ok else "n/a"}')
# Delete seeded cleaner cascades seeded active/done assignments.
cid=seed.get('cleaner_id')
if cid:
    r=requests.delete(f'{BASE}/api/cleaners/{cid}', headers={'X-Admin-Password': ADMIN}, timeout=20)
    record('cleanup_seed_cleaner_delete', r.status_code in (200,404), r.status_code, r.text[:160])
else:
    record('cleanup_seed_cleaner_delete', False, detail='missing cleaner_id')
# Ensure PIN/admin remain baseline.
r=requests.put(f'{BASE}/api/staff/pin', headers=H, json={'pin': PIN}, timeout=20)
record('restore_staff_pin_1234', r.status_code==200 and r.json().get('pin')==PIN, r.status_code, r.text[:160])
r=requests.post(f'{BASE}/api/admin/login', headers={'X-Admin-Password': ADMIN}, timeout=20)
record('final_admin_login_baseline', r.status_code==200, r.status_code, r.text[:160])
with open('/app/test_reports/iteration_16_api_cleanup_results.json','w') as f: json.dump(results,f,indent=2)
sys.exit(1 if results.get('failed') else 0)
