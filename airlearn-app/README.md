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
- Razorpay isn't connected. services/payment.js simulates a checkout
  (succeeds about 85% of the time, fails the rest, so you can see both
  outcomes). The integration point is commented in that file.
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
- Purchases are stored locally on the device (AsyncStorage), not verified
  server-side. Fine for trying the app; not fine for production - real
  entitlements need to come from your backend after Razorpay payment
  verification.
- Notifications and Support & About in Settings are stubbed ("coming soon")
  since you said you'd provide these later.
- This has been tested by actually running the backend and exercising every
  auth endpoint, and by static-checking every screen's imports and
  navigation targets - but the Expo app itself has not been run in a
  simulator/device from this environment. Please flag anything that doesn't
  behave as expected once you run it.
