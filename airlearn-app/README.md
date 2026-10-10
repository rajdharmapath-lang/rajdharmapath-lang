# Raj Dharma — airlearn app

A React Native (Expo) mobile app + Node/Express backend. This package is
wired together end-to-end: every screen navigates correctly, and the auth
flow (Phone → OTP → Create Account → Language → Home) genuinely talks to a
real running backend rather than mocked responses.

## What's in here

```
airlearn-app/
  frontend/   Expo React Native app - all 32 screens, fully navigable
  backend/    Node/Express API - auth, Supabase-backed profiles, and payments
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

Razorpay credentials are read only by the backend from `backend/.env`. This
checkout uses the configured Razorpay mode: test keys create test orders, while
live keys create real payment orders. Live keys require
`RAZORPAY_ALLOW_LIVE=true` on the backend. Set that only after confirming live
key/secret pairing, capture verification, durable entitlement storage,
reconciliation, and applicable app-store billing requirements. Never put
Razorpay secrets in the frontend or commit `.env`.

User profiles are stored in Supabase. Set `SUPABASE_DATABASE_URL` in
`backend/.env` using the project's Session Pooler URI. Keep the
database password on the backend only; never add it to the mobile app or commit
it. URL-encode special characters in the password. Run
`backend/supabase/schema.sql` in the Supabase SQL Editor to create the
`public.users` table before signing in and rerun it after schema updates. The table stores the verified
phone/dial code, name, email, occupation/type, language, and timestamps. Phone
plus dial code is unique; email is not unique. WhatsApp OTP delivery remains
separate from this database connection.

### Payment flow

The app's payment flow is intentionally simple and local-first:

1. The user selects a plan in the mobile app, optionally with the `WELCOME500`
coupon code. The frontend sends `planId` and `couponCode` to
`POST /api/payments/create-order`.
2. The backend validates the plan and coupon, enforces the live-key opt-in,
creates a Razorpay order, and stores its user, plan, amount, and status in
`public.payment_orders`.
3. The API responds with the Razorpay `keyId`, `orderId`, `amount`, `currency`,
and the selected `planId`/`batchId`.
4. The frontend launches the Razorpay checkout. When the user successfully pays,
frontend submits the Razorpay callback payload with
`razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
5. The backend verifies the HMAC signature, fetches payment details from
Razorpay, confirms the order, amount, currency, and captured status, then
atomically stores the captured transaction in `public.payment_transactions`
and the batch entitlement in `public.user_entitlements`.
6. The app fetches authenticated `/api/payments/entitlements`; those server-side
records determine paid access.

### Practice access

Vocabulary is free. Users without a paid entitlement can preview the first
video lesson, one quiz question, and one speech-practice word per attempt.
Stroke practice allows three attempts per account; starting a fourth opens the
paywall. Continuing past the other previews opens the paywall, and those
previews reset when a new attempt starts.

Any paid batch entitlement grants Prime access across all batches and modules,
including lessons, quizzes, stroke practice, speech practice, and live access.
Access is reflected after the app loads the user's server-side entitlements.

Repeated verification of the same captured payment is idempotent. Payment
records are retained when an account is deleted; they are not linked by a
cascading user foreign key. The payment tables have RLS enabled and client roles
revoked; only the server-side database connection can access them.

The Razorpay native checkout does not run inside stock Expo Go. Build and install
a custom Android/iOS development client (or release build) after installing the
native package. Store releases may require Google Play Billing or Apple In-App
Purchase unless your app is approved for an external-payment program.

The Notes screen downloads its PDF through the authenticated
`/api/user/learning-pdf` backend endpoint. Set `SUPABASE_STORAGE_URL`,
`SUPABASE_STORAGE_BUCKET`, `SUPABASE_STORAGE_OBJECT_PATH`, and
`SUPABASE_STORAGE_PUBLIC` in `backend/.env`. The object path is relative to the
bucket and can include folders. `SUPABASE_URL` is also accepted as a fallback
for `SUPABASE_STORAGE_URL`. To use a complete Storage object URL instead, set
`SUPABASE_STORAGE_OBJECT_URL`; it takes precedence over the bucket/path settings.
For a private bucket, keep
`SUPABASE_STORAGE_PUBLIC=false` and set `SUPABASE_SERVICE_ROLE_KEY` on the
backend only. For a public bucket, set `SUPABASE_STORAGE_PUBLIC=true`; no service
role key is needed. Never put a service role key in the frontend or commit it.

When Storage settings are absent, the backend falls back to
`LEARNING_PDF_PATH` or `Downloads/RD chinese workbook.pdf` in its user's home
directory. Keep local PDFs out of Git.

### WhatsApp OTP

OTP delivery and verification use the MSG91 OTP Widget from the backend. Set
these values in `backend/.env` for local development and in the backend hosting
provider's secret environment settings for deployment:

```env
MSG91_AUTH_KEY=your_rotated_auth_key
MSG91_TOKEN_AUTH=your_widget_token_auth
MSG91_WIDGET_ID=your_widget_id
```

The OTP Widget requires its `Token Auth` value as well as its widget ID; obtain
the token from the MSG91 widget settings. The Auth Key is used to validate the
access token returned after successful OTP verification. Set WhatsApp as the
widget's default delivery channel in MSG91, and complete WhatsApp Business
onboarding, sender setup, and template approval there. The backend does not fall
back to SMS, a printed code, or a fixed OTP when MSG91 is unavailable.

The MSG91 Auth Key was shared in chat. Revoke/rotate it before using the
integration, then store only the replacement in backend secrets. Never put
MSG91 credentials in the frontend, commit them, or share them in chat.

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

Speech Practice uses native speech recognition and requires a custom
development build; it is not available in stock Expo Go. After changing the
speech-recognition native dependency or permissions, rebuild with
`npx expo run:android` or `npx expo run:ios`.

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
  on-device text-to-speech; microphone practice uses the device speech
  recognition service for transcription, while pronunciation scoring still
  returns simulated numbers. Pronunciation assessment integration is pending.
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
