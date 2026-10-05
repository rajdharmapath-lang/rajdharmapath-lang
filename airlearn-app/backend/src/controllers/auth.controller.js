const userRepository = require('../db/user.repository');
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

async function verifyOtpHandler(req, res) {
  const { phone, dialCode, code } = req.body;
  if (!phone || !dialCode || !code) {
    return res.status(400).json({ message: 'phone, dialCode and code are required' });
  }

  const isValid = verifyOtp(dialCode, phone, code);
  if (!isValid) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  let user;
  let isNewUser;
  try {
    const result = await userRepository.getOrCreateUserByPhone(dialCode, phone);
    user = result.user;
    isNewUser = result.created || !user.name || !user.email || !user.occupation;
  } catch (error) {
    return res.status(503).json({ message: 'Could not load your account from the database.' });
  }

  const token = issueToken(user.id);

  res.json({
    token,
    isNewUser,
    user: isNewUser ? null : user,
  });
}

module.exports = { sendOtp, verifyOtp: verifyOtpHandler };
