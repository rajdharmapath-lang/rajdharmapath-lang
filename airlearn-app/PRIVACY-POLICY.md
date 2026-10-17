# Raj Dharma Privacy Policy

**Effective date:** October 17, 2026
**App:** Raj Dharma for Android and iOS
**Website:** https://rajdharma.org/privacy-policy.html

Raj Dharma is a language-learning app operated by Raj Dharma
("we", "us", or "our"). This policy describes the information handled when
you use the app, why it is used, and the choices available to you.

## Information we handle

### Account and profile

To create and secure an account, we handle your phone number and country dial
code and send them to MSG91 to deliver and verify a one-time password (OTP).
The app also handles the OTP you submit and a short-lived verification
request token. OTPs are not used as your password.

You may provide your name, email address, occupation, and preferred learning
language. Your phone number, dial code, profile fields, and account creation
and update dates are stored in our account database. An authentication token
is stored in app storage on your device so you can remain signed in.

### Learning and app preferences

The app stores some learning activity and preferences locally on your device.
This can include favorite and recently viewed vocabulary, completed video
lessons, completed stroke-practice characters, learned-word identifiers,
practice streak dates, pronunciation voice speed, and Foundation free-preview
lesson identifiers. Your preferred learning language is also saved in your
account profile. The app does not use this information for advertising.

The backend stores a count of free stroke-practice previews claimed by your
account to enforce the preview limit. The backend also stores purchase
entitlements needed to provide access to paid content.

### Speech practice and microphone

If you use Speech Practice or a speaking question in a quiz, the app requests
microphone and speech-recognition permission. While you use this feature, your
device captures your speech and its speech-recognition service processes it
to produce a transcript. The app currently generates simulated practice scores;
it does not send the recording or transcript to the Raj Dharma backend for
pronunciation scoring.

The speech-recognition component is configured to persist a recording on the
device. The app does not currently provide a separate in-app control for
deleting that recording, so it may remain in app/device storage until removed
by the operating system, app-data controls, or uninstalling the app. Speech
recognition may be provided by Google, Apple, or another service configured on
your device. That provider may process voice input under its own terms and
privacy policy and may transmit it off your device. We do not control that
provider's processing.

For pronunciation playback, the app sends the Chinese text to the text-to-
speech service available on your device. This playback feature does not require
microphone permission.

### Payments and subscriptions

When you choose a paid plan, the app and backend handle the selected plan and
batch, order and payment references, amount, currency, coupon or discount
information, payment status, payment method where supplied by the payment
provider, and relevant timestamps. Razorpay processes checkout and payment
verification. We do not receive or store your full card number, bank-account
credentials, UPI PIN, or other payment credentials. Razorpay may collect
additional information directly under its own privacy policy.

### Notes and downloads

If you are eligible and request a workbook download, the app sends an
authenticated request to verify access and retrieve the PDF from configured
file storage. When saving on Android, you select a destination using the
system save dialog; the app copies the PDF to that location. The app uses a
temporary local file while downloading and saving and attempts to remove that
temporary file when the operation ends. Files saved to a location you choose
are under your control and are not removed by deleting your account.

### Technical and diagnostic information

Our API records operational request information such as a request identifier,
request method and path, response status, duration, and sanitized error
details. OTP error logs are designed to mask phone numbers, retaining only
their last four digits. The app does not currently integrate an advertising,
analytics, or dedicated crash-reporting SDK and does not collect a device
advertising ID.

The API host, database, messaging, payment, and other network providers may
also receive your IP address, connection information, and request metadata as
part of delivering and securing their services. Their own logs and retention
practices are governed by their policies.

We do not request access to your contacts, photos, or precise location.

## How we use information

We use the information described above to:

- create and secure accounts, verify phone numbers, and maintain sign-in;
- provide and personalize learning features and save applicable preferences;
- operate practice previews, check paid access, and deliver requested notes;
- create and verify payments and provide purchased access;
- troubleshoot, protect, and maintain the service; and
- respond to support, privacy, legal, and payment-related requests.

We do not sell personal information or use it for cross-context behavioral
advertising. Where applicable law requires a lawful basis or consent, we
process information on that basis, including consent for microphone access
where required.

## Service providers and disclosures

We share information only as needed to operate the app with:

- **MSG91**, to deliver and verify OTPs;
- **Supabase**, for account, learning-access, payment-reference, and configured
  file-storage services;
- **Our API hosting provider**, to run the app backend;
- **Razorpay**, to process checkout and verify payments; and
- **The speech-recognition and text-to-speech providers configured on your
  device**, when you use speaking practice or pronunciation playback.

These providers process information under their own terms and privacy
practices. We may also disclose information when required by law or when
reasonably necessary to protect users, the service, or our legal rights.

## Retention and account deletion

We retain account information while an account is active. If an account has
no active batch subscription for more than 12 consecutive months, we will
permanently delete the user's personal details, including profile details
and deletion-audit copies, unless a specific record must be retained to meet
a legal or financial obligation. You can also start account deletion at any
time in **Profile → Account → Delete Account**. This removes the active
account profile and the app clears the sign-in token, learning progress, and
vocabulary favorites and recents from the current device.

**Some server-side records are currently retained after account deletion.**
The deletion process writes a deletion-audit record containing a copy of the
profile, including phone number, dial code, name, email, occupation, language,
account dates, and a full profile snapshot. The backend currently has no
automatic expiry configured for this audit record, so the 12-month deletion
rule is not yet automatically enforced by the application. Until the cleanup
process is implemented and completed, these copies may remain after the
12-month period; contact us to request deletion. Payment orders, transactions,
and stroke-preview records may also remain in the database and may retain the
account's internal identifier, subject to applicable legal and financial
retention requirements. A deletion request therefore does not immediately
erase all records or anonymize all retained records.

Some locally stored preview identifiers, pronunciation preferences, device
speech recordings, temporary files left after an interrupted operation, and
files you saved to a location you selected may not be removed by account
deletion. You can clear app storage or uninstall the app to remove app data
from your device; files saved outside the app must be removed separately.
MSG91, Razorpay, the speech service, and infrastructure providers may retain
information under their own policies and legal obligations.

## Children

The app is a general-purpose language-learning app and is not specifically
designed or marketed to children under 13. It does not ask for or store date
of birth and does not currently provide an in-app parental verification flow.
If you are below the age at which you can consent to data processing in your
location, use the app only with permission from a parent or legal guardian.
Where local law requires verifiable parental consent, it must be obtained
before an account is created. A parent or guardian who believes a child has
provided personal information may contact us to request assistance.

## International processing

Our service providers may process information in countries other than the
country where you live. The location and safeguards applicable to a
particular processing activity may depend on the provider and your device
settings. Please refer to the providers' privacy policies for further details.

## Your choices and rights

You can review or update available profile fields in **Profile → Account**,
change your learning language and pronunciation speed in app settings, and
request account deletion in the app. You can deny or revoke microphone
permission in your device settings; speech practice will then be unavailable.
You can also contact us to request access, correction, deletion, or information
about how your information is handled. Depending on your location, you may
have additional rights under applicable privacy law. We will respond as
required by law.

## Security

We use authenticated API access, HTTPS for the production API, and restricted
server-side database access to help protect information. No method of
transmission or storage is completely secure. Please protect access to your
device and contact us if you believe your account has been accessed without
authorization.

## Changes to this policy

We may update this policy when the app, our data practices, or applicable
requirements change. We will update the effective date above and provide
additional notice where required.

## Contact

For privacy questions or requests, contact:

**Raj Dharma**  
Phone: +91 89391 07990
WhatsApp: [+91 89391 07990](https://wa.me/918939107990)
Email: [rajdharmapath@gmail.com](mailto:rajdharmapath@gmail.com)
Website: https://rajdharma.org/privacy-policy.html
