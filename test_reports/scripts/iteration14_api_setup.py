import json, os, uuid, requests
BASE=os.environ.get('EXPO_PUBLIC_IMAGES_URL','https://expo-book-cleaning.preview.emergentagent.com').rstrip('/')
PW=os.environ.get('ADMIN_PASSWORD','tidyups2026')
PIN='1234'
H={'X-Admin-Password':PW,'Content-Type':'application/json'}
results=[]
created={'cleaner_id':None,'active_assignment_id':None,'done_assignment_id':None,'review_url':None}

def rec(name, ok, detail):
    results.append({'name':name,'ok':bool(ok),'detail':detail})
    print(('PASS' if ok else 'FAIL'), name, detail)

def req(method,path,**kw):
    return requests.request(method, f'{BASE}{path}', timeout=25, **kw)

# restore admin pw if previous run left changed
for candidate in [PW,'qatest123','changed_pw_9x']:
    r=req('PUT','/api/admin/password',json={'new_password':PW},headers={'X-Admin-Password':candidate,'Content-Type':'application/json'})
    if r.status_code==200: break
rec('admin login succeeds', req('POST','/api/admin/login',headers={'X-Admin-Password':PW}).status_code==200, 'POST /api/admin/login with tidyups2026')
rec('admin wrong password 401', req('POST','/api/admin/login',headers={'X-Admin-Password':'wrong'}).status_code==401, 'wrong pw rejected')
rec('history without admin 401', req('GET','/api/assignments/history').status_code==401, 'GET history no header')
settings=req('GET','/api/app-settings')
rec('app settings returns review_url', settings.status_code==200 and 'review_url' in settings.json(), settings.text[:160])
# cleaner checkin/seed
name='TEST_ITER14_'+uuid.uuid4().hex[:6]
r=req('POST','/api/cleaners/checkin',json={'name':name,'pin':PIN})
rec('cleaner checkin seed', r.status_code==200, r.text[:160])
r.raise_for_status(); cid=r.json()['cleaner_id']; created['cleaner_id']=cid
# active assignment for cleaner jobs
payload={'quote_id':'TEST_ITER14_ACTIVE_'+uuid.uuid4().hex[:8],'cleaner_id':cid,'customer_name':'TEST Iter14 Active','service_type':'Standard Clean','address':'123 QA Street','phone':'204-555-0102','preferred_date':'2026-07-23','message':'TEST active assignment'}
r=req('POST','/api/assignments',json=payload,headers=H)
rec('active assignment seed', r.status_code==200 and r.json().get('status')=='assigned', r.text[:180])
r.raise_for_status(); created['active_assignment_id']=r.json()['id']
# done assignment for history/review
payload2={**payload,'quote_id':'TEST_ITER14_DONE_'+uuid.uuid4().hex[:8],'customer_name':'TEST Iter14 Done','phone':'204-555-0103','message':'TEST done assignment'}
r=req('POST','/api/assignments',json=payload2,headers=H)
rec('done assignment seed create', r.status_code==200, r.text[:180])
r.raise_for_status(); aid=r.json()['id']; created['done_assignment_id']=aid
r=req('POST',f'/api/assignments/{aid}/status',json={'cleaner_id':cid,'pin':PIN,'status':'done'})
rec('done assignment status', r.status_code==200, r.text[:160])
# send-review edge: 400 without review_url
orig=settings.json().get('review_url','') if settings.status_code==200 else ''
req('PUT','/api/app-settings',json={'review_url':''},headers=H)
r=req('POST',f'/api/assignments/{aid}/send-review',headers={'X-Admin-Password':PW})
rec('send review 400 without review_url', r.status_code==400, r.text[:180])
review_url='https://g.page/r/test-iter14-'+uuid.uuid4().hex[:6]
created['review_url']=review_url
r=req('PUT','/api/app-settings',json={'review_url':review_url},headers=H)
rec('set review_url', r.status_code==200 and r.json().get('review_url')==review_url, r.text[:180])
r=req('POST',f'/api/assignments/{aid}/send-review',headers={'X-Admin-Password':PW})
body={}
try: body=r.json()
except Exception: pass
rec('send review 200 with sent_via_sms false and timestamp', r.status_code==200 and body.get('sent_via_sms') is False and bool(body.get('review_sent_at')), str(body)[:240])
# Do not restore review_url now; UI business tab will verify/edit/persist. Save original too for cleanup if needed.
created['original_review_url']=orig
out={'base':BASE,'password':PW,'pin':PIN,'created':created,'results':results}
open('/app/test_reports/iteration14_seed.json','w').write(json.dumps(out,indent=2))
print(json.dumps(out,indent=2))
