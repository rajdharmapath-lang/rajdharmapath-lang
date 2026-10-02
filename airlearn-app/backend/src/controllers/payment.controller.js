const crypto = require('crypto');
const Razorpay = require('razorpay');
const { razorpayOrdersById, purchasedBatchesByUserId } = require('../db/db');

const PLANS = {
  foundation_videos: { batchId: 'foundation', tier: 'videos', price: 999 },
  foundation_videos_live: { batchId: 'foundation', tier: 'videos_live', price: 2999 },
  elevation_videos: { batchId: 'elevation', tier: 'videos', price: 1999 },
  elevation_videos_live: { batchId: 'elevation', tier: 'videos_live', price: 4999 },
  distinction_videos: { batchId: 'distinction', tier: 'videos', price: 2999 },
  distinction_videos_live: { batchId: 'distinction', tier: 'videos_live', price: 7999 },
};

function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured. Set server-side test credentials first.');
  }
  if (!keyId.startsWith('rzp_test_')) {
    throw new Error('Live Razorpay checkout is disabled until payment entitlements use persistent storage.');
  }
  return {
    keyId,
    keySecret,
    client: new Razorpay({ key_id: keyId, key_secret: keySecret }),
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

  const couponCode = req.body.couponCode?.trim().toUpperCase();
  if (couponCode && couponCode !== 'WELCOME500') {
    return res.status(400).json({ message: 'Invalid coupon code.' });
  }
  const amountRupees = Math.max(plan.price - (couponCode ? 500 : 0), 1);

  try {
    const { client, keyId } = getRazorpayConfig();
    const order = await client.orders.create({
      amount: amountRupees * 100,
      currency: 'INR',
      receipt: `u${req.userId}-${Date.now()}`.slice(0, 40),
      notes: { userId: req.userId, planId: req.body.planId, batchId: plan.batchId },
    });

    razorpayOrdersById.set(order.id, {
      userId: req.userId,
      planId: req.body.planId,
      batchId: plan.batchId,
      tier: plan.tier,
      amount: order.amount,
      currency: order.currency,
      verifiedPaymentId: null,
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
    return res.status(503).json({ message: error.message || 'Could not create payment order.' });
  }
}

async function verifyPayment(req, res) {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  const order = razorpayOrdersById.get(orderId);
  if (!order || order.userId !== req.userId) {
    return res.status(404).json({ message: 'Payment order not found.' });
  }

  if (order.verifiedPaymentId === paymentId) {
    return res.json({ success: true, batchId: order.batchId, planId: order.planId });
  }
  if (order.verifiedPaymentId) {
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

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    if (
      payment.order_id !== orderId ||
      payment.amount !== order.amount ||
      payment.currency !== order.currency ||
      payment.status !== 'captured'
    ) {
      return res.status(400).json({ message: 'Payment is not captured for this order.' });
    }

    const entitlement = {
      planId: order.planId,
      tier: order.tier,
      purchasedAt: Date.now(),
    };
    const userEntitlements = purchasedBatchesByUserId.get(req.userId) || {};
    purchasedBatchesByUserId.set(req.userId, {
      ...userEntitlements,
      [order.batchId]: entitlement,
    });
    order.verifiedPaymentId = paymentId;

    return res.json({ success: true, batchId: order.batchId, planId: order.planId, entitlement });
  } catch (error) {
    return res.status(502).json({ message: 'Could not verify payment with Razorpay. Please retry verification.' });
  }
}

function getEntitlements(req, res) {
  res.json({ purchasedBatches: purchasedBatchesByUserId.get(req.userId) || {} });
}

module.exports = { createOrder, verifyPayment, getEntitlements, isValidSignature };