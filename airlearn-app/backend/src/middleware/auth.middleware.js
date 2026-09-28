const jwt = require('jsonwebtoken');

// Dev-only secret — replace with a real secret from an environment variable
// before this is ever deployed anywhere.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

function issueToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Missing authorization token' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { issueToken, requireAuth, JWT_SECRET };
