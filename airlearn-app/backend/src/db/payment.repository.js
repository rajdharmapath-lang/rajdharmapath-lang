const supabase = require('./supabase');

async function unwrap(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

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
  await unwrap(
    supabase.getClient().from('payment_orders').insert({
      razorpay_order_id: order.razorpayOrderId,
      user_id: order.userId,
      plan_id: order.planId,
      batch_id: order.batchId,
      tier: order.tier,
      amount: order.amount,
      currency: order.currency,
      coupon_code: order.couponCode,
      original_amount: order.originalAmount,
      discount_amount: order.discountAmount,
    })
  );
}

async function getPaymentOrder(razorpayOrderId, userId) {
  const row = await unwrap(
    supabase.getClient().from('payment_orders')
      .select('*')
      .eq('razorpay_order_id', razorpayOrderId)
      .eq('user_id', userId)
      .maybeSingle()
  );
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
  const razorpayCreatedAt = Number.isFinite(payment.created_at)
    ? new Date(payment.created_at * 1000).toISOString()
    : null;
  const result = await unwrap(
    supabase.getClient().rpc('record_captured_payment', {
      p_razorpay_order_id: razorpayOrderId,
      p_user_id: userId,
      p_razorpay_payment_id: payment.id,
      p_amount: payment.amount,
      p_currency: payment.currency,
      p_method: payment.method || null,
      p_razorpay_created_at: razorpayCreatedAt,
    })
  );
  return {
    outcome: result.outcome,
    entitlement: result.entitlement ? toEntitlement(result.entitlement) : null,
  };
}

async function getUserEntitlements(userId) {
  const rows = await unwrap(
    supabase.getClient().from('user_entitlements')
      .select('batch_id, plan_id, tier, purchased_at, valid_until')
      .eq('user_id', userId)
      .gt('valid_until', new Date().toISOString())
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