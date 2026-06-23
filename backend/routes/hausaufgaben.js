const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { alleHausaufgaben, hinzufuegen, hausaufgabeBearbeiten, erledigen, loeschen } = require('../controllers/hausaufgabenController')

router.get('/', auth, alleHausaufgaben)
router.post('/', auth, hinzufuegen)
router.put('/:id', auth, hausaufgabeBearbeiten)
router.patch('/:id/erledigen', auth, erledigen)
router.delete('/:id', auth, loeschen)

module.exports = router