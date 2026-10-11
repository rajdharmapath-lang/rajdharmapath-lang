const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { mock } = require('node:test');
const { logOtpError, logOtpEvent } = require('../src/services/otp-error-logger');

test('writes structured OTP error logs with masked phone and redacted credentials', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'airlearn-otp-log-'));
  const logPath = path.join(directory, 'nested', 'otp-errors.log');
  const previousPath = process.env.OTP_ERROR_LOG_PATH;
  process.env.OTP_ERROR_LOG_PATH = logPath;
  const consoleStub = mock.method(console, 'error', () => {});

  try {
    await logOtpError(
      new Error('Provider rejected OTP=123456 for +919876543210; tokenAuth=secret-value'),
      {
        stage: 'send',
        dialCode: '+91',
        phone: '9876543210',
        requestId: 'correlation-123',
        durationMs: 275,
        statusCode: 502,
      }
    );

    const [line] = (await fs.readFile(logPath, 'utf8')).trim().split('\n');
    const record = JSON.parse(line);
    assert.equal(record.event, 'otp_provider_error');
    assert.equal(record.stage, 'send');
    assert.equal(record.requestId, 'correlation-123');
    assert.equal(record.durationMs, 275);
    assert.equal(record.statusCode, 502);
    assert.equal(record.message.includes('123456'), false);
    assert.equal(record.message.includes('secret-value'), false);
    assert.equal(record.message.includes('919876543210'), false);
    assert.equal(record.phone, '***3210');
    assert.equal(consoleStub.mock.calls.length, 1);
    const consoleMessage = consoleStub.mock.calls[0].arguments[0];
    assert.match(consoleMessage, /\[ERROR\] otp_provider_error/);
    assert.match(consoleMessage, /code: UNKNOWN/);
    assert.match(consoleMessage, /requestId: correlation-123/);
    assert.equal(consoleMessage.includes('secret-value'), false);
    assert.ok(Number.isFinite(Date.parse(record.timestamp)));
  } finally {
    mock.restoreAll();
    if (previousPath === undefined) delete process.env.OTP_ERROR_LOG_PATH;
    else process.env.OTP_ERROR_LOG_PATH = previousPath;
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('console OTP events only include allowlisted, masked diagnostic fields', () => {
  const consoleStub = mock.method(console, 'info', () => {});
  try {
    logOtpEvent({
      event: 'otp_request_received',
      stage: 'send',
      requestId: 'correlation-456',
      durationMs: 12,
      dialCode: '+91',
      phone: '9876543210',
      submittedCode: '123456',
      tokenAuth: 'secret-value',
    });

    const message = consoleStub.mock.calls[0].arguments[0];
    assert.match(message, /\[INFO\] otp_request_received/);
    assert.match(message, /phone: \*\*\*3210/);
    assert.match(message, /requestId: correlation-456/);
    assert.equal(message.includes('123456'), false);
    assert.equal(message.includes('secret-value'), false);
    assert.equal(message.includes('dialCode'), false);
  } finally {
    mock.restoreAll();
  }
});
