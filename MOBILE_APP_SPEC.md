# Tidyups Cleaning — Mobile App (Expo) Build Spec

Paste this into a **new Mobile Agent task** to rebuild the app as a native iOS/Android app.
The existing backend is already live and can be reused as-is — **do not rebuild the backend.**

---

## 1. What to build
A native Expo (React Native) mobile app for **Tidyups Cleaning Service Inc** (Edmonton, AB) — a
cleaning company. Two areas:
- **Customer flow**: browse services + submit a free-quote request.
- **Admin flow**: password-protected screen to view incoming leads.

## 2. Reuse the existing backend (no backend work needed)
Base URL (production): `https://tidyups.xyz`
All routes are prefixed with `/api`. Store the base URL in an env/config constant.

### Endpoints
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/quotes` | none | Create a lead (also auto-sends an SMS alert to the owner) |
| GET | `/api/quotes` | header `X-Admin-Password` | List all leads (newest first) |
| POST | `/api/admin/login` | header `X-Admin-Password` | Validate admin password |

- Admin password header value: ask the owner (currently `tidyups2026`).
- Wrong/missing admin password → HTTP 401.

### Quote object (request body for POST, and items returned by GET)
```json
{
  "name": "string (required)",
  "phone": "string (required)",
  "service_type": "string (required)",
  "email": "string (optional)",
  "property_type": "string (optional)",
  "bedrooms": "string (optional)",
  "bathrooms": "string (optional)",
  "address": "string (optional)",
  "preferred_date": "string (optional, YYYY-MM-DD)",
  "message": "string (optional)"
}
```
GET responses also include: `id`, `status` ("new"), `created_at` (ISO datetime).

### Dropdown options
- **Service**: Home Cleaning, Recurring Cleaning, Deep Cleaning, Move-Out Cleaning, Move-In Cleaning,
  Commercial & Office, Airbnb Turnover, Post-Construction, Eco-Friendly Clean, Other / Not Sure
- **Property type**: House, Apartment / Condo, Office, Airbnb / Rental, Commercial Space, Other
- **Bedrooms**: Studio, 1, 2, 3, 4, 5, 6+
- **Bathrooms**: 1, 1.5, 2, 2.5, 3, 4, 5+

## 3. Screens
1. **Home** — hero ("Sparkling spaces, zero hassle." / "Leave the mess to us"), primary CTA
   "Get Free Quote", secondary "Call" button (tel:+17807185092), stats (2000+ clients, 15+ yrs, 5.0),
   trust badges (Insured & Bonded, Eco-Friendly, Satisfaction Guaranteed).
2. **Services** — list/grid of the 9 services with icon + short description; tapping any goes to Quote.
3. **Quote Request** — form with the fields above; required = name, phone, service. On submit POST to
   `/api/quotes`, show a success confirmation ("Request received!").
4. **Reviews / Why Us** — testimonials + feature highlights (optional, nice-to-have).
5. **Contact** — phone (780) 718-5092 & toll-free (833) TIDY-UPS (tel: links), address
   6510 Gateway Boulevard Suite 1020, Edmonton, AB T6H 5Z5, hours (Mon–Fri 8–6, Sat 9–4, Sun closed).
6. **Admin (hidden)** — password entry → list of leads (name, phone tap-to-call, service, beds/baths,
   address, message, timestamp) with pull-to-refresh.

## 4. Brand & styling
- **Vibe**: bold, modern, dark theme.
- **Colors**: near-black purple background (#0A0611), panels (#150B22), accents violet #8B2FC9,
  magenta #E0218A, pink #FF5FB0, gold/orange #FF8A3D. Signature gradient (headings & buttons):
  `#FF8A3D → #E0218A → #8B2FC9`.
- **Tagline**: "Leave The Mess To Us!"
- **Logo**: bunny mascot — https://customer-assets.emergentagent.com/job_tidyups-quote/artifacts/97bcjnmh_Tidyups%20Cleanin%20Logo%20V3%202026_edited.png
- **Banner**: https://customer-assets.emergentagent.com/job_tidyups-quote/artifacts/j5vvr2zn_Tidyups%20Banner%202026%20V3_edited.jpg
- Fonts: a bold display font for headings + clean sans for body.

## 5. Contact / business facts
- Phone: (780) 718-5092  ·  Toll-free: (833) TIDY-UPS / +1 (833) 843-9877
- Website: tidyupscleaning.com  ·  Deployed: https://tidyups.xyz
- Serves Edmonton & surrounding area.

## 6. Notes
- SMS lead alerts are handled server-side automatically on POST /api/quotes — the mobile app does
  nothing extra for that.
- For app-store submission you'll need an Apple Developer account ($99/yr) and Google Play account ($25).
- Provide app icon (use the bunny logo) and a privacy policy URL before submitting.
