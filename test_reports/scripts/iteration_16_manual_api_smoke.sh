#!/usr/bin/env bash
set -euo pipefail
URL="${TEST_BASE_URL:-https://expo-book-cleaning.preview.emergentagent.com}"
PW="${ADMIN_PASSWORD:-tidyups2026}"
echo "BASE=$URL"
echo "correct_pw"
curl -sS -o /tmp/iter16_login_ok.json -w '%{http_code}\n' -X POST "$URL/api/admin/login" -H "X-Admin-Password: $PW"
echo "wrong_pw"
curl -sS -o /tmp/iter16_login_bad.json -w '%{http_code}\n' -X POST "$URL/api/admin/login" -H "X-Admin-Password: wrong"
echo "app_settings"
curl -sS "$URL/api/app-settings" | python -c 'import sys,json; d=json.load(sys.stdin); print({"has_review_url":"review_url" in d,"review_url":d.get("review_url","")})'
echo "history_no_auth"
curl -sS -o /tmp/iter16_history_noauth.json -w '%{http_code}\n' "$URL/api/assignments/history"
echo "history_auth"
curl -sS -H "X-Admin-Password: $PW" "$URL/api/assignments/history" | python -c 'import sys,json; d=json.load(sys.stdin); print({"status":"list","count":len(d)})'
