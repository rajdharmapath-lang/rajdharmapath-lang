const test = require('node:test');
const assert = require('node:assert/strict');
const msg91Client = require('../src/services/msg91.client');

const originalFetch = global.fetch;
const originalEnv = {
  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY,
  MSG91_TOKEN_AUTH: process.env.MSG91_TOKEN_AUTH,
  MSG91_WIDGET_ID: process.env.MSG91_WIDGET_ID,
};

test.beforeEach(() => {
  process.env.MSG91_AUTH_KEY = 'test-auth-key';
  process.env.MSG91_TOKEN_AUTH = 'test-token-auth';
  process.env.MSG91_WIDGET_ID = 'test-widget';
});

test.afterEach(() => {
  global.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('sendOtp uses the MSG91 widget and returns the provider request id', async () => {
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return Response.json({ type: 'success', message: 'request-123' });
  };

  assert.equal(await msg91Client.sendOtp('919876543210'), 'request-123');
  assert.equal(request.url, 'https://control.msg91.com/api/v5/widget/sendOtpMobile');
  assert.deepEqual(JSON.parse(request.options.body), {
    widgetId: 'test-widget',
    tokenAuth: 'test-token-auth',
    identifier: '919876543210',
  });
});

test('sendOtp accepts a nested request ID from the widget response', async () => {
  global.fetch = async () => Response.json({
    type: 'success',
    data: { request_id: 'nested-request-123' },
    message: 'OTP sent successfully',
  });

  assert.equal(await msg91Client.sendOtp('919876543210'), 'nested-request-123');
});

test('sendOtp reports the safe MSG91 rejection instead of hiding it', async () => {
  global.fetch = async () => Response.json({
    type: 'error',
    code: 401,
    message: 'AuthenticationFailure',
  }, { status: 401 });

  await assert.rejects(
    msg91Client.sendOtp('919876543210'),
    (error) => error.code === 'PROVIDER_ERROR' &&
      error.message === 'MSG91 rejected the request: AuthenticationFailure'
  );
});

test('sendOtp rejects a success response when the message is not a request ID', async () => {
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

test('verifyOtp returns the access token only when MSG91 accepts the code', async () => {
  global.fetch = async () => Response.json({ type: 'success', 'access-token': 'verified-token' });

  assert.deepEqual(await msg91Client.verifyOtp('request-123', '654321'), {
    success: true,
    accessToken: 'verified-token',
  });

  global.fetch = async () => Response.json({ type: 'error', message: 'invalid OTP' });
  assert.deepEqual(await msg91Client.verifyOtp('request-123', '000000'), {
    success: false,
    message: 'invalid OTP',
  });
});

test('verifyAccessToken sends the JSON payload MSG91 requires and returns the verified identifier', async () => {
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return Response.json({ type: 'success', message: '919876543210' });
  };

  assert.equal(await msg91Client.verifyAccessToken('verified-token'), '919876543210');
  assert.equal(request.url, 'https://control.msg91.com/api/v5/widget/verifyAccessToken');
  assert.equal(request.options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(request.options.body), {
    'access-token': 'verified-token',
    authkey: 'test-auth-key',
  });
});

test('MSG91 requests fail explicitly when the widget token is missing', async () => {
  delete process.env.MSG91_TOKEN_AUTH;
  await assert.rejects(
    msg91Client.sendOtp('919876543210'),
    (error) => error.code === 'NOT_CONFIGURED'
  );
});
