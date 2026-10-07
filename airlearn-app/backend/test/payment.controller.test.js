const test = require('node:test');
const { mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const paymentRepository = require('../src/db/payment.repository');
const razorpayClient = require('../src/services/razorpay.client');
const { createOrder, getEntitlements, isValidSignature, verifyPayment } = require('../src/controllers/payment.controller');

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

test('createOrder persists the Razorpay order before returning it to checkout', async () => {
  const previousKeyId = process.env.RAZORPAY_KEY_ID;
  const previousSecret = process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_KEY_ID = 'rzp_test_unit';
  process.env.RAZORPAY_KEY_SECRET = 'unit_secret';
  const storedOrders = [];
  mock.method(paymentRepository, 'createPaymentOrder', async (order) => storedOrders.push(order));
  mock.method(razorpayClient, 'createClient', () => ({
    orders: {
      create: async () => ({ id: 'order_db_123', amount: 49900, currency: 'INR' }),
    },
  }));

  let responseBody;
  let statusCode = 200;
  try {
    await createOrder(
      { userId: 'user-db-test', body: { planId: 'foundation_videos', couponCode: 'WELCOME500' } },
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
    mock.restoreAll();
    if (previousKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = previousKeyId;
    if (previousSecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = previousSecret;
  }

  assert.equal(statusCode, 200);
  assert.equal(responseBody.orderId, 'order_db_123');
  assert.deepEqual(storedOrders, [{
    razorpayOrderId: 'order_db_123',
    userId: 'user-db-test',
    planId: 'foundation_videos',
    batchId: 'foundation',
    tier: 'videos',
    amount: 49900,
    currency: 'INR',
    couponCode: 'WELCOME500',
    originalAmount: 99900,
    discountAmount: 50000,
  }]);
});

test('verifyPayment stores only a captured payment and its entitlement', async () => {
  const previousKeyId = process.env.RAZORPAY_KEY_ID;
  const previousSecret = process.env.RAZORPAY_KEY_SECRET;
  const secret = 'unit_secret';
  const payment = {
    id: 'pay_db_123',
    order_id: 'order_db_123',
    amount: 99900,
    currency: 'INR',
    status: 'captured',
    method: 'upi',
    created_at: 1730000000,
  };
  const entitlement = {
    planId: 'foundation_videos',
    tier: 'videos',
    purchasedAt: 1730000000000,
    validUntil: 1737776000000,
  };
  const signature = crypto
    .createHmac('sha256', secret)
    .update('order_db_123|pay_db_123')
    .digest('hex');
  const recordedPayments = [];
  process.env.RAZORPAY_KEY_ID = 'rzp_test_unit';
  process.env.RAZORPAY_KEY_SECRET = secret;
  mock.method(paymentRepository, 'getPaymentOrder', async () => ({
    id: 'db-order-id',
    razorpayOrderId: 'order_db_123',
    userId: 'user-db-test',
    planId: 'foundation_videos',
    batchId: 'foundation',
    tier: 'videos',
    amount: 99900,
    currency: 'INR',
    status: 'created',
    razorpayPaymentId: null,
  }));
  mock.method(paymentRepository, 'recordCapturedPayment', async (record) => {
    recordedPayments.push(record);
    return { outcome: 'captured', entitlement };
  });
  mock.method(razorpayClient, 'createClient', () => ({
    payments: { fetch: async () => payment },
  }));

  let responseBody;
  let statusCode = 200;
  try {
    await verifyPayment(
      {
        userId: 'user-db-test',
        body: {
          razorpay_order_id: 'order_db_123',
          razorpay_payment_id: 'pay_db_123',
          razorpay_signature: signature,
        },
      },
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
    mock.restoreAll();
    if (previousKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = previousKeyId;
    if (previousSecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = previousSecret;
  }

  assert.equal(statusCode, 200);
  assert.deepEqual(responseBody, {
    success: true,
    batchId: 'foundation',
    planId: 'foundation_videos',
    entitlement,
  });
  assert.deepEqual(recordedPayments, [{
    razorpayOrderId: 'order_db_123',
    userId: 'user-db-test',
    payment,
  }]);
});

test('verifyPayment safely returns the stored result when Razorpay retries the same capture', async () => {
  const entitlement = {
    planId: 'foundation_videos',
    tier: 'videos',
    purchasedAt: 1730000000000,
    validUntil: 1737776000000,
  };
  mock.method(paymentRepository, 'getPaymentOrder', async () => ({
    batchId: 'foundation',
    planId: 'foundation_videos',
    status: 'captured',
    razorpayPaymentId: 'pay_db_123',
  }));
  mock.method(paymentRepository, 'getUserEntitlements', async () => ({ foundation: entitlement }));

  let responseBody;
  await verifyPayment(
    {
      userId: 'user-db-test',
      body: { razorpay_order_id: 'order_db_123', razorpay_payment_id: 'pay_db_123' },
    },
    { json(body) { responseBody = body; } }
  );

  mock.restoreAll();
  assert.deepEqual(responseBody, {
    success: true,
    batchId: 'foundation',
    planId: 'foundation_videos',
    entitlement,
  });
});

test('getEntitlements returns records from the persistent repository', async () => {
  const purchasedBatches = {
    foundation: { planId: 'foundation_videos', tier: 'videos', purchasedAt: 1730000000000 },
  };
  mock.method(paymentRepository, 'getUserEntitlements', async () => purchasedBatches);

  let responseBody;
  await getEntitlements(
    { userId: 'user-db-test' },
    { json(body) { responseBody = body; } }
  );

  mock.restoreAll();
  assert.deepEqual(responseBody, { purchasedBatches });
});

test('createOrder refuses live keys without explicit server opt-in', async () => {
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

test('createOrder permits live credentials only with explicit server opt-in', async () => {
  const previousKeyId = process.env.RAZORPAY_KEY_ID;
  const previousSecret = process.env.RAZORPAY_KEY_SECRET;
  const previousAllowLive = process.env.RAZORPAY_ALLOW_LIVE;
  process.env.RAZORPAY_KEY_ID = 'rzp_live_unit';
  process.env.RAZORPAY_KEY_SECRET = 'unit_secret';
  process.env.RAZORPAY_ALLOW_LIVE = 'true';
  mock.method(paymentRepository, 'createPaymentOrder', async () => {});
  mock.method(razorpayClient, 'createClient', () => ({
    orders: {
      create: async () => ({ id: 'order_live_opt_in', amount: 99900, currency: 'INR' }),
    },
  }));

  let statusCode = 200;
  let responseBody;
  try {
    await createOrder(
      { userId: 'user-live-test', body: { planId: 'foundation_videos' } },
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
    mock.restoreAll();
    if (previousKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = previousKeyId;
    if (previousSecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = previousSecret;
    if (previousAllowLive === undefined) delete process.env.RAZORPAY_ALLOW_LIVE;
    else process.env.RAZORPAY_ALLOW_LIVE = previousAllowLive;
  }

  assert.equal(statusCode, 200);
  assert.equal(responseBody.orderId, 'order_live_opt_in');
});
