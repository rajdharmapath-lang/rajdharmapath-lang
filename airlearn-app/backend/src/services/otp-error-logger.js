const fs = require('node:fs/promises');
const path = require('node:path');
const logger = require('./logger');

const DEFAULT_LOG_PATH = path.join(__dirname, '..', '..', 'logs', 'otp-errors.log');

function maskPhone(dialCode, phone) {
  const digits = `${dialCode || ''}${phone || ''}`.replace(/\D/g, '');
  return digits ? `***${digits.slice(-4)}` : undefined;
}

function sanitizeMessage(message) {
  return logger.sanitizeMessage(message);
}

async function logOtpError(error, context) {
  const {
    event = 'otp_provider_error',
    stage,
    dialCode,
    phone,
    requestId,
    durationMs,
    statusCode,
  } = context;
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    stage,
    requestId,
    durationMs,
    statusCode,
    errorName: sanitizeMessage(error?.name || 'Error'),
    code: sanitizeMessage(error?.code || 'UNKNOWN'),
    providerStatus: Number.isInteger(error?.providerStatus) ? error.providerStatus : undefined,
    providerOperation: error?.providerOperation
      ? sanitizeMessage(error.providerOperation)
      : undefined,
    providerDurationMs: Number.isFinite(error?.providerDurationMs)
      ? error.providerDurationMs
      : undefined,
    providerCode: error?.providerCode ? sanitizeMessage(error.providerCode) : undefined,
    causeName: error?.causeName ? sanitizeMessage(error.causeName) : undefined,
    causeCode: error?.causeCode ? sanitizeMessage(error.causeCode) : undefined,
    message: sanitizeMessage(error?.message),
    phone: maskPhone(dialCode, phone),
  };

  logger.error(entry.event, { ...entry, module: 'auth' });
  const logPath = process.env.OTP_ERROR_LOG_PATH || DEFAULT_LOG_PATH;
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, `${JSON.stringify(entry)}\n`, { encoding: 'utf8', mode: 0o600 });
}

function logOtpEvent(event) {
  logger.info(event.event, {
    module: 'auth',
    stage: event.stage,
    requestId: event.requestId,
    durationMs: event.durationMs,
    statusCode: event.statusCode,
    code: event.code,
    providerStatus: event.providerStatus,
    providerOperation: event.providerOperation,
    providerDurationMs: event.providerDurationMs,
    causeName: event.causeName,
    causeCode: event.causeCode,
    phone: `${event.dialCode || ''}${event.phone || ''}`,
  });
}

module.exports = { logOtpError, logOtpEvent, sanitizeMessage, maskPhone };
