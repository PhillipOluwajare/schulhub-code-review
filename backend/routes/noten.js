const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const {
  alleNoten,
  notenHinzufuegen,
  notenBearbeiten,
  notenLoeschen,
  getEinstellungen,
  saveEinstellungen,
  alleFachEinstellungen,
  fachEinstellungenSpeichern,
} = require('../controllers/notenController')

// IMPORTANT: specific routes must be registered BEFORE the /:id
// wildcard routes below. Express matches in registration order —
// if PUT /:id came first, "PUT /einstellungen" would match it with
// id="einstellungen" and silently hit the wrong handler.
router.get('/einstellungen', auth, getEinstellungen)
router.put('/einstellungen', auth, saveEinstellungen)

router.get('/fach-einstellungen', auth, alleFachEinstellungen)
router.put('/fach-einstellungen/:fach', auth, fachEinstellungenSpeichern)

router.get('/',       auth, alleNoten)
router.post('/',      auth, notenHinzufuegen)
router.put('/:id',    auth, notenBearbeiten)
router.delete('/:id', auth, notenLoeschen)

module.exports = router
