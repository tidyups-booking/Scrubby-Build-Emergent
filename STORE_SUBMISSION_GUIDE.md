# Tidyups Cleaning — App Store & Google Play Submission Guide

Everything in the repo is already configured (app.json bundle IDs, icons, splash, eas.json build
profiles, location & notification permission strings). Follow these steps from your own computer —
the store builds run on Expo's EAS cloud, so you don't need Xcode or Android Studio.

## 0. One-time setup (10 min)
1. Create a free Expo account at https://expo.dev/signup (if you don't have one).
2. Install Node.js 20+ (https://nodejs.org), then in a terminal:
   ```
   npm install -g eas-cli
   ```
3. Download this project's code (Emergent → "Save to GitHub", then clone; or use the code download option).
4. In the project: `cd frontend && yarn install --ignore-engines`
5. Log in: `eas login`
6. Link the project (creates the EAS project id automatically):
   ```
   eas init
   ```

## 1. Android — Google Play ($25 one-time account)
1. Build the production app bundle:
   ```
   eas build --platform android --profile production
   ```
   (First run: let EAS generate and manage the keystore — press Enter to accept.)
2. While it builds (~15 min), go to https://play.google.com/console → "Create app":
   - Name: Tidyups Cleaning · Default language: English (CA) · App type: App · Free.
3. Complete the "Set up your app" checklist (content rating, data safety — see notes below, target audience 18+).
4. Download the `.aab` from https://expo.dev (your build page) and upload it under
   Production → Create new release, or submit straight from the terminal:
   ```
   eas submit --platform android --latest
   ```
   (First time you'll need a Google Service Account JSON — EAS prints a step-by-step link.)

## 2. iOS — App Store ($99/yr Apple Developer account)
1. Build:
   ```
   eas build --platform ios --profile production
   ```
   Sign in with your Apple Developer account when prompted — EAS creates certificates and the
   provisioning profile for `com.tidyups.cleaning` automatically.
2. Submit the build to App Store Connect:
   ```
   eas submit --platform ios --latest
   ```
3. In https://appstoreconnect.apple.com → My Apps → Tidyups Cleaning:
   - Fill in the listing (description, keywords, support URL, screenshots).
   - Screenshots: run the app, take 6.5" iPhone screenshots (1290×2796). The dark theme looks great here.
   - Add the App Privacy details (see below) and submit for review.

## 3. Data-safety / App-privacy answers (both stores)
The app collects:
- **Contact info (name, phone, email, address)** — only when a customer submits a quote request; used for
  service delivery; not shared with third parties; not used for tracking.
- **Precise location** — ONLY for staff members who tap "Start Sharing Location" in the Cleaner
  Check-In screen; used for dispatch coordination; user-initiated, can stop anytime; not shared.
- No ads, no analytics SDKs, no tracking across apps.
Privacy policy: host `PRIVACY_POLICY.md` (in the repo root) on your website, e.g.
`https://tidyupscleaning.com/privacy`, and paste that URL into both store listings.

## 4. Store listing copy (ready to paste)
- **Title**: Tidyups Cleaning
- **Subtitle/Short description**: Edmonton's trusted cleaning crew — quotes in one tap.
- **Description**:
  Sparkling spaces, zero hassle. Tidyups Cleaning Service brings Edmonton's 5-star residential and
  commercial cleaning to your pocket. Browse our services, get a free quote in under a minute,
  check out our latest promotions, and call or text us with one tap. Insured & bonded, eco-friendly
  products, satisfaction guaranteed.
- **Keywords (iOS)**: cleaning,house cleaning,maid,Edmonton,deep clean,move out,airbnb,office cleaning
- **Category**: Lifestyle (or House & Home on Google Play)

## 5. After approval
- Push notifications & background location for cleaners work best in these native builds.
- To ship an update later: bump nothing (autoIncrement handles versions), just re-run
  `eas build … && eas submit …`.
