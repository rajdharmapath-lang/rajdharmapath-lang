const userRepository = require('../db/user.repository');
const otpService = require('../services/otp.service');
const otpErrorLogger = require('../services/otp-error-logger');
const { issueToken } = require('../middleware/auth.middleware');

async function recordOtpError(error, context) {
  try {
    await otpErrorLogger.logOtpError(error, context);
  } catch (loggingError) {
    console.error('Could not write OTP error log:', loggingError.message);
  }
  console.error(`OTP ${context.stage} failed:`, error.code || error.name);
}

async function sendOtp(req, res) {
  const { phone, dialCode } = req.body;
  if (!phone || !dialCode) {
    return res.status(400).json({ message: 'phone and dialCode are required' });
  }
  if (!otpService.normalizePhone(dialCode, phone)) {
    return res.status(400).json({ message: 'Enter a valid phone number.' });
  }
  try {
    const reqId = await otpService.generateOtp(dialCode, phone);
    return res.json({ success: true, reqId });
  } catch (error) {
    await recordOtpError(error, { stage: 'send', dialCode, phone });
    if (error.code === 'NOT_CONFIGURED') {
      return res.status(503).json({ message: 'OTP delivery is not configured.' });
    }
    return res.status(502).json({
      message: error.message || 'Could not send a verification code. Please try again.',
    });
  }
}

async function verifyOtpHandler(req, res) {
  const { phone, dialCode, code, reqId } = req.body;
  if (!phone || !dialCode || !code || !reqId) {
    return res.status(400).json({ message: 'phone, dialCode, code and reqId are required' });
  }

  let isValid;
  try {
    isValid = await otpService.verifyOtp(dialCode, phone, code, reqId);
  } catch (error) {
    await recordOtpError(error, { stage: 'verify', dialCode, phone });
    if (error.code === 'NOT_CONFIGURED') {
      return res.status(503).json({ message: 'OTP delivery is not configured.' });
    }
    return res.status(502).json({ message: 'Could not verify the code. Please try again.' });
  }
  if (!isValid) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  let user;
  let isNewUser;
  try {
    const result = await userRepository.getOrCreateUserByPhone(dialCode, phone);
    user = result.user;
    isNewUser = result.created || !user.name || !user.email || !user.occupation;
  } catch (error) {
    console.error('OTP account database lookup failed:', error);
    return res.status(503).json({ message: 'Could not load your account from the database.' });
  }

  const token = issueToken(user.id);

  res.json({
    token,
    isNewUser,
    user: isNewUser ? null : user,
  });
}

module.exports = { sendOtp, verifyOtp: verifyOtpHandler };
