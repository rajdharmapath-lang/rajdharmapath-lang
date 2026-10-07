const test = require('node:test');
const { mock } = require('node:test');
const { after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const testPdfDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'airlearn-pdf-test-'));
const testPdfPath = path.join(testPdfDirectory, 'test-workbook.pdf');
fs.writeFileSync(testPdfPath, 'test pdf');
process.env.LEARNING_PDF_PATH = testPdfPath;

const db = require('../src/db/db');
const userRepository = require('../src/db/user.repository');
const { createAccount, deleteAccount, downloadLearningPdf, setLanguage } = require('../src/controllers/user.controller');
const { issueToken, requireAuth } = require('../src/middleware/auth.middleware');

after(() => fs.rmSync(testPdfDirectory, { recursive: true, force: true }));

test('deleteAccount removes the database user and invalidates existing tokens', async () => {
  const user = { id: 'user-test-1', dialCode: '+1', phone: '5550100' };
  const key = db.phoneKey(user.dialCode, user.phone);
  const token = issueToken(user.id);
  let userExists = true;
  mock.method(userRepository, 'getUserById', async () => (userExists ? user : null));
  mock.method(userRepository, 'archiveAndDeleteUser', async () => {
    userExists = false;
    return user;
  });
  db.otpsByPhoneKey.set(key, { code: '123456', expiresAt: Date.now() + 60000 });

  try {
    let deleteResponse;
    await deleteAccount(
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
    assert.equal(db.otpsByPhoneKey.has(key), false);

    let authStatus;
    let nextCalled = false;
    await requireAuth(
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
  } finally {
    mock.restoreAll();
  }
});

test('deleteAccount keeps local state when the database audit fails', async () => {
  const user = { id: 'user-test-3', dialCode: '+1', phone: '5550102' };
  const key = db.phoneKey(user.dialCode, user.phone);
  db.otpsByPhoneKey.set(key, { code: '123456', expiresAt: Date.now() + 60000 });
  mock.method(userRepository, 'archiveAndDeleteUser', async () => {
    throw new Error('audit write failed');
  });

  try {
    let statusCode;
    let responseBody;
    await deleteAccount(
      { userId: user.id },
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
    assert.deepEqual(responseBody, { message: 'Could not delete your account from the database.' });
    assert.equal(db.otpsByPhoneKey.has(key), true);
  } finally {
    db.otpsByPhoneKey.delete(key);
    mock.restoreAll();
  }
});

test('createAccount and setLanguage persist user profile fields', async () => {
  const user = { id: 'user-test-2', phone: '5550101', dialCode: '+1' };
  const updateStub = mock.method(userRepository, 'updateUser', async (userId, fields) => ({
    ...user,
    ...fields,
  }));

  try {
    let accountResponse;
    await createAccount(
      { userId: user.id, body: { name: 'Test User', email: 'test@example.com', occupation: 'student' } },
      { json(body) { accountResponse = body; } }
    );
    let languageResponse;
    await setLanguage(
      { userId: user.id, body: { language: 'tamil' } },
      { json(body) { languageResponse = body; } }
    );

    assert.deepEqual(updateStub.mock.calls.map((call) => call.arguments), [
      [user.id, { name: 'Test User', email: 'test@example.com', occupation: 'student' }],
      [user.id, { language: 'tamil' }],
    ]);
    assert.equal(accountResponse.user.name, 'Test User');
    assert.equal(languageResponse.user.language, 'tamil');
  } finally {
    mock.restoreAll();
  }
});

test('downloadLearningPdf sends the supplied learning PDF with its filename', () => {
  let sentFile;
  let sentName;

  downloadLearningPdf({}, {
    download(filePath, fileName) {
      sentFile = filePath;
      sentName = fileName;
    },
  });

  assert.equal(fs.existsSync(testPdfPath), true);
  assert.equal(sentFile, testPdfPath);
  assert.equal(sentName, 'RD chinese workbook.pdf');
});