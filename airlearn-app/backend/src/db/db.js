// OTP challenges and payment state are temporary; user profiles live in Supabase.
const otpsByPhoneKey = new Map(); // key -> { code, expiresAt }
const razorpayOrdersById = new Map(); // orderId -> pending checkout metadata
const purchasedBatchesByUserId = new Map(); // userId -> { [batchId]: entitlement }

function phoneKey(dialCode, phone) {
  return `${dialCode}${phone}`;
}

module.exports = {
  otpsByPhoneKey,
  razorpayOrdersById,
  purchasedBatchesByUserId,
  phoneKey,
};
