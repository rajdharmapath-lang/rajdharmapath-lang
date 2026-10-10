const test = require('node:test');
const { mock } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const otpService = require('../src/services/otp.service');
const otpErrorLogger = require('../src/services/otp-error-logger');
const { sendOtp, verifyOtp } = require('../src/controllers/auth.controller');
const userRepository = require('../src/db/user.repository');
const { JWT_SECRET } = require('../src/middleware/auth.middleware');

test('verifyOtp stores the verified phone identity through the user repository', async () => {
  const user = {
    id: 'user-supabase-uuid',
    phone: '5550100',
    dialCode: '+1',
    name: null,
    email: null,
    occupation: null,
    language: null,
  };
  const createUserStub = mock.method(userRepository, 'getOrCreateUserByPhone', async () => ({
    user,
    created: true,
  }));
  const verifyStub = mock.method(otpService, 'verifyOtp', async () => true);
  let responseBody;

  try {
    await verifyOtp(
      { body: { phone: user.phone, dialCode: user.dialCode, code: '654321', reqId: 'request-123' } },
      {
        status() {
          return this;
        },
        json(body) {
          responseBody = body;
        },
      }
    );

    assert.equal(createUserStub.mock.calls.length, 1);
    assert.deepEqual(createUserStub.mock.calls[0].arguments, [user.dialCode, user.phone]);
    assert.deepEqual(verifyStub.mock.calls[0].arguments, [user.dialCode, user.phone, '654321', 'request-123']);
    assert.equal(responseBody.isNewUser, true);
    assert.equal(responseBody.user, null);
    assert.equal(jwt.verify(responseBody.token, JWT_SECRET).userId, user.id);
  } finally {
    mock.restoreAll();
  }
});

test('verifyOtp returns a service error when the database lookup fails', async () => {
  const databaseError = new Error('database unavailable');
  databaseError.code = 'ECONNREFUSED';
  const lookupStub = mock.method(userRepository, 'getOrCreateUserByPhone', async () => {
    throw databaseError;
  });
  mock.method(otpService, 'verifyOtp', async () => true);
  const logStub = mock.method(console, 'error', () => {});
  let statusCode;
  let responseBody;

  try {
    await verifyOtp(
      { body: { phone: '5550100', dialCode: '+1', code: '654321', reqId: 'request-123' } },
      {
        status(code) {
          statusCode = code;
          return this;
        },
        json(body) {
          responseBody = body;
        },
      }
    );

    assert.equal(lookupStub.mock.calls.length, 1);
    assert.equal(statusCode, 503);
    assert.deepEqual(responseBody, { message: 'Could not load your account from the database.' });
    assert.deepEqual(logStub.mock.calls[0].arguments, [
      'OTP account database lookup failed:',
      databaseError,
    ]);
  } finally {
    mock.restoreAll();
  }
});

test('sendOtp returns service unavailable when MSG91 is not configured', async () => {
  mock.method(otpService, 'generateOtp', async () => {
    const error = new Error('MSG91 OTP is not configured');
    error.code = 'NOT_CONFIGURED';
    throw error;
  });
  let statusCode;
  let responseBody;

  try {
    await sendOtp(
      { body: { phone: '5550100', dialCode: '+1' } },
      {
        status(code) {
          statusCode = code;
          return this;
        },
        json(body) {
          responseBody = body;
        },
      }
    );
    assert.equal(statusCode, 503);
    assert.deepEqual(responseBody, { message: 'OTP delivery is not configured.' });
  } finally {
    mock.restoreAll();
  }
});

test('sendOtp returns the provider rejection so the client can show actionable feedback', async () => {
  mock.method(otpService, 'generateOtp', async () => {
    const error = new Error('MSG91 rejected the request: AuthenticationFailure');
    error.code = 'PROVIDER_ERROR';
    throw error;
  });
  const logStub = mock.method(console, 'error', () => {});
  const otpLogStub = mock.method(otpErrorLogger, 'logOtpError', async () => {});
  let statusCode;
  let responseBody;

  try {
    await sendOtp(
      { body: { phone: '5550100', dialCode: '+1' } },
      {
        status(code) {
          statusCode = code;
          return this;
        },
        json(body) {
          responseBody = body;
        },
      }
    );
    assert.equal(statusCode, 502);
    assert.deepEqual(responseBody, {
      message: 'MSG91 rejected the request: AuthenticationFailure',
    });
    assert.equal(logStub.mock.calls.length, 1);
    assert.deepEqual(otpLogStub.mock.calls[0].arguments[1], {
      stage: 'send',
      dialCode: '+1',
      phone: '5550100',
    });
  } finally {
    mock.restoreAll();
  }
});