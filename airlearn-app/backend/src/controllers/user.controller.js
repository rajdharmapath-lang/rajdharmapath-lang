const {
  usersById,
  usersByPhoneKey,
  phoneKey,
  otpsByPhoneKey,
  tokensToUserId,
} = require('../db/db');

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

  for (const [token, userId] of tokensToUserId) {
    if (userId === user.id) tokensToUserId.delete(token);
  }

  res.json({ success: true });
}

module.exports = { createAccount, updateProfile, setLanguage, getMe, deleteAccount };
