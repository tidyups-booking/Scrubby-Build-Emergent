# Tidyups Cleaning — MOBILE APP (Expo) — PRD

## What this task is
This fork was converted from the Tidyups website codebase into the **Tidyups mobile app** (Expo SDK 57 + expo-router,
React Native). The user deploys THIS task to a **separate domain** (the website lives in the original task at
https://bookmycleaning.xyz / tidyups.xyz and must NOT be touched from here).
Original build spec: /app/MOBILE_APP_SPEC.md.

## Architecture (IMPORTANT — two backends)
- **Quotes + admin login** → PRODUCTION website backend `https://bookmycleaning.xyz/api` (shared leads DB + Twilio SMS).
  Env: `EXPO_PUBLIC_BACKEND_URL` in frontend/.env. CORS on production is wide open (verified).
- **App images (dynamic, admin-managed)** → THIS task's own FastAPI backend (`/app/backend`, port 8001) + its own Mongo
  (`app_images` collection) + Emergent Object Storage. On web the app calls it same-origin (window.location.origin);
  on native it uses `EXPO_PUBLIC_IMAGES_URL` (frontend/.env).
- Frontend runs via supervisor `yarn start` = `expo start --web --port 3000`. Deployment build: `yarn build` =
  `expo export -p web --output-dir build`.
- Old website frontend preserved at /app/frontend_web_backup (do not delete; git history also has it).

## App structure (frontend/src)
- Tabs: Home (hero, CTAs, stats, badges, Promotions carousel, why-us, reviews), Services (9 services → Quote with
  preselect), Quote (form → POST production /api/quotes), Gallery (dynamic images + fullscreen viewer),
  Contact (tel links, hours, hidden Staff Login).
- /admin (modal stack route): password login (production /api/admin/login, stored in AsyncStorage) → segmented tabs:
  **Leads** (production GET /api/quotes, pull-to-refresh, tap-to-call) | **Images** (upload via expo-image-picker,
  label, up/down reorder, delete, per-image fit toggle "Fill frame"/"Show full" — against LOCAL backend /api/app-images*) |
  **Business** (AdminBusiness.js: logo upload/reset, phone, toll-free, address, website, editable hours rows → LOCAL /api/app-settings).
- Business details are served app-wide via `src/lib/business.js` (BusinessProvider context wrapped in root _layout;
  `useBusiness()` gives `business` in CONTACT shape + `logoUrl` + `refresh()`). Home call button/logo and the whole
  Contact tab read from it; static CONTACT in constants/data.js is only the fallback default.
- PWA: `src/app/+html.js` (manifest link, theme-color, apple meta, SW registration) + `public/manifest.json`,
  `public/sw.js` (network-first navigation, cache-first assets, skips /api), `public/icons/*` (192/512/maskable/apple).
- Theme: dark #0A0611 / panels #150B22, gradient #FF8A3D→#E0218A→#8B2FC9, fonts Sora (display) + Outfit (body).
- Brand assets in frontend/assets/images (logo.png, banner.jpg, generated icon.png/splash-icon.png/favicon.png).

## Backend additions (this fork only)
- `/api/app-images` GET (public list, now includes `fit`), `/api/app-images/upload` POST (multipart file+label, X-Admin-Password),
  `/api/app-images/{id}` DELETE (soft), `/api/app-images/{id}` PATCH (`{"fit":"cover"|"contain"}`), `/api/app-images/reorder` POST,
  `/api/app-images/file/{path}` GET (serves from Emergent Object Storage).
- `/api/app-settings` GET (public business details + computed phone_tel/tollfree_tel/maps_url/website_url),
  PUT (admin, partial update of phone/tollfree/address/city_line/website/hours), `/api/app-settings/logo` POST (multipart upload,
  sets logo_url) / DELETE (reset to default logo). Stored in `app_settings` collection (single doc key="business").
- Seeds 5 images on startup if `app_images` empty (2 cropped flyers stored in object storage + 3 customer-asset URLs).
- `seed_site_images` self-heals BOTH `hero` and `why` slots on startup if soft-deleted.
- backend/.env: MONGO_URL, DB_NAME=tidyups_database, ADMIN_PASSWORD=tidyups2026, EMERGENT_LLM_KEY (storage), CORS *.
- backend/tests/conftest.py loads backend/.env so pytest never falls back to wrong DB.

## Critical notes
- DO NOT modify the production website/backend — it belongs to the original task.
- Quote POST to production sends a REAL SMS to the owner — ask user before submitting test quotes to production.
- Admin password must stay in sync between production ADMIN_PASSWORD and this backend's .env.
- Never `pip freeze > requirements.txt`; add packages manually. Do not add .env to .gitignore.
- yarn needs `--ignore-engines` (node 20 vs some deps wanting 22) — handled via frontend/.yarnrc.
- THIS POD: kernel inotify max_user_watches=12288 (cannot raise) → Metro's file watcher crashes with ENOSPC.
  Fix in place: package.json start script is `CI=1 expo start --web --port 3000` (watching disabled).
  **NO HOT RELOAD on frontend** — after any frontend code change run `sudo supervisorctl restart frontend` and wait ~25s.

## Backlog
- P2: Native builds (EAS) + store submission (needs Apple/Google accounts; icon + privacy policy ready).
- P2: Push notifications for new leads.
- P3 (code health, from testing agent review): split server.py into modules; wrap put_object/get_object in
  run_in_threadpool; hard-delete orphaned storage blobs.

## Done (June 21, 2026 session)
- Admin "Business" tab: editable logo (upload/reset), phone, toll-free, address, website, hours — live app-wide.
- Per-image fit toggle (Fill frame / Show full) in admin Images; respected by Home promos + Gallery.
- PWA: manifest, service worker, icons, meta tags (installable web app).
- Fixes: hero slot self-heal on startup; tests conftest.py env loading; CI=1 Metro workaround for low inotify limit.
- All tested: iteration_6.json — backend 19/19, frontend 100%.
