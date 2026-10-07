const Razorpay = require('razorpay');

function createClient(keyId, keySecret) {
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

module.exports = { createClient };