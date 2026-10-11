const test = require('node:test');
const { mock } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const logger = require('../src/services/logger');
const requestLogger = require('../src/middleware/request-logger');

test('request logging traces routes and redacts sensitive error details', () => {
  const infoStub = mock.method(logger, 'info', () => {});
  const errorStub = mock.method(console, 'error', () => {});
  const response = new EventEmitter();
  response.statusCode = 200;
  response.setHeader = (name, value) => {
    response.header = { name, value };
  };
  const request = { method: 'GET', path: '/api/user/me' };
  let nextCalled = false;

  try {
    requestLogger(request, response, () => {
      nextCalled = true;
    });
    response.emit('finish');

    assert.equal(nextCalled, true);
    assert.match(request.requestId, /^[0-9a-f-]{36}$/);
    assert.deepEqual(response.header, { name: 'X-Request-ID', value: request.requestId });
    assert.deepEqual(
      infoStub.mock.calls.map((call) => call.arguments[0]),
      ['http_request_started', 'http_request_completed']
    );
    assert.equal(infoStub.mock.calls[1].arguments[1].statusCode, 200);
    assert.equal(infoStub.mock.calls[1].arguments[1].path, '/api/user/me');

    logger.error('provider_failed', {
      module: 'payments',
      error: new Error('password=private jwt=header.payload.signature phone 919876543210'),
    });

    const message = errorStub.mock.calls[0].arguments[0];
    assert.match(message, /\[ERROR\] provider_failed/);
    assert.match(message, /module: payments/);
    assert.equal(message.includes('private'), false);
    assert.equal(message.includes('header.payload.signature'), false);
    assert.equal(message.includes('919876543210'), false);
    assert.equal(logger.sanitizeMessage('MSG91 could not send the OTP: destination is blocked'), 'MSG91 could not send the OTP: destination is blocked');
    assert.equal(logger.sanitizeMessage('Invalid OTP: 123456'), 'Invalid OTP=[REDACTED]');
    assert.equal(logger.sanitizeMessage(0), '0');
  } finally {
    mock.restoreAll();
  }
});
