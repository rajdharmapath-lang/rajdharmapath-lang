# Store privacy disclosure checklist

Use this code-informed checklist when completing Google Play Data safety and
Apple App Privacy disclosures. Store definitions differ, and the final answers
must be verified against the production build, provider configuration, and
each store's current requirements. This checklist is not a completed store
declaration or legal determination.

| Data category | App behavior found in code | Purpose | Store review note |
|---|---|---|---|
| Phone number and country dial code | Collected for OTP sign-in, sent to MSG91, and stored with the account profile in Supabase | Authentication and account support | Review the applicable personal/contact information categories and disclose sharing with MSG91 and backend providers |
| Name, email, occupation, and learning language | Name, email, occupation, and language preference are stored in the account profile in Supabase | Account profile and personalization | Map each field to the store's current categories; occupation and language may be treated differently by each store |
| Authentication information | OTP verification is used to sign in; an authentication token is stored in app storage on the device | Account access and session maintenance | Check store definitions for authentication information and whether the token is considered collected |
| Purchase and order information | Backend stores plan and batch, amount, currency, discounts, Razorpay order/payment references, payment method where supplied, status, and timestamps | Payment verification, entitlement delivery, support, and financial records | Razorpay handles checkout credentials. Confirm its SDK and current production configuration for the exact collection/sharing disclosures |
| Speech and audio | When a user chooses speech practice, the device captures and persists a recording and uses the configured OS speech-recognition provider. The app's pronunciation assessment is simulated and does not upload the recording or transcript to its backend | Speech practice | Verify whether the device provider transmits or retains audio/transcripts and declare any provider collection required by store rules |
| Learning activity and preferences | Favorites, recent words, learned-word identifiers, completed videos and stroke characters, streak, voice speed, and Foundation preview identifiers are stored locally. Account-scoped learning progress is keyed by account ID on the device and is not synced to the backend. The backend stores stroke-practice preview counts and paid-access entitlements | Learning features, personalization, preview limits, and content access | Distinguish on-device data from data transmitted to or stored by the backend |
| Live-class access and meeting participation | Backend checks active Live Class entitlement and the 1st–10th monthly, 6–8 PM IST window, then returns a passcode-bearing Zoom meeting URL. The app opens Zoom externally | Delivering access to purchased live classes | Zoom may process connection, device, account, and meeting participation data under its own terms; verify against the deployed Zoom setup |
| Downloaded learning materials | An authenticated request checks access and retrieves the requested PDF; the user chooses the save destination on Android | Delivering purchased learning content | Verify whether store definitions count downloads or saved files as collected data; saved copies are controlled by the user/device storage provider |
| IP address and connection/request metadata | The API records request ID, method, route, status, duration, timestamp, and sanitized error details. Hosting and network providers may process IP and connection information | Service operation, security, and troubleshooting | Verify hosting-provider logs, access, and retention in production and map to applicable store definitions |
| Device ID, precise location, contacts, and photos | No use was identified in the app code and permissions reviewed | Not used by the app | Recheck the final native manifests, permissions, and all bundled SDK declarations |
| Analytics, advertising, and crash reporting | No dedicated analytics, advertising, or crash-reporting SDK was identified in the app code and frontend dependencies reviewed | Not currently used by the app | Recheck the release build, native dependencies, and provider configuration before submission |

## Account deletion, retention, and sharing

- Users can initiate account deletion from Profile → Account. The backend
  removes the active account profile, but also writes a deletion-audit record
  containing a full profile snapshot. The code does not configure an expiry for
  this record. Payment orders, transactions, entitlements, and stroke-preview
  records may remain with the account's internal identifier; automatic
  anonymization or expiry is not implemented in the account-deletion flow.
- Account deletion also clears sign-in and certain learning data on the
  current device. Some preferences and preview identifiers, device speech
  recordings, and files saved outside the app may remain.
- MSG91 receives phone numbers for OTP delivery. Razorpay processes checkout.
  Supabase provides database and configured file-storage services. Zoom
  handles external live-class meetings after the app opens its meeting URL.
  The API hosting provider operates the backend. Device-configured speech
  services may process speech input. Confirm actual production providers and
  their respective disclosures.
- The app does not sell personal data or currently use an advertising SDK for
  tracking.

## Before store submission

1. Verify production providers and settings for MSG91, Supabase, Razorpay, API
   hosting, and speech recognition; review their collection, sharing, and
   retention practices.
2. Confirm the release API uses HTTPS and that production authentication and
   database access are securely configured.
3. Confirm production API logs, backups, deletion-audit handling, retention
   periods, and how retained payment and audit data are handled. Do not promise
   an expiry, anonymization, or deletion process unless it is implemented.
4. Confirm what audio and transcript data the supported operating systems'
   speech services collect, transmit, and retain.
5. Recheck final native manifests, permissions, and all bundled SDKs for
   additional data collection or sharing.
6. Confirm payment-record retention and account-linkage handling with the
   payment provider and an appropriate legal/accounting adviser.
7. Confirm age eligibility and any parental-consent obligations for the
   locations where the app will be offered.
