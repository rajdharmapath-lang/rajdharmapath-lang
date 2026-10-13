const test = require('node:test');
const { mock } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const otpService = require('../src/services/otp.service');
const otpErrorLogger = require('../src/services/otp-error-logger');
const { sendOtp, retryOtp, verifyOtp } = require('../src/controllers/auth.controller');
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
  mock.method(otpErrorLogger, 'logOtpEvent', () => {});
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
  const errorLogStub = mock.method(otpErrorLogger, 'logOtpError', async () => {});
  mock.method(otpErrorLogger, 'logOtpEvent', () => {});
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
    assert.equal(errorLogStub.mock.calls.length, 1);
    assert.equal(errorLogStub.mock.calls[0].arguments[1].event, 'otp_account_lookup_failed');
    assert.equal(errorLogStub.mock.calls[0].arguments[1].stage, 'account_lookup');
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
  mock.method(otpErrorLogger, 'logOtpEvent', () => {});
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

  test('retryOtp invokes the provider retry operation for the pending request', async () => {
    const retryStub = mock.method(otpService, 'retryOtp', async () => true);
    mock.method(otpErrorLogger, 'logOtpEvent', () => {});
    let statusCode;
    let responseBody;

    try {
      await retryOtp(
        { body: { phone: '5550100', dialCode: '+1', reqId: 'signed-request-token' } },
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

      assert.deepEqual(retryStub.mock.calls[0].arguments, [
        '+1',
        '5550100',
        'signed-request-token',
        undefined,
      ]);
      assert.equal(statusCode, undefined);
      assert.deepEqual(responseBody, { success: true });
    } finally {
      mock.restoreAll();
    }
  });
  const otpLogStub = mock.method(otpErrorLogger, 'logOtpError', async () => {});
  mock.method(otpErrorLogger, 'logOtpEvent', () => {});
  let statusCode;
  let responseBody;
  let requestIdHeader;

  try {
    await sendOtp(
      {
        body: { phone: '5550100', dialCode: '+1' },
      },
      {
        setHeader(name, value) {
          if (name === 'X-Request-ID') requestIdHeader = value;
        },
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
    const loggedContext = otpLogStub.mock.calls[0].arguments[1];
    assert.equal(loggedContext.stage, 'send');
    assert.equal(loggedContext.dialCode, '+1');
    assert.equal(loggedContext.phone, '5550100');
    assert.equal(loggedContext.statusCode, 502);
    assert.equal(loggedContext.requestId, requestIdHeader);
    assert.match(requestIdHeader, /^[0-9a-f-]{36}$/);
  } finally {
    mock.restoreAll();
  }
});

test('verifyOtp returns a sanitized provider error to the client', async () => {
  const providerError = new Error('MSG91 rejected the request: invalid OTP=123456');
  providerError.code = 'PROVIDER_ERROR';
  mock.method(otpService, 'verifyOtp', async () => {
    throw providerError;
  });
  mock.method(otpErrorLogger, 'logOtpError', async () => {});
  mock.method(otpErrorLogger, 'logOtpEvent', () => {});
  let statusCode;
  let responseBody;

  try {
    await verifyOtp(
      { body: { phone: '5550100', dialCode: '+1', code: '123456', reqId: 'request-123' } },
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
      message: 'MSG91 rejected the request: invalid OTP=[REDACTED]',
    });
  } finally {
    mock.restoreAll();
  }
});