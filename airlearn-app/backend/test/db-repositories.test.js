const test = require('node:test');
const { mock } = require('node:test');
const assert = require('node:assert/strict');
const supabase = require('../src/db/supabase');
const userRepository = require('../src/db/user.repository');
const paymentRepository = require('../src/db/payment.repository');

function createFakeClient({ queryResults = [], rpcResults = [] } = {}) {
  const calls = [];

  function takeResult(results) {
    return results.shift() || { data: null, error: null };
  }

  function createQuery(table) {
    const call = { type: 'query', table, filters: [] };
    calls.push(call);
    const builder = {
      select(columns) {
        call.select = columns;
        return builder;
      },
      eq(column, value) {
        call.filters.push([column, value]);
        return builder;
      },
      gt(column, value) {
        call.filters.push([column, '>', value]);
        return builder;
      },
      insert(values) {
        call.insert = values;
        return builder;
      },
      update(values) {
        call.update = values;
        return builder;
      },
      maybeSingle() {
        return Promise.resolve(takeResult(queryResults));
      },
      single() {
        return Promise.resolve(takeResult(queryResults));
      },
      then(resolve, reject) {
        return Promise.resolve(takeResult(queryResults)).then(resolve, reject);
      },
    };
    return builder;
  }

  return {
    calls,
    from: createQuery,
    rpc(name, args) {
      const call = { type: 'rpc', name, args };
      calls.push(call);
      const result = takeResult(rpcResults);
      return {
        single: () => Promise.resolve(result),
        then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
      };
    },
  };
}

function useFakeClient(client) {
  mock.method(supabase, 'getClient', () => client);
}

test('user repository uses Supabase HTTPS queries and maps user records', async () => {
  const client = createFakeClient({
    queryResults: [{
      data: {
        id: 'user-1',
        dial_code: '+91',
        phone: '9876543210',
        name: 'Test',
        email: 'test@example.com',
        occupation: 'student',
        language: 'english',
      },
      error: null,
    }],
  });
  useFakeClient(client);

  try {
    const user = await userRepository.getUserByPhone('+91', '9876543210');
    assert.deepEqual(user, {
      id: 'user-1',
      dialCode: '+91',
      phone: '9876543210',
      name: 'Test',
      email: 'test@example.com',
      occupation: 'student',
      language: 'english',
      createdAt: undefined,
      updatedAt: undefined,
    });
    assert.deepEqual(client.calls[0].filters, [
      ['dial_code', '+91'],
      ['phone', '9876543210'],
    ]);
  } finally {
    mock.restoreAll();
  }
});

test('user repository resolves a concurrent phone insert using the existing record', async () => {
  const client = createFakeClient({
    queryResults: [
      { data: null, error: null },
      { data: null, error: { code: '23505' } },
      { data: { id: 'user-existing', dial_code: '+1', phone: '5550100' }, error: null },
    ],
  });
  useFakeClient(client);

  try {
    const result = await userRepository.getOrCreateUserByPhone('+1', '5550100');
    assert.equal(result.created, false);
    assert.equal(result.user.id, 'user-existing');
    assert.equal(client.calls[1].insert.dial_code, '+1');
  } finally {
    mock.restoreAll();
  }
});

test('user repository invokes the required atomic RPC operations', async () => {
  const client = createFakeClient({
    rpcResults: [
      {
        data: { has_prime_access: false, preview_claimed: true, preview_count: 2 },
        error: null,
      },
      { data: { id: 'user-1', dial_code: '+91', phone: '9876543210' }, error: null },
    ],
  });
  useFakeClient(client);

  try {
    assert.deepEqual(await userRepository.claimStrokePreview('user-1'), {
      hasPrimeAccess: false,
      previewClaimed: true,
      previewCount: 2,
    });
    const archived = await userRepository.archiveAndDeleteUser('user-1');
    assert.equal(archived.id, 'user-1');
    assert.deepEqual(client.calls.map(({ name, args }) => ({ name, args })), [
      { name: 'claim_stroke_preview', args: { p_user_id: 'user-1' } },
      { name: 'archive_and_delete_user', args: { p_user_id: 'user-1' } },
    ]);
  } finally {
    mock.restoreAll();
  }
});

test('payment repository writes via Supabase and records captures through an atomic RPC', async () => {
  const purchasedAt = '2026-10-13T00:00:00.000Z';
  const validUntil = '2027-01-13T00:00:00.000Z';
  const client = createFakeClient({
    queryResults: [
      { data: null, error: null },
      {
        data: [{
          batch_id: 'foundation',
          plan_id: 'foundation_videos',
          tier: 'videos',
          purchased_at: purchasedAt,
          valid_until: validUntil,
        }],
        error: null,
      },
    ],
    rpcResults: [{
      data: {
        outcome: 'captured',
        entitlement: {
          plan_id: 'foundation_videos',
          tier: 'videos',
          purchased_at: purchasedAt,
          valid_until: validUntil,
        },
      },
      error: null,
    }],
  });
  useFakeClient(client);

  try {
    await paymentRepository.createPaymentOrder({
      razorpayOrderId: 'order-1',
      userId: 'user-1',
      planId: 'foundation_videos',
      batchId: 'foundation',
      tier: 'videos',
      amount: 49900,
      currency: 'INR',
      couponCode: 'WELCOME500',
      originalAmount: 99900,
      discountAmount: 50000,
    });
    const captured = await paymentRepository.recordCapturedPayment({
      razorpayOrderId: 'order-1',
      userId: 'user-1',
      payment: {
        id: 'payment-1',
        amount: 49900,
        currency: 'INR',
        method: 'upi',
        created_at: 1730000000,
      },
    });
    const entitlements = await paymentRepository.getUserEntitlements('user-1');

    assert.equal(client.calls[0].table, 'payment_orders');
    assert.equal(client.calls[0].insert.razorpay_order_id, 'order-1');
    assert.deepEqual(client.calls[1], {
      type: 'rpc',
      name: 'record_captured_payment',
      args: {
        p_razorpay_order_id: 'order-1',
        p_user_id: 'user-1',
        p_razorpay_payment_id: 'payment-1',
        p_amount: 49900,
        p_currency: 'INR',
        p_method: 'upi',
        p_razorpay_created_at: new Date(1730000000 * 1000).toISOString(),
      },
    });
    assert.deepEqual(captured, {
      outcome: 'captured',
      entitlement: {
        planId: 'foundation_videos',
        tier: 'videos',
        purchasedAt: Date.parse(purchasedAt),
        validUntil: Date.parse(validUntil),
      },
    });
    assert.equal(entitlements.foundation.planId, 'foundation_videos');
  } finally {
    mock.restoreAll();
  }
});
