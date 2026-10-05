const jwt = require('jsonwebtoken');
const userRepository = require('../db/user.repository');

// Dev-only secret — replace with a real secret from an environment variable
// before this is ever deployed anywhere.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

function issueToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Missing authorization token' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await userRepository.getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: 'Account no longer exists' });
    }
    req.userId = payload.userId;
    next();
  } catch (error) {
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
      return res.status(503).json({ message: 'Could not validate your account with the database.' });
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { issueToken, requireAuth, JWT_SECRET };
