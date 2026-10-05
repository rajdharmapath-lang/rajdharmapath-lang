const test = require('node:test');
const { mock } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { verifyOtp } = require('../src/controllers/auth.controller');
const userRepository = require('../src/db/user.repository');
const { JWT_SECRET } = require('../src/middleware/auth.middleware');

test('verifyOtp stores the verified phone identity through the user repository', async () => {
  const user = {
    id: 'user-supabase-uuid',
    phone: '5550100',
    dialCode: '+1',
    name: null,
    email: null,
    occupation: null,
    language: null,
  };
  const createUserStub = mock.method(userRepository, 'getOrCreateUserByPhone', async () => ({
    user,
    created: true,
  }));
  let responseBody;

  try {
    await verifyOtp(
      { body: { phone: user.phone, dialCode: user.dialCode, code: '123456' } },
      {
        status() {
          return this;
        },
        json(body) {
          responseBody = body;
        },
      }
    );

    assert.equal(createUserStub.mock.calls.length, 1);
    assert.deepEqual(createUserStub.mock.calls[0].arguments, [user.dialCode, user.phone]);
    assert.equal(responseBody.isNewUser, true);
    assert.equal(responseBody.user, null);
    assert.equal(jwt.verify(responseBody.token, JWT_SECRET).userId, user.id);
  } finally {
    mock.restoreAll();
  }
});