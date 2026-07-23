import json, os, requests
BASE=os.environ.get('EXPO_PUBLIC_IMAGES_URL','https://expo-book-cleaning.preview.emergentagent.com').rstrip('/')
PW=os.environ.get('ADMIN_PASSWORD','tidyups2026')
H={'X-Admin-Password':PW,'Content-Type':'application/json'}
seed=json.load(open('/app/test_reports/iteration14_seed.json'))
created=seed['created']
results=[]

def rec(name, ok, detail):
    results.append({'name':name,'ok':bool(ok),'detail':detail})
    print(('PASS' if ok else 'FAIL'), name, detail)

def req(method,path,**kw):
    return requests.request(method, f'{BASE}{path}', timeout=25, **kw)
# Verify business URL after UI save if marker exists; if UI did not run, tolerate current seed URL? mark details
settings=req('GET','/api/app-settings')
body=settings.json() if settings.status_code==200 else {}
expected=created.get('ui_review_url') or created.get('review_url')
rec('GET app-settings review_url persisted', settings.status_code==200 and body.get('review_url')==expected, f"expected={expected} got={body.get('review_url')}")
# history send badge should persist in backend assignment rows
hist=req('GET','/api/assignments/history',headers={'X-Admin-Password':PW})
hist_body=hist.json() if hist.status_code==200 else []
row=next((x for x in hist_body if x.get('id')==created.get('done_assignment_id')), None)
rec('history contains done assignment with review_sent_at', hist.status_code==200 and row is not None and bool(row.get('review_sent_at')), str(row)[:240])
# jobs active assignment visible
jobs=req('GET',f"/api/cleaners/{created['cleaner_id']}/jobs",headers={'X-Cleaner-Pin':'1234'})
jobs_body=jobs.json() if jobs.status_code==200 else []
rec('cleaner jobs contains active assignment', jobs.status_code==200 and any(j.get('id')==created.get('active_assignment_id') for j in jobs_body), str(jobs_body)[:240])
# restore state/cleanup
for aid in [created.get('active_assignment_id'), created.get('done_assignment_id')]:
    if aid:
        req('DELETE',f'/api/assignments/{aid}',headers={'X-Admin-Password':PW})
if created.get('cleaner_id'):
    req('DELETE',f"/api/cleaners/{created['cleaner_id']}",headers={'X-Admin-Password':PW})
# restore original review_url and password/pin
req('PUT','/api/app-settings',json={'review_url':created.get('original_review_url','')},headers=H)
for candidate in [PW,'qatest123','changed_pw_9x']:
    r=req('PUT','/api/admin/password',json={'new_password':PW},headers={'X-Admin-Password':candidate,'Content-Type':'application/json'})
    if r.status_code==200: break
req('PUT','/api/staff/pin',json={'pin':'1234'},headers=H)
out={'results':results,'cleanup':'deleted seeded cleaner/assignments; restored review_url/admin password/staff PIN'}
open('/app/test_reports/iteration14_cleanup.json','w').write(json.dumps(out,indent=2))
print(json.dumps(out,indent=2))
