# Tidyups Cleaning Service — PRD

## Original Problem Statement
Build a landing page for people wanting a quote for Tidyups Cleaning Service.
- Capture quote requests via a form (name, phone, service type, property type, bedrooms, bathrooms, etc.) saved to MongoDB.
- Admin dashboard to view submissions.
- Bold, modern, "clean & fresh" design using the brand's purple/magenta theme.
- SMS notifications to the owner on new leads (Twilio).
- Fully dynamic image manager in the admin dashboard (hero, gallery, why-us, promo images) using Emergent Object Storage.

## Architecture
- Frontend: React + TailwindCSS + Shadcn UI (port 3000)
- Backend: FastAPI + Motor async MongoDB (port 8001, routes prefixed /api)
- DB: MongoDB (collections: quotes, site_images)
- Integrations: Twilio SMS, Emergent Object Storage (Emergent Universal Key)

## Key Endpoints
- POST /api/quotes — submit quote request (triggers Twilio SMS to owner)
- GET /api/quotes — admin only (X-Admin-Password header)
- POST /api/admin/login
- GET /api/site-images
- POST /api/site-images (multipart upload), DELETE /api/site-images/{id}, POST /api/site-images/reorder

## Implemented (as of June 2026)
- Landing page: hero, services, why-us, dynamic gallery, quote form (with bedrooms/bathrooms)
- Quote form captures full address: street_address, city, province (dropdown, default Alberta), postal_code — street/city/postal required; legacy `address` field kept for old records (2026-07)
- Admin dashboard (/admin): lead viewer + site image manager (upload, delete, drag-to-reorder)
- Twilio SMS alerts for new leads (verified working)
- Emergent Object Storage for all site images
- Deployment fixes: requirements.txt curated manually (no direct-URL wheels), .gitignore allows .env files
- 2026-06: Re-fixed .gitignore regression (.env/.env.*/*.env patterns re-appeared and were removed); deployment health check PASSED

## Critical Notes for Agents
- DO NOT add .env patterns back to /app/.gitignore — .env files must be committed for Emergent deployment.
- NEVER run `pip freeze > requirements.txt` — add packages manually to avoid direct-URL wheel build crashes.
- Admin password: tidyups2026 (X-Admin-Password header). See /app/memory/test_credentials.md.
- Twilio "To" and "From" numbers must remain distinct in backend/.env.
- Production deployment: https://bookmycleaning.xyz (agent has no access; fixes go through preview + redeploy).

## Backlog
- P1: Editable business details (logo, phone, hours) in /admin
- P2: Image fit toggle (fill vs. show-full) for promo graphics in admin
- P2: PWA configuration (manifest, service worker, app icon)
