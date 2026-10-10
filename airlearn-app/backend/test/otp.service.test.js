const test = require('node:test');
const { mock } = require('node:test');
const assert = require('node:assert/strict');
const msg91Client = require('../src/services/msg91.client');
const otpService = require('../src/services/otp.service');

test('normalizes the country code and phone number to an MSG91 identifier', () => {
  assert.equal(otpService.normalizePhone('+91', '98765 43210'), '919876543210');
  assert.equal(otpService.normalizePhone('', '9876543210'), null);
  assert.equal(otpService.normalizePhone('+91', '123'), null);
});

test('OTP verification is bound to the phone number and MSG91 access token', async () => {
  const phone = `555${String(Date.now()).slice(-7)}`;
  const sendStub = mock.method(msg91Client, 'sendOtp', async () => 'request-bound-to-phone');
  const verifyStub = mock.method(msg91Client, 'verifyOtp', async () => ({
    success: true,
    accessToken: 'verified-access-token',
  }));
  const accessStub = mock.method(msg91Client, 'verifyAccessToken', async () => `1${phone}`);

  try {
    assert.equal(await otpService.generateOtp('+1', phone), 'request-bound-to-phone');
    assert.equal(await otpService.verifyOtp('+1', phone, '654321', 'request-bound-to-phone'), true);
    assert.deepEqual(sendStub.mock.calls[0].arguments, [`1${phone}`]);
    assert.deepEqual(verifyStub.mock.calls[0].arguments, ['request-bound-to-phone', '654321']);
    assert.deepEqual(accessStub.mock.calls[0].arguments, ['verified-access-token']);
    assert.equal(await otpService.verifyOtp('+1', phone, '654321', ''), false);
  } finally {
    mock.restoreAll();
  }
});

test('OTP requests always use MSG91 regardless of local development settings', async () => {
  const sendStub = mock.method(msg91Client, 'sendOtp', async () => 'real-msg91-request');

  try {
    assert.equal(await otpService.generateOtp('+91', '9876543210'), 'real-msg91-request');
    assert.deepEqual(sendStub.mock.calls[0].arguments, ['919876543210']);
  } finally {
    mock.restoreAll();
  }
});
