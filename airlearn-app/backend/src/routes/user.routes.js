const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const {
	createAccount,
	updateProfile,
	setLanguage,
	getMe,
	deleteAccount,
	downloadLearningPdf,
} = require('../controllers/user.controller');

const router = express.Router();

router.use(requireAuth);
router.post('/create-account', createAccount);
router.patch('/profile', updateProfile);
router.post('/set-language', setLanguage);
router.get('/me', getMe);
router.delete('/account', deleteAccount);
router.get('/learning-pdf', downloadLearningPdf);

module.exports = router;
