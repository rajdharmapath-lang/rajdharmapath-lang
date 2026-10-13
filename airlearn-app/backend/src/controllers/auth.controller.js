const { randomUUID } = require('node:crypto');
const userRepository = require('../db/user.repository');
const otpService = require('../services/otp.service');
const otpErrorLogger = require('../services/otp-error-logger');
const logger = require('../services/logger');
const { issueToken } = require('../middleware/auth.middleware');

function createRequestContext(req, res, stage) {
  const requestId = req.requestId || randomUUID();
  if (typeof res.setHeader === 'function') res.setHeader('X-Request-ID', requestId);
  return {
    stage,
    requestId,
    startedAt: Date.now(),
    dialCode: req.body?.dialCode,
    phone: req.body?.phone,
  };
}

function logRequestEvent(context, event, extra = {}) {
  otpErrorLogger.logOtpEvent({
    event,
    stage: context.stage,
    requestId: context.requestId,
    durationMs: Date.now() - context.startedAt,
    dialCode: context.dialCode,
    phone: context.phone,
    ...extra,
  });
}

async function recordOtpError(error, context) {
  try {
    await otpErrorLogger.logOtpError(error, context);
  } catch (loggingError) {
    logger.error('otp_error_log_write_failed', {
      module: 'auth',
      requestId: context.requestId,
      error: loggingError,
    });
  }
}

async function sendOtp(req, res) {
  const { phone, dialCode } = req.body;
  const context = createRequestContext(req, res, 'send');
  logRequestEvent(context, 'otp_request_received');
  if (!phone || !dialCode) {
    logRequestEvent(context, 'otp_request_rejected', { code: 'MISSING_FIELDS', statusCode: 400 });
    return res.status(400).json({ message: 'phone and dialCode are required' });
  }
  if (!otpService.normalizePhone(dialCode, phone)) {
    logRequestEvent(context, 'otp_request_rejected', { code: 'INVALID_PHONE', statusCode: 400 });
    return res.status(400).json({ message: 'Enter a valid phone number.' });
  }
  try {
    const reqId = await otpService.generateOtp(dialCode, phone);
    logRequestEvent(context, 'otp_request_succeeded', { statusCode: 200 });
    return res.json({ success: true, reqId });
  } catch (error) {
    await recordOtpError(error, { ...context, statusCode: error.code === 'NOT_CONFIGURED' ? 503 : 502 });
    if (error.code === 'NOT_CONFIGURED') {
      return res.status(503).json({ message: 'OTP delivery is not configured.' });
    }
    return res.status(502).json({
      message: error.message || 'Could not send a verification code. Please try again.',
    });
  }
}

async function retryOtp(req, res) {
  const { phone, dialCode, reqId, retryChannel } = req.body;
  const context = createRequestContext(req, res, 'retry');
  logRequestEvent(context, 'otp_retry_received');
  if (!phone || !dialCode || !reqId) {
    logRequestEvent(context, 'otp_request_rejected', { code: 'MISSING_FIELDS', statusCode: 400 });
    return res.status(400).json({ message: 'phone, dialCode and reqId are required' });
  }
  if (!otpService.normalizePhone(dialCode, phone)) {
    logRequestEvent(context, 'otp_request_rejected', { code: 'INVALID_PHONE', statusCode: 400 });
    return res.status(400).json({ message: 'Enter a valid phone number.' });
  }
  if (retryChannel !== undefined && (typeof retryChannel !== 'string' || retryChannel.length > 50)) {
    logRequestEvent(context, 'otp_request_rejected', { code: 'INVALID_RETRY_CHANNEL', statusCode: 400 });
    return res.status(400).json({ message: 'Invalid retry channel.' });
  }

  try {
    const retried = await otpService.retryOtp(dialCode, phone, reqId, retryChannel);
    if (!retried) {
      logRequestEvent(context, 'otp_retry_rejected', { code: 'INVALID_OR_EXPIRED_REQUEST', statusCode: 400 });
      return res.status(400).json({ message: 'OTP request is invalid or expired. Request a new code.' });
    }
    logRequestEvent(context, 'otp_retry_succeeded', { statusCode: 200 });
    return res.json({ success: true });
  } catch (error) {
    await recordOtpError(error, { ...context, statusCode: error.code === 'NOT_CONFIGURED' ? 503 : 502 });
    if (error.code === 'NOT_CONFIGURED') {
      return res.status(503).json({ message: 'OTP delivery is not configured.' });
    }
    return res.status(502).json({
      message: error.message || 'Could not resend the verification code. Please try again.',
    });
  }
}

async function verifyOtpHandler(req, res) {
  const { phone, dialCode, code, reqId } = req.body;
  const context = createRequestContext(req, res, 'verify');
  logRequestEvent(context, 'otp_verification_received');
  if (!phone || !dialCode || !code || !reqId) {
    logRequestEvent(context, 'otp_request_rejected', { code: 'MISSING_FIELDS', statusCode: 400 });
    return res.status(400).json({ message: 'phone, dialCode, code and reqId are required' });
  }

  let isValid;
  try {
    isValid = await otpService.verifyOtp(dialCode, phone, code, reqId);
  } catch (error) {
    await recordOtpError(error, { ...context, statusCode: error.code === 'NOT_CONFIGURED' ? 503 : 502 });
    if (error.code === 'NOT_CONFIGURED') {
      return res.status(503).json({ message: 'OTP delivery is not configured.' });
    }
    return res.status(502).json({
      message: otpErrorLogger.sanitizeMessage(
        error.message || 'Could not verify the code. Please try again.'
      ),
    });
  }
  if (!isValid) {
    logRequestEvent(context, 'otp_verification_rejected', { statusCode: 400 });
    return res.status(400).json({ message: 'Invalid or expired code' });
  }
  logRequestEvent(context, 'otp_verification_succeeded', { statusCode: 200 });

  let user;
  let isNewUser;
  try {
    const result = await userRepository.getOrCreateUserByPhone(dialCode, phone);
    user = result.user;
    isNewUser = result.created || !user.name || !user.email || !user.occupation;
  } catch (error) {
    await recordOtpError(error, {
      ...context,
      event: 'otp_account_lookup_failed',
      stage: 'account_lookup',
      statusCode: 503,
    });
    return res.status(503).json({ message: 'Could not load your account from the database.' });
  }

  const token = issueToken(user.id);

  res.json({
    token,
    isNewUser,
    user: isNewUser ? null : user,
  });
}

module.exports = { sendOtp, retryOtp, verifyOtp: verifyOtpHandler };
