const fs = require('node:fs/promises');
const path = require('node:path');

const DEFAULT_LOG_PATH = path.join(__dirname, '..', '..', 'logs', 'otp-errors.log');

function maskPhone(dialCode, phone) {
  const digits = `${dialCode || ''}${phone || ''}`.replace(/\D/g, '');
  return digits ? `***${digits.slice(-4)}` : undefined;
}

function sanitizeMessage(message) {
  return String(message || 'Unknown OTP error')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/\b(authkey|tokenauth|access[-_ ]?token|otp|code)\s*[:=]\s*\S+/gi, '$1=[REDACTED]')
    .replace(/\b[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED_TOKEN]')
    .replace(/\b\d{6,}\b/g, (digits) => `***${digits.slice(-4)}`)
    .slice(0, 500);
}

async function logOtpError(error, { stage, dialCode, phone }) {
  const logPath = process.env.OTP_ERROR_LOG_PATH || DEFAULT_LOG_PATH;
  const entry = {
    timestamp: new Date().toISOString(),
    event: 'otp_provider_error',
    stage,
    code: error?.code || error?.name || 'UNKNOWN',
    message: sanitizeMessage(error?.message),
    phone: maskPhone(dialCode, phone),
  };

  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, `${JSON.stringify(entry)}\n`, { encoding: 'utf8', mode: 0o600 });
}

module.exports = { logOtpError, sanitizeMessage, maskPhone };
