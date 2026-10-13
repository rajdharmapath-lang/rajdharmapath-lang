const express = require('express');
const { sendOtp, retryOtp, verifyOtp } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/retry-otp', retryOtp);
router.post('/verify-otp', verifyOtp);

module.exports = router;
