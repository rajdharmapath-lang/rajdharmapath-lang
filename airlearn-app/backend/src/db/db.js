// OTP challenges are temporary; user profiles and payment records live in Supabase.
const otpsByPhoneKey = new Map(); // key -> { code, expiresAt }

function phoneKey(dialCode, phone) {
  return `${dialCode}${phone}`;
}

module.exports = {
  otpsByPhoneKey,
  phoneKey,
};
