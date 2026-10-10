const msg91Client = require('./msg91.client');

function normalizePhone(dialCode, phone) {
  const countryDigits = String(dialCode || '').replace(/\D/g, '');
  const phoneDigits = String(phone || '').replace(/\D/g, '');
  const identifier = `${countryDigits}${phoneDigits}`;

  if (!countryDigits || phoneDigits.length < 6 || identifier.length < 8 || identifier.length > 15) {
    return null;
  }
  return identifier;
}

async function generateOtp(dialCode, phone) {
  const identifier = normalizePhone(dialCode, phone);
  if (!identifier) throw new Error('Invalid phone number');

  return msg91Client.sendOtp(identifier);
}

async function verifyOtp(dialCode, phone, submittedCode, requestId) {
  const identifier = normalizePhone(dialCode, phone);
  if (!identifier || !requestId) return false;

  const result = await msg91Client.verifyOtp(requestId, String(submittedCode));
  if (!result.success) return false;

  const verifiedIdentifier = await msg91Client.verifyAccessToken(result.accessToken);
  return verifiedIdentifier.replace(/\D/g, '') === identifier;
}

module.exports = { generateOtp, verifyOtp, normalizePhone };
