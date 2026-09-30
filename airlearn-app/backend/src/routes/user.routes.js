const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const {
	createAccount,
	updateProfile,
	setLanguage,
	getMe,
	deleteAccount,
} = require('../controllers/user.controller');

const router = express.Router();

router.use(requireAuth);
router.post('/create-account', createAccount);
router.patch('/profile', updateProfile);
router.post('/set-language', setLanguage);
router.get('/me', getMe);
router.delete('/account', deleteAccount);

module.exports = router;
