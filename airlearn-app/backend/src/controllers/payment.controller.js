const crypto = require('crypto');
const paymentRepository = require('../db/payment.repository');
const razorpayClient = require('../services/razorpay.client');

const PLANS = {
  foundation_videos: { batchId: 'foundation', tier: 'videos', price: 999 },
  foundation_videos_live: { batchId: 'foundation', tier: 'videos_live', price: 2999 },
  elevation_videos: { batchId: 'elevation', tier: 'videos', price: 1999 },
  elevation_videos_live: { batchId: 'elevation', tier: 'videos_live', price: 4999 },
  distinction_videos: { batchId: 'distinction', tier: 'videos', price: 2999 },
  distinction_videos_live: { batchId: 'distinction', tier: 'videos_live', price: 7999 },
};

function getRazorpayConfig() {
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured. Set server-side credentials first.');
  }
  if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId)) {
    throw new Error('Razorpay key ID is malformed. Copy only the complete Key ID (rzp_test_...); do not include the Key Secret or extra text.');
  }
  if (keyId.startsWith('rzp_live_') && process.env.RAZORPAY_ALLOW_LIVE !== 'true') {
    throw new Error('Live Razorpay checkout is disabled. Set RAZORPAY_ALLOW_LIVE=true after end-to-end testing.');
  }
  return {
    keyId,
    keySecret,
    client: razorpayClient.createClient(keyId, keySecret),
  };
}

function isValidSignature(orderId, paymentId, signature, secret) {
  if (typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest();
  const provided = Buffer.from(signature, 'hex');
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

async function createOrder(req, res) {
  const plan = PLANS[req.body.planId];
  if (!plan) return res.status(400).json({ message: 'Invalid plan.' });

  const couponCode = typeof req.body.couponCode === 'string'
    ? req.body.couponCode.trim().toUpperCase() || null
    : null;
  if (couponCode && couponCode !== 'WELCOME500') {
    return res.status(400).json({ message: 'Invalid coupon code.' });
  }
  const amountRupees = Math.max(plan.price - (couponCode ? 500 : 0), 1);
  const originalAmount = plan.price * 100;
  const discountAmount = (plan.price - amountRupees) * 100;

  try {
    const { client, keyId } = getRazorpayConfig();
    const order = await client.orders.create({
      amount: amountRupees * 100,
      currency: 'INR',
      receipt: `u${req.userId}-${Date.now()}`.slice(0, 40),
      notes: { userId: req.userId, planId: req.body.planId, batchId: plan.batchId },
    });

    await paymentRepository.createPaymentOrder({
      razorpayOrderId: order.id,
      userId: req.userId,
      planId: req.body.planId,
      batchId: plan.batchId,
      tier: plan.tier,
      amount: order.amount,
      currency: order.currency,
      couponCode,
      originalAmount,
      discountAmount,
    });

    return res.json({
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId: req.body.planId,
      batchId: plan.batchId,
    });
  } catch (error) {
    console.error('[payment] Razorpay order creation failed:', {
      code: error.code || error.error?.code || 'UNKNOWN',
      statusCode: error.statusCode || error.error?.statusCode,
      description: error.error?.description || error.description || error.message,
    });
    return res.status(503).json({ message: error.message || 'Could not create payment order.' });
  }
}

async function verifyPayment(req, res) {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  let order;
  try {
    order = await paymentRepository.getPaymentOrder(orderId, req.userId);
  } catch (error) {
    return res.status(503).json({ message: 'Could not load the payment order from the database.' });
  }
  if (!order) {
    return res.status(404).json({ message: 'Payment order not found.' });
  }

  if (order.status === 'captured') {
    if (order.razorpayPaymentId !== paymentId) {
      return res.status(409).json({ message: 'This order has already been verified.' });
    }
    try {
      const entitlements = await paymentRepository.getUserEntitlements(req.userId);
      return res.json({
        success: true,
        batchId: order.batchId,
        planId: order.planId,
        entitlement: entitlements[order.batchId],
      });
    } catch (error) {
      return res.status(503).json({ message: 'Payment was verified, but entitlements could not be loaded.' });
    }
  }
  if (order.status !== 'created') {
    return res.status(409).json({ message: 'This order has already been verified.' });
  }

  let razorpay;
  let keySecret;
  try {
    ({ client: razorpay, keySecret } = getRazorpayConfig());
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }

  if (!isValidSignature(orderId, paymentId, signature, keySecret)) {
    return res.status(400).json({ message: 'Payment signature verification failed.' });
  }

  let payment;
  try {
    payment = await razorpay.payments.fetch(paymentId);
    if (
      payment.order_id !== orderId ||
      payment.amount !== order.amount ||
      payment.currency !== order.currency ||
      payment.status !== 'captured'
    ) {
      return res.status(400).json({ message: 'Payment is not captured for this order.' });
    }
  } catch (error) {
    return res.status(502).json({ message: 'Could not verify payment with Razorpay. Please retry verification.' });
  }

  try {
    const result = await paymentRepository.recordCapturedPayment({
      razorpayOrderId: orderId,
      userId: req.userId,
      payment,
    });
    if (result.outcome === 'not_found') {
      return res.status(404).json({ message: 'Payment order not found.' });
    }
    if (result.outcome === 'conflict') {
      return res.status(409).json({ message: 'This order has already been verified.' });
    }
    return res.json({
      success: true,
      batchId: order.batchId,
      planId: order.planId,
      entitlement: result.entitlement,
    });
  } catch (error) {
    return res.status(503).json({ message: 'Payment was captured, but it could not be saved. Retry verification.' });
  }
}

async function getEntitlements(req, res) {
  try {
    const purchasedBatches = await paymentRepository.getUserEntitlements(req.userId);
    return res.json({ purchasedBatches });
  } catch (error) {
    return res.status(503).json({ message: 'Could not load payment entitlements from the database.' });
  }
}

module.exports = { createOrder, verifyPayment, getEntitlements, isValidSignature };