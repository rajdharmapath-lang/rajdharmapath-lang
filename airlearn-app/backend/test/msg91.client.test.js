const test = require('node:test');
const assert = require('node:assert/strict');
const msg91Client = require('../src/services/msg91.client');

const originalFetch = global.fetch;
const originalEnv = {
  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY,
  MSG91_WIDGET_ID: process.env.MSG91_WIDGET_ID,
};

test.beforeEach(() => {
  process.env.MSG91_AUTH_KEY = 'test-auth-key';
  process.env.MSG91_WIDGET_ID = 'test-widget';
});

test.afterEach(() => {
  global.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('sendOtp uses the documented MSG91 endpoint, auth header and payload', async () => {
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return Response.json({ type: 'success', message: 'OTP sent', reqId: 'request-123' });
  };

  assert.equal(await msg91Client.sendOtp('919876543210'), 'request-123');
  assert.equal(request.url, 'https://api.msg91.com/api/v5/widget/sendOtp');
  assert.equal(request.options.headers.authkey, 'test-auth-key');
  assert.deepEqual(JSON.parse(request.options.body), {
    widgetId: 'test-widget',
    identifier: '919876543210',
  });
});

test('sendOtp extracts a nested request ID', async () => {
  global.fetch = async () => Response.json({
    type: 'success',
    data: { request_id: 'nested-request-123' },
  });

  assert.equal(await msg91Client.sendOtp('919876543210'), 'nested-request-123');
});

test('sendOtp extracts a request ID returned in the success message', async () => {
  global.fetch = async () => Response.json({
    type: 'success',
    message: 'request-123456',
  });

  assert.equal(await msg91Client.sendOtp('919876543210'), 'request-123456');
});

test('sendOtp preserves safe provider rejection details from a successful HTTP response', async () => {
  global.fetch = async () => Response.json({
    type: 'error',
    data: {
      code: 'TEMPLATE_NOT_APPROVED',
      message: 'Template is not approved for this route',
    },
  });

  await assert.rejects(
    msg91Client.sendOtp('919876543210'),
    (error) => error.code === 'PROVIDER_REJECTED' &&
      error.providerStatus === 200 &&
      error.providerCode === 'TEMPLATE_NOT_APPROVED' &&
      error.message === 'MSG91 could not send the OTP: Template is not approved for this route'
  );
});

test('retryOtp uses the documented endpoint and includes an optional retry channel', async () => {
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return Response.json({ type: 'success', message: 'OTP resent' });
  };

  assert.equal(await msg91Client.retryOtp('request-123', '4'), true);
  assert.equal(request.url, 'https://api.msg91.com/api/v5/widget/retryOtp');
  assert.equal(request.options.headers.authkey, 'test-auth-key');
  assert.deepEqual(JSON.parse(request.options.body), {
    widgetId: 'test-widget',
    reqId: 'request-123',
    retryChannel: '4',
  });
});

test('retryOtp omits retryChannel when it is not specified', async () => {
  let payload;
  global.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return Response.json({ type: 'success' });
  };

  await msg91Client.retryOtp('request-123');
  assert.deepEqual(payload, { widgetId: 'test-widget', reqId: 'request-123' });
});

test('MSG91 HTTP errors retain safe provider status and code', async () => {
  global.fetch = async () => Response.json({
    type: 'error',
    code: 'AUTH_FAILED',
    message: 'AuthenticationFailure',
  }, { status: 401 });

  await assert.rejects(
    msg91Client.sendOtp('919876543210'),
    (error) => error.code === 'PROVIDER_ERROR' &&
      error.message === 'MSG91 rejected the request: AuthenticationFailure' &&
      error.providerStatus === 401 &&
      error.providerCode === 'AUTH_FAILED' &&
      error.providerOperation === '/sendOtp'
  );
});

test('network failures retain safe DNS/timeout diagnostics without exposing cause messages', async () => {
  const networkError = new Error('request failed with private request details', {
    cause: Object.assign(new Error('private network details'), { code: 'ECONNRESET' }),
  });
  global.fetch = async () => {
    throw networkError;
  };

  await assert.rejects(
    msg91Client.sendOtp('919876543210'),
    (error) => error.code === 'NETWORK' &&
      error.causeCode === 'ECONNRESET' &&
      error.providerOperation === '/sendOtp' &&
      error.providerDurationMs >= 0 &&
      !error.message.includes('private')
  );
});

test('sendOtp rejects a success response without a request ID', async () => {
  global.fetch = async () => Response.json({
    type: 'success',
    message: 'OTP sent successfully',
  });

  await assert.rejects(
    msg91Client.sendOtp('919876543210'),
    (error) => error.code === 'INVALID_RESPONSE' &&
      error.message === 'MSG91 accepted the request but returned no OTP request ID'
  );
});

test('verifyOtp sends the documented body and returns the provider verification result', async () => {
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return Response.json({ type: 'success', message: 'OTP verified successfully' });
  };

  assert.equal(await msg91Client.verifyOtp('request-123', '654321'), true);
  assert.equal(request.url, 'https://api.msg91.com/api/v5/widget/verifyOtp');
  assert.equal(request.options.headers.authkey, 'test-auth-key');
  assert.deepEqual(JSON.parse(request.options.body), {
    widgetId: 'test-widget',
    reqId: 'request-123',
    otp: '654321',
  });

  global.fetch = async () => Response.json({ type: 'error', message: 'Invalid OTP' });
  assert.equal(await msg91Client.verifyOtp('request-123', '000000'), false);
});

test('MSG91 requests fail explicitly when auth key or widget ID is missing', async () => {
  delete process.env.MSG91_AUTH_KEY;
  await assert.rejects(
    msg91Client.sendOtp('919876543210'),
    (error) => error.code === 'NOT_CONFIGURED'
  );

  process.env.MSG91_AUTH_KEY = 'test-auth-key';
  delete process.env.MSG91_WIDGET_ID;
  await assert.rejects(
    msg91Client.sendOtp('919876543210'),
    (error) => error.code === 'NOT_CONFIGURED'
  );
});
