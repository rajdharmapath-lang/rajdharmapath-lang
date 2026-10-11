function sanitizeMessage(message) {
  return String(message ?? 'Unknown error')
    .replace(/\bBearer\s+\S+/gi, '******')
    .replace(/\b(authkey|tokenauth|access[-_ ]?token|password|passwd|secret|api[-_ ]?key)\s*[:=]\s*["']?[^,\s;"']+["']?/gi, '$1=[REDACTED]')
    .replace(/\b(otp|code)\s*=\s*["']?[^,\s;"']+["']?/gi, '$1=[REDACTED]')
    .replace(/\b(otp|code)\s*:\s*\d{4,8}\b/gi, '$1=[REDACTED]')
    .replace(/\b([a-z][a-z0-9+.-]*:\/\/)[^/\s:@]+:[^@\s/]+@/gi, '$1[REDACTED]@')
    .replace(/\b[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED_TOKEN]')
    .replace(/\b\d{6,}\b/g, (digits) => `***${digits.slice(-4)}`)
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, 500);
}

function safeFields(fields = {}) {
  return {
    module: fields.module ? sanitizeMessage(fields.module) : undefined,
    stage: fields.stage ? sanitizeMessage(fields.stage) : undefined,
    requestId: fields.requestId,
    method: fields.method ? sanitizeMessage(fields.method) : undefined,
    path: fields.path ? sanitizeMessage(fields.path) : undefined,
    port: Number.isFinite(Number(fields.port)) ? Number(fields.port) : undefined,
    statusCode: Number.isInteger(fields.statusCode) ? fields.statusCode : undefined,
    durationMs: Number.isFinite(fields.durationMs) ? fields.durationMs : undefined,
    code: fields.code ? sanitizeMessage(fields.code) : undefined,
    errorName: fields.errorName ? sanitizeMessage(fields.errorName) : undefined,
    message: fields.message ? sanitizeMessage(fields.message) : undefined,
    providerStatus: Number.isInteger(fields.providerStatus) ? fields.providerStatus : undefined,
    providerCode: fields.providerCode ? sanitizeMessage(fields.providerCode) : undefined,
    providerOperation: fields.providerOperation ? sanitizeMessage(fields.providerOperation) : undefined,
    providerDurationMs: Number.isFinite(fields.providerDurationMs)
      ? fields.providerDurationMs
      : undefined,
    causeName: fields.causeName ? sanitizeMessage(fields.causeName) : undefined,
    causeCode: fields.causeCode ? sanitizeMessage(fields.causeCode) : undefined,
    phone: fields.phone ? `***${String(fields.phone).replace(/\D/g, '').slice(-4)}` : undefined,
  };
}

function write(level, event, fields) {
  const record = {
    timestamp: new Date().toISOString(),
    event: sanitizeMessage(event),
    ...safeFields(fields),
  };
  const details = Object.entries(record)
    .filter(([key, value]) => key !== 'event' && value !== undefined)
    .map(([key, value]) => `${key}: ${sanitizeMessage(value)}`)
    .join(' | ');
  console[level](`[${level.toUpperCase()}] ${record.event}${details ? ` | ${details}` : ''}`);
}

function info(event, fields) {
  write('info', event, fields);
}

function error(event, fields = {}) {
  const cause = fields.error;
  write('error', event, {
    ...fields,
    code: fields.code || cause?.code || cause?.error?.code,
    errorName: fields.errorName || cause?.name,
    message: fields.message || cause?.message,
    providerStatus: fields.providerStatus || cause?.providerStatus || cause?.statusCode,
    providerCode: fields.providerCode || cause?.providerCode,
    providerOperation: fields.providerOperation || cause?.providerOperation,
    providerDurationMs: fields.providerDurationMs ?? cause?.providerDurationMs,
    causeName: fields.causeName || cause?.causeName,
    causeCode: fields.causeCode || cause?.causeCode,
  });
}

module.exports = { info, error, sanitizeMessage };
