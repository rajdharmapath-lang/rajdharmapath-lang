const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { createOrder, verifyPayment, getEntitlements } = require('../controllers/payment.controller');

const router = express.Router();

router.use(requireAuth);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/entitlements', getEntitlements);

module.exports = router;