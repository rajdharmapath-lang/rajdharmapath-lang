// --- Razorpay integration point ----------------------------------------------
// Once you have a Razorpay key, replace the body of processPayment. Typical flow:
//
//   1. Call your backend to create an order: POST /api/payments/create-order
//      { planId, amount } -> { orderId, razorpayKeyId, amount, currency }
//   2. Open Razorpay checkout (react-native-razorpay):
//        import RazorpayCheckout from 'react-native-razorpay';
//        const result = await RazorpayCheckout.open({
//          key: razorpayKeyId,
//          order_id: orderId,
//          amount,
//          currency: 'INR',
//          name: 'Raj Dharma',
//        });
//   3. Verify the payment signature on your backend: POST /api/payments/verify
//      { orderId, paymentId, signature } -> { success: true/false }
//   4. Resolve processPayment with that verified result.
//
// Keep the processPayment(order) call signature the same in the screens — only
// this file needs to change when Razorpay is wired in.
// ------------------------------------------------------------------------------

/**
 * Processes a payment for a given order.
 * Currently simulates a Razorpay checkout + backend verification round-trip so
 * the Checkout → Success/Failed flow is fully testable before Razorpay is wired in.
 *
 * @param {{ planId: string, amount: number }} order
 * @returns {Promise<{ success: boolean, paymentId?: string, reason?: string }>}
 */
import RazorpayCheckout from 'react-native-razorpay';
import { paymentApi } from '../api/client';

export async function processPayment({ planId, couponCode }) {
  const { data: order } = await paymentApi.createOrder({ planId, couponCode });

  let checkoutResult;
  try {
    checkoutResult = await RazorpayCheckout.open({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: 'Raj Dharma',
      description: 'Course access',
      theme: { color: '#730B07' },
    });
  } catch (error) {
    const cancelled = error?.code === 0 || error?.code === 'payment_cancelled';
    console.error('[payment] Razorpay checkout failed', {
      code: error?.code,
      message: error?.message || error?.description || String(error),
    });
    return {
      success: false,
      cancelled,
      errorCode: error?.code,
      reason: error?.description || error?.message || 'Payment was not completed.',
    };
  }

  const { data: verification } = await paymentApi.verifyPayment({
    razorpay_order_id: checkoutResult.razorpay_order_id || order.orderId,
    razorpay_payment_id: checkoutResult.razorpay_payment_id,
    razorpay_signature: checkoutResult.razorpay_signature,
  });

  return {
    ...verification,
    success: verification.success === true,
    paymentId: checkoutResult.razorpay_payment_id,
  };
}
