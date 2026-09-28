const { usersByPhoneKey, phoneKey, createUser, tokensToUserId } = require('../db/db');
const { generateOtp, verifyOtp } = require('../services/otp.service');
const { issueToken } = require('../middleware/auth.middleware');

function sendOtp(req, res) {
  const { phone, dialCode } = req.body;
  if (!phone || !dialCode) {
    return res.status(400).json({ message: 'phone and dialCode are required' });
  }
  generateOtp(dialCode, phone);
  res.json({ success: true });
}

function verifyOtpHandler(req, res) {
  const { phone, dialCode, code } = req.body;
  if (!phone || !dialCode || !code) {
    return res.status(400).json({ message: 'phone, dialCode and code are required' });
  }

  const isValid = verifyOtp(dialCode, phone, code);
  if (!isValid) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  let user = usersByPhoneKey.get(phoneKey(dialCode, phone));
  const isNewUser = !user;
  if (!user) {
    user = createUser(dialCode, phone);
  }

  const token = issueToken(user.id);
  tokensToUserId.set(token, user.id);

  res.json({
    token,
    isNewUser,
    user: isNewUser ? null : user, // existing users go straight to Home with their profile
  });
}

module.exports = { sendOtp, verifyOtp: verifyOtpHandler };
