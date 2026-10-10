const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { logOtpError } = require('../src/services/otp-error-logger');

test('writes structured OTP error logs with masked phone and redacted credentials', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'airlearn-otp-log-'));
  const logPath = path.join(directory, 'nested', 'otp-errors.log');
  const previousPath = process.env.OTP_ERROR_LOG_PATH;
  process.env.OTP_ERROR_LOG_PATH = logPath;

  try {
    await logOtpError(
      new Error('Provider rejected OTP=123456 for +919876543210; tokenAuth=secret-value'),
      { stage: 'send', dialCode: '+91', phone: '9876543210' }
    );

    const [line] = (await fs.readFile(logPath, 'utf8')).trim().split('\n');
    const record = JSON.parse(line);
    assert.equal(record.event, 'otp_provider_error');
    assert.equal(record.stage, 'send');
    assert.equal(record.message.includes('123456'), false);
    assert.equal(record.message.includes('secret-value'), false);
    assert.equal(record.message.includes('919876543210'), false);
    assert.equal(record.phone, '***3210');
    assert.ok(Number.isFinite(Date.parse(record.timestamp)));
  } finally {
    if (previousPath === undefined) delete process.env.OTP_ERROR_LOG_PATH;
    else process.env.OTP_ERROR_LOG_PATH = previousPath;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
