const BASE_URL = 'https://control.msg91.com/api/v5/widget';
const REQUEST_TIMEOUT_MS = 10000;

class Msg91Error extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'Msg91Error';
    this.code = code;
  }
}

function getConfig() {
  const authKey = (process.env.MSG91_AUTH_KEY || process.env.MSG91_AUTHKEY || '').trim();
  const tokenAuth = (process.env.MSG91_TOKEN_AUTH || process.env.MSG91_TOKENAUTH || '').trim();
  const widgetId = (process.env.MSG91_WIDGET_ID || '').trim();

  if (!authKey || !tokenAuth || !widgetId) {
    throw new Msg91Error('MSG91 OTP is not configured', 'NOT_CONFIGURED');
  }
  return { authKey, tokenAuth, widgetId };
}

function responseMessage(data, fallback) {
  const source = typeof data?.message === 'string' ? data : data?.data;
  const message = typeof source?.message === 'string' ? source.message.trim() : '';
  if (!message || message.length > 180) return fallback;
  return message.replace(/\+?\d{7,15}/g, (number) => `***${number.slice(-4)}`);
}

function messageIsRequestId(message) {
  return typeof message === 'string' && /^[a-zA-Z0-9_-]{8,}$/.test(message.trim());
}

function extractRequestId(data) {
  const candidates = [data, data?.data];
  for (const candidate of candidates) {
    const requestId = candidate?.reqId || candidate?.requestId || candidate?.request_id;
    if (typeof requestId === 'string' && requestId.trim()) return requestId.trim();
  }
  if (String(data?.type || '').toLowerCase() !== 'error' && messageIsRequestId(data?.message)) {
    return data.message.trim();
  }
  return null;
}

async function requestJson(path, payload) {
  const config = getConfig();
  const headers = { Accept: 'application/json' };
  let body;

  if (path === '/verifyAccessToken') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({ ...payload, authkey: config.authKey });
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(payload);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Msg91Error('Could not connect to MSG91', 'NETWORK');
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    if (response.ok) throw new Msg91Error('MSG91 returned an invalid response', 'INVALID_RESPONSE');
  }

  if (!response.ok) {
    const detail = responseMessage(data, `HTTP ${response.status}`);
    throw new Msg91Error(`MSG91 rejected the request: ${detail}`, 'PROVIDER_ERROR');
  }
  return data;
}

function isSuccessful(data) {
  return [data, data?.data].some((result) =>
    String(result?.type || '').toLowerCase() === 'success' ||
    String(result?.status || '').toLowerCase() === 'success' ||
    result?.success === true
  );
}

async function sendOtp(identifier) {
  const { tokenAuth, widgetId } = getConfig();
  const data = await requestJson('/sendOtpMobile', {
    widgetId,
    tokenAuth,
    identifier,
  });

  if (!isSuccessful(data)) {
    throw new Msg91Error(
      `MSG91 could not send the OTP: ${responseMessage(data, 'provider rejected the request')}`,
      'SEND_FAILED'
    );
  }
  const requestId = extractRequestId(data);
  if (!requestId) {
    throw new Msg91Error('MSG91 accepted the request but returned no OTP request ID', 'INVALID_RESPONSE');
  }
  return requestId;
}

async function verifyOtp(requestId, otp) {
  const { tokenAuth, widgetId } = getConfig();
  const data = await requestJson('/verifyOtp', {
    widgetId,
    tokenAuth,
    reqId: requestId,
    otp,
  });

  if (!isSuccessful(data)) {
    return {
      success: false,
      message: responseMessage(data, 'MSG91 rejected the OTP'),
    };
  }
  const resultData = data?.data && typeof data.data === 'object' ? data.data : data;
  const messageToken = typeof resultData?.message === 'string' &&
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(resultData.message)
    ? resultData.message
    : null;
  const accessToken = resultData?.['access-token'] ||
    resultData?.accessToken ||
    resultData?.access_token ||
    resultData?.token ||
    messageToken;
  if (!accessToken) {
    throw new Msg91Error('MSG91 did not return a verified access token', 'INVALID_RESPONSE');
  }
  return { success: true, accessToken };
}

async function verifyAccessToken(accessToken) {
  const data = await requestJson('/verifyAccessToken', { 'access-token': accessToken });
  if (!isSuccessful(data)) {
    throw new Msg91Error(
      `MSG91 access token verification failed: ${responseMessage(data, 'provider rejected the token')}`,
      'VERIFY_FAILED'
    );
  }
  const resultData = data?.data && typeof data.data === 'object' ? data.data : data;
  const identifier = resultData?.identifier ||
    resultData?.mobile ||
    resultData?.email ||
    resultData?.message;
  if (typeof identifier !== 'string' || !identifier.trim()) {
    throw new Msg91Error('MSG91 did not return the verified phone number', 'INVALID_RESPONSE');
  }
  return identifier;
}

module.exports = { sendOtp, verifyOtp, verifyAccessToken, Msg91Error };
