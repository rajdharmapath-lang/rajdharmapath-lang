const fs = require('fs');
const os = require('os');
const path = require('path');
const userRepository = require('../db/user.repository');
const {
  phoneKey,
  otpsByPhoneKey,
} = require('../db/db');

const LEARNING_PDF_PATH = path.resolve(
  process.env.LEARNING_PDF_PATH ||
    path.join(os.homedir(), 'Downloads', 'RD chinese workbook.pdf')
);

async function createAccount(req, res) {
  const { name, email, occupation } = req.body;
  if (!name || !email || !occupation) {
    return res.status(400).json({ message: 'name, email and occupation are required' });
  }
  try {
    const user = await userRepository.updateUser(req.userId, { name, email, occupation });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (error) {
    return res.status(503).json({ message: 'Could not save your account to the database.' });
  }
}

async function updateProfile(req, res) {
  const { name, email, occupation } = req.body;
  const fields = {};
  if (name !== undefined) fields.name = name;
  if (email !== undefined) fields.email = email;
  if (occupation !== undefined) fields.occupation = occupation;
  try {
    const user = await userRepository.updateUser(req.userId, fields);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (error) {
    return res.status(503).json({ message: 'Could not save your account to the database.' });
  }
}

async function setLanguage(req, res) {
  const { language } = req.body;
  if (!['tamil', 'english'].includes(language)) {
    return res.status(400).json({ message: "language must be 'tamil' or 'english'" });
  }
  try {
    const user = await userRepository.updateUser(req.userId, { language });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (error) {
    return res.status(503).json({ message: 'Could not save your account to the database.' });
  }
}

async function getMe(req, res) {
  try {
    const user = await userRepository.getUserById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (error) {
    return res.status(503).json({ message: 'Could not load your account from the database.' });
  }
}

async function deleteAccount(req, res) {
  let user;
  try {
    user = await userRepository.archiveAndDeleteUser(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    return res.status(503).json({ message: 'Could not delete your account from the database.' });
  }
  const key = phoneKey(user.dialCode, user.phone);
  otpsByPhoneKey.delete(key);

  return res.json({ success: true });
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
