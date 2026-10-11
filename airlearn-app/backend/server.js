const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const requestLogger = require('./src/middleware/request-logger');
const logger = require('./src/services/logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(requestLogger);
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true }));
app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payments', paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `No route for ${req.method} ${req.path}` });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info('server_listening', { module: 'backend', port: PORT });
});
