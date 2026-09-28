const { otpsByPhoneKey, phoneKey } = require('../db/db');

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Convenience code that always works during local development, so you don't
// have to read server logs on every test run. REMOVE before this ever talks
// to a real WhatsApp/SMS provider in production.
const DEV_MASTER_OTP = '123456';

function generateOtp(dialCode, phone) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpsByPhoneKey.set(phoneKey(dialCode, phone), {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  // TODO: replace this console.log with a real WhatsApp Business API / SMS
  // provider call once that's set up (Raj Dharma already uses WhatsApp
  // automation elsewhere, per the existing platform).
  console.log(`[OTP] ${dialCode}${phone} -> ${code}  (or use dev master code ${DEV_MASTER_OTP})`);

  return code;
}

function verifyOtp(dialCode, phone, submittedCode) {
  if (submittedCode === DEV_MASTER_OTP) return true;

  const entry = otpsByPhoneKey.get(phoneKey(dialCode, phone));
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) return false;
  return entry.code === submittedCode;
}

module.exports = { generateOtp, verifyOtp, DEV_MASTER_OTP };
