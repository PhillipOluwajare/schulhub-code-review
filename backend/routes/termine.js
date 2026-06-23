const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { termineHinzufuegen, terminBearbeiten, termineAbrufen, termineKommend, termineLoeschen } = require('../controllers/termineController')

router.post('/', auth, termineHinzufuegen)
router.put('/:id', auth, terminBearbeiten)
router.get('/kommend', auth, termineKommend)
router.get('/', auth, termineAbrufen)
router.delete('/:id', auth, termineLoeschen)

module.exports = router
