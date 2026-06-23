// backend/routes/auth.js
// CRITICAL: ausloggen MUST be in this destructure or server crashes on boot.
// Missing it causes: TypeError: Route.post() requires a callback function but got [object Undefined]
// That error prevents ANY route from registering, taking the whole server down.

const express = require('express')
const router = express.Router()
const {
  registrieren,
  einloggen,
  ausloggen,              // ← server crash if this is missing from the import
  emailVerifizieren,
  codeNeuSenden,
  emailAendern,
  passwortVergessen,
  passwortZuruecksetzen,
} = require('../controllers/authController')

router.post('/registrieren',          registrieren)
router.post('/einloggen',             einloggen)
router.post('/ausloggen',             ausloggen)
router.post('/verifizieren',          emailVerifizieren)
router.post('/code-neu-senden',       codeNeuSenden)
router.post('/email-aendern',         emailAendern)
router.post('/passwort-vergessen',    passwortVergessen)
router.post('/passwort-zuruecksetzen', passwortZuruecksetzen)

module.exports = router
