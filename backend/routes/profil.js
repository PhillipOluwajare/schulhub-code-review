// backend/routes/profil.js
// BUG FIXED: Previously required `klasse` for ALL users.
// AKS and Justus students have no class structure — their klasse column is NULL.
// The old required check caused 400 on every profile save for these users.
// Fix: fetch school first, only validate/pass klasse for KST and GAV.
//
// BUG FIXED (June 22 2026): whitespace-only vorname/nachname (e.g. "   ") passed the
// !vorname / !nachname check — a non-empty string is truthy — but then got trimmed to ""
// before being saved, silently writing an empty name to the DB. Fixed by trimming first,
// then validating the trimmed result, and using the trimmed values everywhere downstream.

const express = require('express')
const router = express.Router()
const pool   = require('../db/index')
const auth   = require('../middleware/auth')

const SCHULEN_MIT_KLASSE = ['KST', 'GAV']

// ── GET /profil ──────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vorname, nachname, email, klasse, geburtsdatum, schule, benachrichtigungen
       FROM schueler WHERE id = $1`,
      [req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ fehler: 'Nutzer nicht gefunden' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('Profil GET Fehler:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Laden des Profils' })
  }
})

// ── PUT /profil ──────────────────────────────────────────────────────────────
router.put('/', auth, async (req, res) => {
  const { vorname, nachname, geburtsdatum, klasse } = req.body

  // Trim first, then validate the trimmed result. A whitespace-only value like "   "
  // is truthy before trimming and would otherwise slip past a bare !vorname check.
  const vornameTrim = typeof vorname === 'string' ? vorname.trim() : ''
  const nachnameTrim = typeof nachname === 'string' ? nachname.trim() : ''

  try {
    if (!vornameTrim || !nachnameTrim) {
      return res.status(400).json({ fehler: 'Vor- und Nachname sind erforderlich' })
    }

    // Length validation — prevents oversized strings hitting DB
    if (vornameTrim.length > 50) {
      return res.status(400).json({ fehler: 'Vorname ist zu lang (max. 50 Zeichen).' })
    }
    if (nachnameTrim.length > 50) {
      return res.status(400).json({ fehler: 'Nachname ist zu lang (max. 50 Zeichen).' })
    }
    // Validate date format if provided — prevents "notadate" causing a 500
    if (geburtsdatum && isNaN(Date.parse(geburtsdatum))) {
      return res.status(400).json({ fehler: 'Ungültiges Geburtsdatum.' })
    }

    // Determine if this school uses a class structure
    const schuelerResult = await pool.query(
      'SELECT schule FROM schueler WHERE id = $1',
      [req.user.id]
    )
    if (schuelerResult.rows.length === 0) {
      return res.status(404).json({ fehler: 'Nutzer nicht gefunden' })
    }
    const { schule } = schuelerResult.rows[0]
    const hatKlasse = SCHULEN_MIT_KLASSE.includes(schule)

    // Only write klasse for KST/GAV — always NULL for AKS/Justus
    const neueKlasse = hatKlasse ? (klasse || null) : null

    const result = await pool.query(
      `UPDATE schueler
       SET vorname = $1, nachname = $2, geburtsdatum = $3, klasse = $4
       WHERE id = $5
       RETURNING vorname, nachname, klasse, geburtsdatum`,
      [vornameTrim, nachnameTrim, geburtsdatum || null, neueKlasse, req.user.id]
    )

    res.json({ nachricht: 'Profil gespeichert', profil: result.rows[0] })
  } catch (err) {
    console.error('Profil PUT Fehler:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Speichern des Profils' })
  }
})

module.exports = router
