const jwt = require('jsonwebtoken');
const msg91Client = require('./msg91.client');
const { JWT_SECRET } = require('../middleware/auth.middleware');

const OTP_REQUEST_PURPOSE = 'msg91_otp_request';

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

  const providerRequestId = await msg91Client.sendOtp(identifier);
  return jwt.sign(
    { purpose: OTP_REQUEST_PURPOSE, identifier, providerRequestId },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
}

function readOtpRequestToken(requestToken, identifier) {
  if (!requestToken) return null;
  try {
    const claims = jwt.verify(requestToken, JWT_SECRET);
    if (
      claims.purpose !== OTP_REQUEST_PURPOSE ||
      (identifier && claims.identifier !== identifier) ||
      typeof claims.providerRequestId !== 'string' ||
      !claims.providerRequestId
    ) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

async function retryOtp(dialCode, phone, requestToken, retryChannel) {
  const identifier = normalizePhone(dialCode, phone);
  const claims = readOtpRequestToken(requestToken, identifier);
  if (!identifier || !claims) return false;

  await msg91Client.retryOtp(claims.providerRequestId, retryChannel);
  return true;
}

async function verifyOtp(dialCode, phone, submittedCode, requestId) {
  const identifier = normalizePhone(dialCode, phone);
  const claims = readOtpRequestToken(requestId, identifier);
  if (!identifier || !claims) return false;

  return msg91Client.verifyOtp(claims.providerRequestId, String(submittedCode));
}

module.exports = { generateOtp, retryOtp, verifyOtp, normalizePhone };
