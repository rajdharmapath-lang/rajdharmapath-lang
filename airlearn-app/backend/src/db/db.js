// Everything here is in-memory and resets whenever the server restarts.
// This exists so the app is genuinely runnable end-to-end locally — swap in a
// real database (Postgres/MongoDB/whatever Raj Dharma already uses) before
// this goes anywhere near production.

const usersByPhoneKey = new Map(); // key: `${dialCode}${phone}` -> user object
const usersById = new Map(); // id -> user object
const otpsByPhoneKey = new Map(); // key -> { code, expiresAt }
const tokensToUserId = new Map(); // token -> userId
const razorpayOrdersById = new Map(); // orderId -> pending checkout metadata
const purchasedBatchesByUserId = new Map(); // userId -> { [batchId]: entitlement }

let nextUserId = 1;

function phoneKey(dialCode, phone) {
  return `${dialCode}${phone}`;
}

function createUser(dialCode, phone) {
  const user = {
    id: String(nextUserId++),
    phone,
    dialCode,
    name: null,
    email: null,
    occupation: null,
    language: null,
    createdAt: Date.now(),
  };
  usersByPhoneKey.set(phoneKey(dialCode, phone), user);
  usersById.set(user.id, user);
  return user;
}

module.exports = {
  usersByPhoneKey,
  usersById,
  otpsByPhoneKey,
  tokensToUserId,
  razorpayOrdersById,
  purchasedBatchesByUserId,
  phoneKey,
  createUser,
};
