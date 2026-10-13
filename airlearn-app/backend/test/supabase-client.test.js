const test = require('node:test');
const { mock } = require('node:test');
const assert = require('node:assert/strict');
const logger = require('../src/services/logger');
const { getClient } = require('../src/db/supabase');

const originalFetch = global.fetch;
const originalEnvironment = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

test.afterEach(() => {
  global.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('Supabase client requires a server-side key', () => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  mock.method(logger, 'error', () => {});

  try {
    assert.throws(
      () => getClient(),
      (error) => error.code === 'SUPABASE_API_CONFIGURATION_MISSING'
    );
  } finally {
    mock.restoreAll();
  }
});

test('Supabase client sends database REST calls to the HTTPS project API', async () => {
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_SECRET_KEY = 'server-side-secret';
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  let request;
  global.fetch = async (url, options) => {
    request = { url: String(url), options };
    return Response.json([{ id: 'user-1' }], {
      headers: { 'Content-Range': '0-0/1' },
    });
  };
  mock.method(logger, 'info', () => {});

  try {
    const { data, error } = await getClient()
      .from('users')
      .select('id')
      .limit(1);

    assert.equal(error, null);
    assert.deepEqual(data, [{ id: 'user-1' }]);
    assert.equal(
      request.url,
      'https://project.supabase.co/rest/v1/users?select=id&limit=1'
    );
    assert.equal(request.options.headers.get('apikey'), 'server-side-secret');
    assert.equal(
      request.options.headers.get('authorization'),
      'Bearer server-side-secret'
    );
  } finally {
    mock.restoreAll();
  }
});
