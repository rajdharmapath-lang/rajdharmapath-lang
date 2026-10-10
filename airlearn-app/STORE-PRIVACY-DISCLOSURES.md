# Store privacy disclosure checklist

Use this as a code-based starting point for Google Play Data Safety and Apple
App Privacy. Confirm each answer against the production build, provider
configuration, and current store definitions before submitting. This is not a
completed store declaration or legal determination.

| Data category | App behavior found in code | Purpose | Store review note |
|---|---|---|---|
| Phone number | Collected for OTP login; sent to MSG91 and stored with country dial code in Supabase | Authentication and account recovery | Declare as account/contact information; shared with MSG91 |
| Name and email | Collected for the user profile and stored in Supabase | Account/profile | Declare as personal/contact information |
| Occupation and language | Occupation is required during account creation; language is stored as a profile preference in Supabase | Profile and personalization | Declare if included in the store's categories |
| Purchase/order data | Backend stores plan, amount, currency, discount, Razorpay order/payment identifiers, method, status, and timestamps | Payment verification, access, disputes/accounting | Razorpay handles checkout credentials; confirm the SDK's exact collection and sharing behavior |
| Speech/audio | Microphone recording and speech recognition occur when the user chooses speech practice; app code does not upload the recording/transcript to its backend | Speech-practice feature | Verify Apple/Google speech service behavior and declare any collection by included platform SDKs |
| Learning activity | Favorites, recent words, completed videos, learned-word count, and streak are stored locally; stroke-preview count is sent to the backend | Learning features and preview enforcement | Distinguish on-device-only data from the backend preview counter |
| IP/connection data | No app-level IP logging was found; GoDaddy or network infrastructure may process connection details | Hosting and security | Verify whether this meets the store's "collected" definition and confirm GoDaddy log retention |
| Device ID, location, contacts, photos | No code or app permission for these was found | Not used by the app | Recheck the final native manifest and all bundled SDK disclosures |
| Analytics, ads, crash reports | No dedicated SDK was found in the frontend dependencies or app code inspected | Not used by the app | Recheck the release build and any newly added SDKs |

## Account deletion and sharing

- Users can delete their account from Settings. The backend removes the profile,
  entitlement, and stroke-preview records; the app clears local learning data.
- Payment records are retained for applicable obligations and have their
  account identifier randomized upon deletion; uncompleted orders are deleted.
- MSG91 receives phone numbers for OTP. Razorpay processes checkout and payment
  details. Supabase stores backend data. GoDaddy hosts the backend API.
- The app does not sell personal data or use an advertising SDK for tracking.

## Before store submission

1. Run the updated `backend/supabase/schema.sql` migration. It drops the legacy
   `user_deletion_audit` table and permanently deletes the profile snapshots
   stored there.
2. Confirm the release API uses HTTPS and the production backend has a strong
   `JWT_SECRET`.
3. Confirm the production GoDaddy access-log, backup, and retention settings.
4. Confirm what audio/transcript data Apple's and Google's speech services
   collect in the supported OS versions and device settings.
5. Resolve the lack of in-app age/guardian verification if minors in locations
   requiring parental consent will be allowed to register.
6. Confirm the payment-record retention schedule with an India-qualified
   accounting/legal adviser and arrange deletion or anonymization once records
   are no longer required.
