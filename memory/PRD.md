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
  label, up/down reorder, delete — against LOCAL backend /api/app-images*).
- Theme: dark #0A0611 / panels #150B22, gradient #FF8A3D→#E0218A→#8B2FC9, fonts Sora (display) + Outfit (body).
- Brand assets in frontend/assets/images (logo.png, banner.jpg, generated icon.png/splash-icon.png/favicon.png).

## Backend additions (this fork only)
- `/api/app-images` GET (public list), `/api/app-images/upload` POST (multipart file+label, X-Admin-Password),
  `/api/app-images/{id}` DELETE (soft), `/api/app-images/reorder` POST, `/api/app-images/file/{path}` GET (serves from
  Emergent Object Storage).
- Seeds 5 images on startup if `app_images` empty (2 cropped flyers stored in object storage + 3 customer-asset URLs).
- backend/.env: MONGO_URL, DB_NAME=tidyups_database, ADMIN_PASSWORD=tidyups2026, EMERGENT_LLM_KEY (storage), CORS *.

## Critical notes
- DO NOT modify the production website/backend — it belongs to the original task.
- Quote POST to production sends a REAL SMS to the owner — ask user before submitting test quotes to production.
- Admin password must stay in sync between production ADMIN_PASSWORD and this backend's .env.
- Never `pip freeze > requirements.txt`; add packages manually. Do not add .env to .gitignore.
- yarn needs `--ignore-engines` (node 20 vs some deps wanting 22) — handled via frontend/.yarnrc.

## Backlog
- P2: Native builds (EAS) + store submission (needs Apple/Google accounts; icon + privacy policy ready).
- P2: Push notifications for new leads.
