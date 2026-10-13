const test = require('node:test');
const { mock } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const msg91Client = require('../src/services/msg91.client');
const otpService = require('../src/services/otp.service');
const { JWT_SECRET } = require('../src/middleware/auth.middleware');

test('normalizes the country code and phone number to an MSG91 identifier', () => {
  assert.equal(otpService.normalizePhone('+91', '98765 43210'), '919876543210');
  assert.equal(otpService.normalizePhone('', '9876543210'), null);
  assert.equal(otpService.normalizePhone('+91', '123'), null);
});

test('OTP request tokens bind verification and retries to the phone number', async () => {
  const phone = `555${String(Date.now()).slice(-7)}`;
  const sendStub = mock.method(msg91Client, 'sendOtp', async () => 'request-bound-to-phone');
  const retryStub = mock.method(msg91Client, 'retryOtp', async () => true);
  const verifyStub = mock.method(msg91Client, 'verifyOtp', async () => true);

  try {
    const requestToken = await otpService.generateOtp('+1', phone);
    const claims = jwt.verify(requestToken, JWT_SECRET);
    assert.equal(claims.purpose, 'msg91_otp_request');
    assert.equal(claims.identifier, `1${phone}`);
    assert.equal(claims.providerRequestId, 'request-bound-to-phone');

    assert.equal(await otpService.verifyOtp('+1', phone, '654321', requestToken), true);
    assert.deepEqual(sendStub.mock.calls[0].arguments, [`1${phone}`]);
    assert.deepEqual(verifyStub.mock.calls[0].arguments, ['request-bound-to-phone', '654321']);
    assert.equal(await otpService.retryOtp('+1', phone, requestToken), true);
    assert.deepEqual(retryStub.mock.calls[0].arguments, ['request-bound-to-phone', undefined]);
    assert.equal(await otpService.verifyOtp('+44', phone, '654321', requestToken), false);
    assert.equal(await otpService.retryOtp('+44', phone, requestToken), false);
    assert.equal(await otpService.verifyOtp('+1', phone, '654321', ''), false);
  } finally {
    mock.restoreAll();
  }
});

test('OTP requests always use MSG91 regardless of local development settings', async () => {
  const sendStub = mock.method(msg91Client, 'sendOtp', async () => 'real-msg91-request');

  try {
    const requestToken = await otpService.generateOtp('+91', '9876543210');
    const claims = jwt.verify(requestToken, JWT_SECRET);
    assert.equal(claims.providerRequestId, 'real-msg91-request');
    assert.equal(claims.identifier, '919876543210');
    assert.deepEqual(sendStub.mock.calls[0].arguments, ['919876543210']);
  } finally {
    mock.restoreAll();
  }
});
