const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const db = require('../src/db/db');
const { deleteAccount, downloadLearningPdf } = require('../src/controllers/user.controller');
const { issueToken, requireAuth } = require('../src/middleware/auth.middleware');

test('deleteAccount removes user records and invalidates existing tokens', () => {
  const user = db.createUser('+1', '5550100');
  const key = db.phoneKey(user.dialCode, user.phone);
  const token = issueToken(user.id);
  db.otpsByPhoneKey.set(key, { code: '123456', expiresAt: Date.now() + 60000 });
  db.tokensToUserId.set(token, user.id);

  let deleteResponse;
  deleteAccount(
    { userId: user.id },
    {
      status() {
        return this;
      },
      json(body) {
        deleteResponse = body;
      },
    }
  );

  assert.deepEqual(deleteResponse, { success: true });
  assert.equal(db.usersById.has(user.id), false);
  assert.equal(db.usersByPhoneKey.has(key), false);
  assert.equal(db.otpsByPhoneKey.has(key), false);
  assert.equal(db.tokensToUserId.has(token), false);

  let authStatus;
  let nextCalled = false;
  requireAuth(
    { headers: { authorization: `Bearer ${token}` } },
    {
      status(status) {
        authStatus = status;
        return this;
      },
      json() {},
    },
    () => {
      nextCalled = true;
    }
  );

  assert.equal(authStatus, 401);
  assert.equal(nextCalled, false);
});

test('downloadLearningPdf sends the supplied learning PDF with its filename', () => {
  let sentFile;
  let sentName;
  const expectedFile = path.resolve(__dirname, '../../frontend/learns/Foundation.pdf');

  downloadLearningPdf({}, {
    download(filePath, fileName) {
      sentFile = filePath;
      sentName = fileName;
    },
  });

  assert.equal(fs.existsSync(expectedFile), true);
  assert.equal(sentFile, expectedFile);
  assert.equal(sentName, 'Foundation.pdf');
});