const { randomUUID } = require('node:crypto');
const logger = require('../services/logger');

function requestLogger(req, res, next) {
  const startedAt = Date.now();
  const requestId = randomUUID();
  const module = req.path.split('/')[2] || 'system';
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  logger.info('http_request_started', {
    requestId,
    module,
    method: req.method,
    path: req.path,
  });

  res.once('finish', () => {
    logger.info('http_request_completed', {
      requestId,
      module,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });
  next();
}

module.exports = requestLogger;
