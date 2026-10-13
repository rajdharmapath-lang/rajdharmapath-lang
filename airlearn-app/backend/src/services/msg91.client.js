const BASE_URL = 'https://api.msg91.com/api/v5/widget';
const REQUEST_TIMEOUT_MS = 10000;

class Msg91Error extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'Msg91Error';
    this.code = code;
    Object.assign(this, details);
  }
}

function getConfig() {
  const authKey = (process.env.MSG91_AUTH_KEY || process.env.MSG91_AUTHKEY || '').trim();
  const widgetId = (process.env.MSG91_WIDGET_ID || '').trim();

  if (!authKey || !widgetId) {
    throw new Msg91Error('MSG91 OTP is not configured', 'NOT_CONFIGURED');
  }
  return { authKey, widgetId };
}

function getResultData(data) {
  return data?.data && typeof data.data === 'object' ? data.data : data;
}

function responseMessage(data, fallback) {
  const source = [getResultData(data), data].find((result) =>
    typeof result?.message === 'string'
  );
  const message = typeof source?.message === 'string' ? source.message.trim() : '';
  if (!message || message.length > 180) return fallback;
  return message.replace(/\+?\d{7,15}/g, (number) => `***${number.slice(-4)}`);
}

function isSuccessful(data) {
  return [data, getResultData(data)].some((result) =>
    String(result?.type || '').toLowerCase() === 'success' ||
    String(result?.status || '').toLowerCase() === 'success' ||
    result?.success === true
  );
}

function extractRequestId(data) {
  const candidates = [data, getResultData(data)];
  for (const candidate of candidates) {
    const requestId = candidate?.reqId || candidate?.requestId || candidate?.request_id;
    if (typeof requestId === 'string' && requestId.trim()) return requestId.trim();
  }
  for (const candidate of candidates) {
    const message = candidate?.message;
    const type = String(candidate?.type || data?.type || '').toLowerCase();
    if (
      type !== 'error' &&
      typeof message === 'string' &&
      /^[a-zA-Z0-9_-]{8,}$/.test(message.trim())
    ) {
      return message.trim();
    }
  }
  return null;
}

async function requestJson(path, payload) {
  const startedAt = Date.now();
  const { authKey } = getConfig();
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        authkey: authKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Msg91Error('Could not connect to MSG91', 'NETWORK', {
      causeName: error?.name,
      causeCode: error?.cause?.code || error?.code,
      providerOperation: path,
      providerDurationMs: Date.now() - startedAt,
    });
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    if (response.ok) {
      throw new Msg91Error('MSG91 returned an invalid response', 'INVALID_RESPONSE', {
        providerStatus: response.status,
        providerOperation: path,
        providerDurationMs: Date.now() - startedAt,
      });
    }
  }

  if (!response.ok) {
    throw new Msg91Error(
      `MSG91 rejected the request: ${responseMessage(data, `HTTP ${response.status}`)}`,
      'PROVIDER_ERROR',
      {
        providerStatus: response.status,
        providerCode: getResultData(data)?.code ?? data?.code,
        providerOperation: path,
        providerDurationMs: Date.now() - startedAt,
      }
    );
  }

  return { data, providerStatus: response.status, durationMs: Date.now() - startedAt };
}

function assertProviderSuccess(data, operation, providerPath, providerStatus, providerDurationMs) {
  if (!isSuccessful(data)) {
    throw new Msg91Error(
      `MSG91 could not ${operation}: ${responseMessage(data, 'provider rejected the request')}`,
      'PROVIDER_REJECTED',
      {
        providerStatus,
        providerCode: getResultData(data)?.code ?? data?.code,
        providerOperation: providerPath,
        providerDurationMs,
      }
    );
  }
}

async function sendOtp(identifier) {
  const { widgetId } = getConfig();
  const result = await requestJson('/sendOtp', { widgetId, identifier });
  assertProviderSuccess(
    result.data,
    'send the OTP',
    '/sendOtp',
    result.providerStatus,
    result.durationMs
  );

  const requestId = extractRequestId(result.data);
  if (!requestId) {
    throw new Msg91Error('MSG91 accepted the request but returned no OTP request ID', 'INVALID_RESPONSE', {
      providerStatus: result.providerStatus,
      providerOperation: '/sendOtp',
      providerDurationMs: result.durationMs,
    });
  }
  return requestId;
}

async function retryOtp(requestId, retryChannel) {
  const { widgetId } = getConfig();
  const payload = { widgetId, reqId: requestId };
  if (retryChannel) payload.retryChannel = retryChannel;
  const result = await requestJson('/retryOtp', payload);
  assertProviderSuccess(
    result.data,
    'retry the OTP',
    '/retryOtp',
    result.providerStatus,
    result.durationMs
  );
  return true;
}

async function verifyOtp(requestId, otp) {
  const { widgetId } = getConfig();
  const result = await requestJson('/verifyOtp', {
    widgetId,
    reqId: requestId,
    otp,
  });
  return isSuccessful(result.data);
}

module.exports = { sendOtp, retryOtp, verifyOtp, Msg91Error };
