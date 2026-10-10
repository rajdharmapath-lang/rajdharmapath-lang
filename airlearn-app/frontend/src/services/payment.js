/**
 * Processes a payment for a given order.
 * Creates a server-side Razorpay order, launches the native checkout, and asks
 * the backend to verify the captured payment before reporting success.
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
    if (!cancelled) {
      console.error('[payment] Razorpay checkout failed', {
        code: error?.code,
        message: error?.message || error?.description || String(error),
      });
    }
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
