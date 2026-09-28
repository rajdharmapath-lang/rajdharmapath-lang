const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { createAccount, updateProfile, setLanguage, getMe } = require('../controllers/user.controller');

const router = express.Router();

router.use(requireAuth);
router.post('/create-account', createAccount);
router.patch('/profile', updateProfile);
router.post('/set-language', setLanguage);
router.get('/me', getMe);

module.exports = router;
