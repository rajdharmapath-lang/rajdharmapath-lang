const { getPool } = require('./postgres');

function toEntitlement(row) {
  if (!row) return null;
  return {
    planId: row.plan_id,
    tier: row.tier,
    purchasedAt: new Date(row.purchased_at).getTime(),
    validUntil: new Date(row.valid_until).getTime(),
  };
}

async function createPaymentOrder(order) {
  await getPool().query(
    `INSERT INTO public.payment_orders (
      razorpay_order_id, user_id, plan_id, batch_id, tier, amount, currency,
      coupon_code, original_amount, discount_amount
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      order.razorpayOrderId,
      order.userId,
      order.planId,
      order.batchId,
      order.tier,
      order.amount,
      order.currency,
      order.couponCode,
      order.originalAmount,
      order.discountAmount,
    ]
  );
}

async function getPaymentOrder(razorpayOrderId, userId) {
  const { rows } = await getPool().query(
    `SELECT * FROM public.payment_orders
     WHERE razorpay_order_id = $1 AND user_id = $2
     LIMIT 1`,
    [razorpayOrderId, userId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    razorpayOrderId: row.razorpay_order_id,
    userId: row.user_id,
    planId: row.plan_id,
    batchId: row.batch_id,
    tier: row.tier,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    razorpayPaymentId: row.razorpay_payment_id,
  };
}

async function recordCapturedPayment({ razorpayOrderId, userId, payment }) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const { rows: orderRows } = await client.query(
      `SELECT * FROM public.payment_orders
       WHERE razorpay_order_id = $1 AND user_id = $2
       FOR UPDATE`,
      [razorpayOrderId, userId]
    );
    const order = orderRows[0];
    if (!order) {
      await client.query('COMMIT');
      return { outcome: 'not_found' };
    }

    if (order.status === 'captured') {
      if (order.razorpay_payment_id !== payment.id) {
        await client.query('COMMIT');
        return { outcome: 'conflict' };
      }
      const { rows: entitlementRows } = await client.query(
        `SELECT * FROM public.user_entitlements
         WHERE user_id = $1 AND batch_id = $2`,
        [userId, order.batch_id]
      );
      await client.query('COMMIT');
      return { outcome: 'captured', entitlement: toEntitlement(entitlementRows[0]) };
    }

    const razorpayCreatedAt = Number.isFinite(payment.created_at)
      ? new Date(payment.created_at * 1000)
      : null;
    const { rows: paymentRows } = await client.query(
      `INSERT INTO public.payment_transactions (
        payment_order_id, user_id, razorpay_payment_id, amount, currency,
        status, method, razorpay_created_at
      ) VALUES ($1, $2, $3, $4, $5, 'captured', $6, $7)
      RETURNING id`,
      [
        order.id,
        userId,
        payment.id,
        payment.amount,
        payment.currency,
        payment.method || null,
        razorpayCreatedAt,
      ]
    );

    await client.query(
      `UPDATE public.payment_orders
       SET status = 'captured', razorpay_payment_id = $2, updated_at = now()
       WHERE id = $1`,
      [order.id, payment.id]
    );

    const { rows: entitlementRows } = await client.query(
      `INSERT INTO public.user_entitlements (
        user_id, batch_id, plan_id, tier, payment_order_id,
        payment_transaction_id, purchased_at, valid_until
      ) VALUES ($1, $2, $3, $4, $5, $6, now(), now() + interval '3 months')
      ON CONFLICT (user_id, batch_id) DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        tier = EXCLUDED.tier,
        payment_order_id = EXCLUDED.payment_order_id,
        payment_transaction_id = EXCLUDED.payment_transaction_id,
        purchased_at = EXCLUDED.purchased_at,
        valid_until = EXCLUDED.valid_until
      RETURNING *`,
      [
        userId,
        order.batch_id,
        order.plan_id,
        order.tier,
        order.id,
        paymentRows[0].id,
      ]
    );

    await client.query('COMMIT');
    return { outcome: 'captured', entitlement: toEntitlement(entitlementRows[0]) };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function getUserEntitlements(userId) {
  const { rows } = await getPool().query(
    `SELECT batch_id, plan_id, tier, purchased_at, valid_until
     FROM public.user_entitlements
     WHERE user_id = $1 AND valid_until > now()`,
    [userId]
  );
  return rows.reduce((entitlements, row) => {
    entitlements[row.batch_id] = toEntitlement(row);
    return entitlements;
  }, {});
}

module.exports = {
  createPaymentOrder,
  getPaymentOrder,
  recordCapturedPayment,
  getUserEntitlements,
};