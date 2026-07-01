# Tidyups Cleaning Service — Landing Page

## Original Problem Statement
Build a landing page for people wanting a quote for Tidyups Cleaning Service (reference: 833tidyups.com / tidyupscleaning.com). Edmonton-based residential & commercial cleaning company.

## User Choices
- Goal: Get quote requests + phone calls.
- Highlight: Residential + commercial + deep/move-out cleaning.
- Quote submissions: stored in database + admin can view.
- Design: bold, modern (matched to real brand — purple/magenta, bunny mascot, tagline "Leave The Mess To Us!").

## Architecture
- Frontend: React (CRA + craco), Tailwind, shadcn/ui, framer-motion, sonner. Routes: `/` (Landing), `/admin` (leads dashboard).
- Backend: FastAPI + MongoDB (motor). Routes under `/api`.
- Brand assets (user-provided logo + banner) referenced from customer-assets CDN in `src/lib/data.js`.

## Core Requirements (static)
- Conversion-focused landing: hero with dual CTA (Get Quote + Call), services grid, why-us, stats, gallery, reviews, quote form, FAQ, contact/location, footer.
- Quote form persists leads; password-protected admin view.

## Implemented (2026-07-01)
- Full branded landing page (dark purple/magenta theme, Bricolage Grotesque + Manrope fonts, aurora/glass/grain effects, animations).
- Quote form (`POST /api/quotes`) with validation + success state.
- Admin dashboard `/admin` (password: `tidyups2026`, header `X-Admin-Password`) listing leads via `GET /api/quotes` (401 on wrong/missing password).
- Tested end-to-end: backend 9/9 pytest pass, frontend 100% pass.

## Credentials
- Admin password: `tidyups2026` (see `/app/memory/test_credentials.md`).

## Backlog / Next
- P1: Email/SMS notification on new lead (Resend/Twilio) so team is alerted instantly.
- P1: Real admin auth (JWT/session) + brute-force protection before production.
- P2: Lead status management (contacted/quoted/won) + pagination.
- P2: Online booking/scheduling with date-time slots.
