const express = require('express');
const router = express.Router();
const { getStundenplan, webuntisZugangsdatenSpeichern, credentialsStatus, webuntisAbmelden } = require('../controllers/stundenplanController');
const authMiddleware = require('../middleware/auth');

router.get('/credentials-status', authMiddleware, credentialsStatus)
router.post('/zugangsdaten', authMiddleware, webuntisZugangsdatenSpeichern)
router.delete('/zugangsdaten', authMiddleware, webuntisAbmelden)
router.get('/woche', authMiddleware, getStundenplan)


module.exports = router;