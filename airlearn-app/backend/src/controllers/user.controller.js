const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  usersById,
  usersByPhoneKey,
  phoneKey,
  otpsByPhoneKey,
  tokensToUserId,
  purchasedBatchesByUserId,
  razorpayOrdersById,
} = require('../db/db');

const LEARNING_PDF_PATH = path.resolve(
  process.env.LEARNING_PDF_PATH ||
    path.join(os.homedir(), 'Downloads', 'RD chinese workbook.pdf')
);

function getCurrentUser(req) {
  return usersById.get(req.userId);
}

function createAccount(req, res) {
  const user = getCurrentUser(req);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { name, email, occupation } = req.body;
  if (!name || !email || !occupation) {
    return res.status(400).json({ message: 'name, email and occupation are required' });
  }
  user.name = name;
  user.email = email;
  user.occupation = occupation;
  res.json({ user });
}

function updateProfile(req, res) {
  const user = getCurrentUser(req);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { name, email, occupation } = req.body;
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (occupation !== undefined) user.occupation = occupation;
  res.json({ user });
}

function setLanguage(req, res) {
  const user = getCurrentUser(req);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { language } = req.body;
  if (!['tamil', 'english'].includes(language)) {
    return res.status(400).json({ message: "language must be 'tamil' or 'english'" });
  }
  user.language = language;
  res.json({ user });
}

function getMe(req, res) {
  const user = getCurrentUser(req);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
}

function deleteAccount(req, res) {
  const user = getCurrentUser(req);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const key = phoneKey(user.dialCode, user.phone);
  usersById.delete(user.id);
  usersByPhoneKey.delete(key);
  otpsByPhoneKey.delete(key);
  purchasedBatchesByUserId.delete(user.id);

  for (const [orderId, order] of razorpayOrdersById) {
    if (order.userId === user.id) razorpayOrdersById.delete(orderId);
  }

  for (const [token, userId] of tokensToUserId) {
    if (userId === user.id) tokensToUserId.delete(token);
  }

  res.json({ success: true });
}

function downloadLearningPdf(req, res) {
  if (!fs.existsSync(LEARNING_PDF_PATH)) {
    return res.status(404).json({ message: 'The learning PDF is not available.' });
  }

  res.download(LEARNING_PDF_PATH, 'RD chinese workbook.pdf', (error) => {
    if (error && !res.headersSent) {
      res.status(500).json({ message: 'Could not download the learning PDF.' });
    }
  });
}

module.exports = {
  createAccount,
  updateProfile,
  setLanguage,
  getMe,
  deleteAccount,
  downloadLearningPdf,
};
