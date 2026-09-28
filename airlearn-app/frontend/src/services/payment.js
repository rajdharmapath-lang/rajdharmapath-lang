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
export async function processPayment(order) {
  // Simulated network + checkout-sheet delay.
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // Simulated outcome: succeeds most of the time so the happy path is easy to
  // test, but occasionally fails so the failure screen/retry path is exercised too.
  const success = Math.random() > 0.15;

  if (success) {
    return { success: true, paymentId: `sim_${Date.now()}` };
  }
  return { success: false, reason: 'Payment was not completed.' };
}
