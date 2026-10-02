const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createOrder, isValidSignature } = require('../src/controllers/payment.controller');

test('payment signatures accept only the matching order/payment pair', () => {
  const orderId = 'order_test_123';
  const paymentId = 'pay_test_456';
  const secret = 'unit_test_secret';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  assert.equal(isValidSignature(orderId, paymentId, signature, secret), true);
  assert.equal(isValidSignature(orderId, 'pay_test_other', signature, secret), false);
  assert.equal(isValidSignature(orderId, paymentId, 'invalid', secret), false);
});

test('createOrder rejects unknown plans before contacting Razorpay', async () => {
  let statusCode;
  let responseBody;
  await createOrder(
    { userId: 'test-user', body: { planId: 'client_supplied_amount' } },
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

  assert.equal(statusCode, 400);
  assert.deepEqual(responseBody, { message: 'Invalid plan.' });
});

test('createOrder rejects invalid coupon codes before contacting Razorpay', async () => {
  let statusCode;
  let responseBody;
  await createOrder(
    { userId: 'test-user', body: { planId: 'foundation_videos', couponCode: 'BLACKFRIDAY' } },
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

  assert.equal(statusCode, 400);
  assert.deepEqual(responseBody, { message: 'Invalid coupon code.' });
});

test('createOrder refuses live keys while entitlement storage is in-memory', async () => {
  const previousKeyId = process.env.RAZORPAY_KEY_ID;
  const previousSecret = process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_KEY_ID = 'rzp_live_not_a_real_key';
  process.env.RAZORPAY_KEY_SECRET = 'not_a_real_secret';

  let statusCode;
  let responseBody;
  try {
    await createOrder(
      { userId: 'test-user', body: { planId: 'foundation_videos' } },
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
  } finally {
    if (previousKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = previousKeyId;
    if (previousSecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = previousSecret;
  }

  assert.equal(statusCode, 503);
  assert.match(responseBody.message, /Live Razorpay checkout is disabled/);
});
