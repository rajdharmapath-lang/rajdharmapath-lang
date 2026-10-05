# Raj Dharma — airlearn app

A React Native (Expo) mobile app + Node/Express backend. This package is
wired together end-to-end: every screen navigates correctly, and the auth
flow (Phone → OTP → Create Account → Language → Home) genuinely talks to a
real running backend rather than mocked responses.

## What's in here

```
airlearn-app/
  frontend/   Expo React Native app - all 32 screens, fully navigable
  backend/    Node/Express API - auth + profile endpoints, in-memory storage
```

## Running it locally

You need both running at the same time.

### 1. Backend

```bash
cd backend
npm install
npm start
```

This starts the API on http://localhost:4000. Leave it running.

Razorpay checkout is wired in **test mode only**. Create `backend/.env` and add
a rotated Razorpay test key pair there. The backend loads `.env` at startup;
never put the secret in the frontend or commit `.env`.
Live keys are deliberately rejected while purchase entitlements are stored only
in memory and disappear when the backend restarts. Before enabling live charges,
move payment orders and entitlements to durable storage and verify your store's
rules for external billing of digital lessons.

User profiles are stored in Supabase. Set `SUPABASE_DATABASE_URL` in
`backend/.env` using the project's direct PostgreSQL connection string. Keep the
database password on the backend only; never add it to the mobile app or commit
it. URL-encode special characters in the password. Run
`backend/supabase/schema.sql` in the Supabase SQL Editor to create the
`public.users` table before signing in. The table stores the verified
phone/dial code, name, email, occupation/type, language, and timestamps. Phone
plus dial code is unique; email is not unique. WhatsApp OTP delivery remains
separate from this database connection.

### Payment flow

The app's payment flow is intentionally simple and local-first:

1. The user selects a plan in the mobile app, optionally with the `WELCOME500`
coupon code. The frontend sends `planId` and `couponCode` to
`POST /api/payments/create-order`.
2. The backend validates the plan and coupon, checks that the Razorpay keys are
test keys, and creates a Razorpay order for the discounted amount.
3. The API responds with the Razorpay `keyId`, `orderId`, `amount`, `currency`,
and the selected `planId`/`batchId`.
4. The frontend launches the Razorpay checkout. When the user successfully pays,
frontend submits the Razorpay callback payload with
`razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
5. The backend verifies the HMAC signature, fetches the payment details from
Razorpay, confirms the order, amount, currency, and captured status, and then
stores the entitlement for that batch in memory.
6. Subsequent calls to the user/profile endpoints read the purchased batches and
unlock the corresponding lessons or live access.

This is a safe local test flow, not a production billing setup. Until entitlements
are persisted in a real database and the app store policy is reviewed, the backend
continues to reject live keys and the app should only be tested with Razorpay test
credentials.

The Razorpay native checkout does not run inside stock Expo Go. Build and install
a custom Android/iOS development client (or release build) after installing the
native package. Store releases may require Google Play Billing or Apple In-App
Purchase unless your app is approved for an external-payment program.

The Notes download is served from `Downloads/RD chinese workbook.pdf` in the
backend user's home directory by default. Keep this large PDF out of Git. To
use a different local path, set `LEARNING_PDF_PATH` before starting the backend:

```powershell
$env:LEARNING_PDF_PATH = 'D:\private-files\RD chinese workbook.pdf'
npm start
```

For deployment, place the PDF in external storage or a mounted volume and set
`LEARNING_PDF_PATH` to that location on the backend host. The mobile app
downloads it through the authenticated `/api/user/learning-pdf` endpoint.

There's no real SMS/WhatsApp OTP provider wired up yet. When you request an
OTP, the actual 6-digit code is printed in this terminal window, e.g.:

```
[OTP] +919876543210 -> 801644  (or use dev master code 123456)
```

For convenience while testing, the code 123456 always works, for any phone
number. Remove DEV_MASTER_OTP in backend/src/services/otp.service.js before
this goes anywhere near production.

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npx expo install --fix
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press i / a for a
simulator/emulator.

Important - the backend URL: frontend/src/api/client.js points at
localhost:4000 for iOS and 10.0.2.2:4000 for the Android emulator
automatically. If you're testing on a physical device, change API_BASE_URL
in that file to your computer's LAN IP (e.g. http://192.168.1.23:4000/api),
since localhost on a phone means the phone itself, not your computer.

## Full screen list (all wired into App.js)

Onboarding: Splash -> Phone Entry -> OTP Verify -> Create Account -> Language
Choose. Home. Videos (batch list -> lesson list -> player, + Live Class
placeholder). Stroke Writing (character select -> practice -> result).
Vocabulary (main -> categories -> word list). Speech Practice (word list ->
practice -> result). Quiz (batch -> list -> intro -> play -> result).
Payment (choose plan -> checkout -> success/failed). Settings (main ->
account -> language -> learning preference).

## Known gaps - read before you assume something's broken

- Live Class screen is a placeholder. No design was provided for it yet -
  tapping "Join Live" (once unlocked) shows a "coming soon" stub.
- Razorpay test checkout creates orders and verifies payment signatures on the
  backend. Live checkout remains disabled until entitlements use persistent
  storage and the applicable app-store billing rules are satisfied.
- Azure pronunciation/speech APIs aren't connected. Word audio uses
  on-device text-to-speech; pronunciation scoring returns realistic
  simulated numbers. Integration points are commented in services/audio.js
  and services/pronunciation.js.
- Most content is a working template, not a full course. Only the
  Foundation batch's "Greetings" vocabulary category and one sample quiz
  have real questions - everything else has correct structure/names but
  empty content, on purpose (see in-code comments about avoiding invented
  Tamil translations at scale).
- Home's progress stats (10 videos / 120 words / 7-day streak) are mock
  numbers, not derived from real activity - there's no progress-tracking
  backend yet.
- Verified test purchases are recorded in backend memory and cached locally on
  the device. Backend memory resets on restart, so this is not production-ready;
  persist entitlements before accepting live payments.
- Notifications and Support & About in Settings are stubbed ("coming soon")
  since you said you'd provide these later.
- This has been tested by actually running the backend and exercising every
  auth endpoint, and by static-checking every screen's imports and
  navigation targets - but the Expo app itself has not been run in a
  simulator/device from this environment. Please flag anything that doesn't
  behave as expected once you run it.
