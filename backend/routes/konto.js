const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const pool = require('../db')
const authMiddleware = require('../middleware/auth')

// POST /api/konto/loeschen — account deletion
// Changed from DELETE / to POST /loeschen because Nginx strips
// request bodies from DELETE requests, causing passwort to be
// undefined and the check to return 400 "Passwort erforderlich"
// every time, regardless of what the user types.
//
// FIX June 20 evening, aux security review — two changes:
//
// 1. The five deletes now run inside a real BEGIN/COMMIT transaction on a
//    single checked-out client, with ROLLBACK on any failure. Previously
//    they were five independent pool.query() calls — if the process died
//    or a connection dropped mid-sequence, you could end up with some
//    child tables cleared and others not, or the schueler row gone while
//    child data lingered. For a GDPR Art. 17 deletion path specifically,
//    "definitely all-or-nothing" matters more than almost anywhere else
//    in the app.
//
// 2. Added explicit deletes for noten_einstellungen and
//    noten_fach_einstellungen. These two tables were added in Layer 3b
//    (June 19) and were never added here — every OTHER child table
//    (noten, termine, hausaufgaben, stundenplan_cache) gets an explicit
//    defensive delete per the comment below, but these two were quietly
//    relying on CASCADE alone. Both DO have CASCADE DELETE on schueler_id
//    per the schema, so this was never actually broken — but it was an
//    inconsistency with the stated intent ("explicit deletes... make
//    GDPR Art. 17 compliance intent explicit in the code"), and cheap to
//    close while already touching this file.
//
// FIX June 20 evening, second pass (main account) — pool.connect() moved
// INSIDE the try block. As handed off, it sat above the try, so if
// acquiring a client ever rejected (pool exhausted — max: 10,
// connectionTimeoutMillis: 2000 in db/index.js, so this is a real failure
// mode under concurrent load, not theoretical) the rejection was never
// caught: no response would be sent, and depending on Node's
// unhandled-rejection handling this can take the whole process down with
// it — the exact failure class the pool.on('error') fix elsewhere in this
// same review exists to prevent, just triggered from a different angle
// (acquiring a new client, not an idle one erroring). `client` is declared
// with `let` outside the try so catch/finally can check it's defined
// before calling ROLLBACK or release() on it.
router.post('/loeschen', authMiddleware, async (req, res) => {
  const { passwort } = req.body
  const schueler_id = req.user.id

  if (!passwort) {
    return res.status(400).json({ fehler: 'Passwort erforderlich.' })
  }

  let client
  try {
    client = await pool.connect()

    const userRes = await client.query(
      'SELECT passwort FROM schueler WHERE id = $1',
      [schueler_id]
    )

    if (userRes.rows.length === 0) {
      return res.status(404).json({ fehler: 'Konto nicht gefunden.' })
    }

    const passwortKorrekt = await bcrypt.compare(passwort, userRes.rows[0].passwort)
    if (!passwortKorrekt) {
      return res.status(401).json({ fehler: 'Passwort ist falsch.' })
    }

    // Explicit deletes on all child tables before deleting the user.
    // CASCADE handles this automatically, but explicit deletes are defensive:
    // they work even if CASCADE is ever removed from any FK constraint,
    // and make GDPR Art. 17 compliance intent explicit in the code.
    await client.query('BEGIN')
    await client.query('DELETE FROM noten WHERE schueler_id = $1', [schueler_id])
    await client.query('DELETE FROM noten_einstellungen WHERE schueler_id = $1', [schueler_id])
    await client.query('DELETE FROM noten_fach_einstellungen WHERE schueler_id = $1', [schueler_id])
    await client.query('DELETE FROM termine WHERE schueler_id = $1', [schueler_id])
    await client.query('DELETE FROM hausaufgaben WHERE schueler_id = $1', [schueler_id])
    await client.query('DELETE FROM stundenplan_cache WHERE schueler_id = $1', [schueler_id])
    await client.query('DELETE FROM schueler WHERE id = $1', [schueler_id])
    await client.query('COMMIT')

    // Clear the cookie on deletion — the JWT stays valid until expiry otherwise.
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'strict' })
    return res.status(200).json({ nachricht: 'Konto erfolgreich gelöscht.' })
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {})
    console.error('Konto löschen Fehler:', err)
    return res.status(500).json({ fehler: 'Serverfehler. Bitte später nochmal versuchen.' })
  } finally {
    if (client) client.release()
  }
})

module.exports = router