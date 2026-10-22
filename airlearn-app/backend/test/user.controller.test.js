const test = require('node:test');
const { mock } = require('node:test');
const { after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PassThrough, Readable } = require('node:stream');
const testPdfDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'airlearn-pdf-test-'));
const testPdfPath = path.join(testPdfDirectory, 'test-workbook.pdf');
fs.writeFileSync(testPdfPath, 'test pdf');
process.env.LEARNING_PDF_PATH = testPdfPath;

const userRepository = require('../src/db/user.repository');
const paymentRepository = require('../src/db/payment.repository');
const supabase = require('../src/db/supabase');
const {
  claimStrokePreview,
  createAccount,
  deleteAccount,
  downloadLearningPdf,
  getFoundationLessonVideo,
  setLanguage,
} = require('../src/controllers/user.controller');
const { issueToken, requireAuth } = require('../src/middleware/auth.middleware');

after(() => fs.rmSync(testPdfDirectory, { recursive: true, force: true }));

function createDownloadResponse() {
  const response = new PassThrough();
  response.headers = {};
  response.setHeader = (name, value) => {
    response.headers[name] = value;
  };
  response.status = (code) => {
    response.statusCode = code;
    return response;
  };
  return response;
}

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

test('downloadLearningPdf requires an active purchase from any batch', async () => {
  mock.method(paymentRepository, 'getUserEntitlements', async () => ({
    distinction: { tier: 'videos_live' },
  }));
  let sentFile;
  let sentName;

  try {
    await downloadLearningPdf({ userId: 'paid-user' }, {
      download(filePath, fileName) {
        sentFile = filePath;
        sentName = fileName;
      },
    });

    assert.equal(fs.existsSync(testPdfPath), true);
    assert.equal(sentFile, testPdfPath);
    assert.equal(sentName, 'RD chinese workbook.pdf');
  } finally {
    mock.restoreAll();
  }
});

test('downloadLearningPdf denies users without an active batch purchase', async () => {
  mock.method(paymentRepository, 'getUserEntitlements', async () => ({}));
  let statusCode;
  let responseBody;

  try {
    await downloadLearningPdf({ userId: 'free-user' }, {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
      },
      download() {
        assert.fail('The PDF must not be sent without an active purchase.');
      },
    });

    assert.equal(statusCode, 403);
    assert.deepEqual(responseBody, {
      message: 'An active batch purchase is required to download the learning PDF.',
    });
  } finally {
    mock.restoreAll();
  }
});

test('getFoundationLessonVideo returns signed URLs for the whitelisted Supabase lesson videos', async () => {
  const signedPaths = [];
  mock.method(supabase, 'getClient', () => ({
    storage: {
      from(name) {
        assert.equal(name, 'Rajdharma_app_pdf');
        return {
          async createSignedUrl(objectPath, expiresIn) {
            signedPaths.push({ objectPath, expiresIn });
            return {
              data: {
                signedUrl: `https://project.example/storage/${objectPath}?token=signed`,
              },
              error: null,
            };
          },
        };
      },
    },
  }));

  try {
    for (const [lessonId, fileName] of [
      ['f1', 'Lesson_1.mp4'],
      ['f2', 'Lesson_2.mp4'],
    ]) {
      let responseBody;
      await getFoundationLessonVideo(
        { params: { lessonId }, requestId: 'video-test' },
        {
          json(body) {
            responseBody = body;
            return this;
          },
        }
      );
      assert.equal(responseBody.videoUrl, `https://project.example/storage/Videos/${fileName}?token=signed`);
    }

    assert.deepEqual(signedPaths, [
      { objectPath: 'Videos/Lesson_1.mp4', expiresIn: 60 * 60 },
      { objectPath: 'Videos/Lesson_2.mp4', expiresIn: 60 * 60 },
    ]);
  } finally {
    mock.restoreAll();
  }
});

test('getFoundationLessonVideo rejects lesson IDs outside the whitelist', async () => {
  let statusCode;
  let responseBody;
  await getFoundationLessonVideo(
    { params: { lessonId: '../private.mp4' }, requestId: 'video-test' },
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

  assert.equal(statusCode, 404);
  assert.deepEqual(responseBody, {
    message: 'The Foundation Batch lesson video was not found.',
  });
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
  const response = createDownloadResponse();
  const responseChunks = [];
  response.on('data', (chunk) => responseChunks.push(chunk));
  mock.method(paymentRepository, 'getUserEntitlements', async () => ({
    elevation: { tier: 'videos_live' },
  }));

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
      body: Readable.toWeb(Readable.from([pdfContents])),
      headers: new Headers({ 'content-length': String(pdfContents.length) }),
    };
  };

  try {
    await downloadLearningPdf({}, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(Buffer.concat(responseChunks), pdfContents);
    assert.equal(response.headers['Content-Type'], 'application/pdf');
    assert.equal(response.headers['Content-Length'], String(pdfContents.length));
    assert.equal(response.headers['Content-Disposition'], 'attachment; filename="RD chinese workbook.pdf"');
  } finally {
    mock.restoreAll();
    for (const key of environmentKeys) {
      if (previousEnvironment[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnvironment[key];
    }
    global.fetch = previousFetch;
  }
});

test('downloadLearningPdf streams the configured Supabase object URL directly', async () => {
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
  const pdfContents = Buffer.from('storage pdf');
  const response = createDownloadResponse();
  const responseChunks = [];
  response.on('data', (chunk) => responseChunks.push(chunk));
  mock.method(paymentRepository, 'getUserEntitlements', async () => ({
    foundation: { tier: 'videos_live' },
  }));

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
      body: Readable.toWeb(Readable.from([pdfContents])),
      headers: new Headers({ 'content-length': String(pdfContents.length) }),
    };
  };

  try {
    await downloadLearningPdf({}, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(Buffer.concat(responseChunks), pdfContents);
    assert.equal(response.headers['Content-Length'], String(pdfContents.length));
  } finally {
    mock.restoreAll();
    for (const key of environmentKeys) {
      if (previousEnvironment[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnvironment[key];
    }
    global.fetch = previousFetch;
  }
});