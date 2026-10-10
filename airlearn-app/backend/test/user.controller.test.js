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

const userRepository = require('../src/db/user.repository');
const {
  claimStrokePreview,
  createAccount,
  deleteAccount,
  downloadLearningPdf,
  setLanguage,
} = require('../src/controllers/user.controller');
const { issueToken, requireAuth } = require('../src/middleware/auth.middleware');

after(() => fs.rmSync(testPdfDirectory, { recursive: true, force: true }));

test('deleteAccount removes the database user and invalidates existing tokens', async () => {
  const user = { id: 'user-test-1', dialCode: '+1', phone: '5550100' };
  const token = issueToken(user.id);
  let userExists = true;
  mock.method(userRepository, 'getUserById', async () => (userExists ? user : null));
  mock.method(userRepository, 'archiveAndDeleteUser', async () => {
    userExists = false;
    return user;
  });
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

test('deleteAccount returns an error when the database audit fails', async () => {
  const user = { id: 'user-test-3', dialCode: '+1', phone: '5550102' };
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
  } finally {
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

test('claimStrokePreview allows three free stroke attempts and Prime access', async () => {
  const results = [
    { hasPrimeAccess: false, previewClaimed: true, previewCount: 1 },
    { hasPrimeAccess: false, previewClaimed: true, previewCount: 2 },
    { hasPrimeAccess: false, previewClaimed: true, previewCount: 3 },
    { hasPrimeAccess: false, previewClaimed: false, previewCount: null },
    { hasPrimeAccess: true, previewClaimed: false, previewCount: null },
  ];
  const claimStub = mock.method(userRepository, 'claimStrokePreview', async () => results.shift());
  const responses = [];
  const response = {
    json(body) {
      responses.push(body);
      return this;
    },
  };

  try {
    await claimStrokePreview({ userId: 'free-user' }, response);
    await claimStrokePreview({ userId: 'free-user' }, response);
    await claimStrokePreview({ userId: 'free-user' }, response);
    await claimStrokePreview({ userId: 'free-user' }, response);
    await claimStrokePreview({ userId: 'prime-user' }, response);

    assert.deepEqual(responses, [
      { hasPrimeAccess: false, previewClaimed: true, previewCount: 1 },
      { hasPrimeAccess: false, previewClaimed: true, previewCount: 2 },
      { hasPrimeAccess: false, previewClaimed: true, previewCount: 3 },
      { hasPrimeAccess: false, previewClaimed: false, previewCount: null },
      { hasPrimeAccess: true, previewClaimed: false, previewCount: null },
    ]);
    assert.equal(claimStub.mock.callCount(), 5);
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

test('downloadLearningPdf fetches the configured Supabase Storage object', async () => {
  const environmentKeys = [
    'SUPABASE_URL',
    'SUPABASE_STORAGE_URL',
    'SUPABASE_STORAGE_OBJECT_URL',
    'SUPABASE_STORAGE_BUCKET',
    'SUPABASE_STORAGE_OBJECT_PATH',
    'SUPABASE_STORAGE_PUBLIC',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const previousEnvironment = Object.fromEntries(
    environmentKeys.map((key) => [key, process.env[key]])
  );
  const previousFetch = global.fetch;
  const pdfContents = Buffer.from('storage pdf');
  let responseStatus;
  let responseBody;
  const responseHeaders = {};

  process.env.SUPABASE_URL = 'https://legacy-project.example';
  process.env.SUPABASE_STORAGE_URL = 'https://project.example';
  process.env.SUPABASE_STORAGE_BUCKET = 'course-notes';
  process.env.SUPABASE_STORAGE_OBJECT_PATH = 'foundation/RD chinese workbook.pdf';
  process.env.SUPABASE_STORAGE_PUBLIC = 'false';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  global.fetch = async (url, options) => {
    assert.equal(
      url.href,
      'https://project.example/storage/v1/object/authenticated/course-notes/foundation/RD%20chinese%20workbook.pdf'
    );
    assert.equal(options.headers.apikey, 'test-service-role-key');
    assert.equal(options.headers.authorization, 'Bearer test-service-role-key');
    return {
      ok: true,
      async arrayBuffer() {
        return pdfContents;
      },
    };
  };

  try {
    await downloadLearningPdf({}, {
      setHeader(name, value) {
        responseHeaders[name] = value;
      },
      status(code) {
        responseStatus = code;
        return this;
      },
      send(body) {
        responseBody = body;
      },
    });

    assert.equal(responseStatus, 200);
    assert.deepEqual(responseBody, pdfContents);
    assert.equal(responseHeaders['Content-Type'], 'application/pdf');
    assert.equal(responseHeaders['Content-Disposition'], 'attachment; filename="RD chinese workbook.pdf"');
  } finally {
    for (const key of environmentKeys) {
      if (previousEnvironment[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnvironment[key];
    }
    global.fetch = previousFetch;
  }
});

test('downloadLearningPdf fetches the configured Supabase object URL directly', async () => {
  const environmentKeys = [
    'SUPABASE_STORAGE_OBJECT_URL',
    'SUPABASE_STORAGE_BUCKET',
    'SUPABASE_STORAGE_OBJECT_PATH',
    'SUPABASE_STORAGE_PUBLIC',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const previousEnvironment = Object.fromEntries(
    environmentKeys.map((key) => [key, process.env[key]])
  );
  const previousFetch = global.fetch;
  const objectUrl =
    'https://tfniorcovtstaswpakfn.supabase.co/storage/v1/object/public/Rajdharma_app_pdf/Work%20book.pdf';
  let responseStatus;
  let responseBody;

  process.env.SUPABASE_STORAGE_OBJECT_URL = objectUrl;
  delete process.env.SUPABASE_STORAGE_BUCKET;
  delete process.env.SUPABASE_STORAGE_OBJECT_PATH;
  delete process.env.SUPABASE_STORAGE_PUBLIC;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  global.fetch = async (url, options) => {
    assert.equal(url.href, objectUrl);
    assert.deepEqual(options.headers, {});
    return {
      ok: true,
      async arrayBuffer() {
        return Buffer.from('storage pdf');
      },
    };
  };

  try {
    await downloadLearningPdf({}, {
      setHeader() {},
      status(code) {
        responseStatus = code;
        return this;
      },
      send(body) {
        responseBody = body;
      },
    });

    assert.equal(responseStatus, 200);
    assert.deepEqual(responseBody, Buffer.from('storage pdf'));
  } finally {
    for (const key of environmentKeys) {
      if (previousEnvironment[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnvironment[key];
    }
    global.fetch = previousFetch;
  }
});