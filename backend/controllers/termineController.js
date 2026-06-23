const pool = require('../db')

// ─── Shared helpers ───────────────────────────────────────────────────────────

function zeitZuInt(str) {
  if (typeof str === 'number') return str
  const [h, m] = str.split(':').map(Number)
  return h * 100 + m
}

function validiereTerminFelder(titel, datum, startzeit, endzeit, notiz) {
  if (!titel || !datum || startzeit == null || endzeit == null)
    return 'Titel, Datum, Startzeit und Endzeit sind erforderlich.'
  if (titel.trim().length > 200)
    return 'Titel ist zu lang (max. 200 Zeichen).'
  if (notiz && notiz.length > 1000)
    return 'Notiz ist zu lang (max. 1000 Zeichen).'
  if (isNaN(Date.parse(datum)))
    return 'Ungültiges Datum.'
  return null
}

// ─── Handlers ────────────────────────────────────────────────────────────────

// POST /termine
async function termineHinzufuegen(req, res) {
  const schuelerId = req.user.id
  const { titel, datum, startzeit, endzeit, notiz } = req.body

  const fehler = validiereTerminFelder(titel, datum, startzeit, endzeit, notiz)
  if (fehler) return res.status(400).json({ fehler })

  const startzeitInt = zeitZuInt(startzeit)
  const endzeitInt   = zeitZuInt(endzeit)

  if (endzeitInt <= startzeitInt) {
    return res.status(400).json({ fehler: 'Endzeit muss nach Startzeit liegen.' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO termine (schueler_id, titel, datum, startzeit, endzeit, notiz)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [schuelerId, titel.trim(), datum, startzeitInt, endzeitInt, notiz?.trim() || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('termineHinzufuegen error:', err)
    res.status(500).json({ fehler: 'Termin konnte nicht gespeichert werden.' })
  }
}

// PUT /termine/:id
async function terminBearbeiten(req, res) {
  const schuelerId = req.user.id
  const { titel, datum, startzeit, endzeit, notiz } = req.body

  const fehler = validiereTerminFelder(titel, datum, startzeit, endzeit, notiz)
  if (fehler) return res.status(400).json({ fehler })

  const startzeitInt = zeitZuInt(startzeit)
  const endzeitInt   = zeitZuInt(endzeit)

  if (endzeitInt <= startzeitInt) {
    return res.status(400).json({ fehler: 'Endzeit muss nach Startzeit liegen.' })
  }

  try {
    const result = await pool.query(
      `UPDATE termine
       SET titel = $1, datum = $2, startzeit = $3, endzeit = $4, notiz = $5
       WHERE id = $6 AND schueler_id = $7
       RETURNING *`,
      [titel.trim(), datum, startzeitInt, endzeitInt, notiz?.trim() || null,
       req.params.id, schuelerId]
    )
    if (result.rowCount === 0)
      return res.status(404).json({ fehler: 'Termin nicht gefunden.' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('terminBearbeiten error:', err)
    res.status(500).json({ fehler: 'Termin konnte nicht bearbeitet werden.' })
  }
}

// GET /termine?datum=YYYY-MM-DD
async function termineAbrufen(req, res) {
  const schuelerId = req.user.id
  const { datum } = req.query

  if (!datum) {
    return res.status(400).json({ fehler: 'Datum fehlt.' })
  }

  try {
    const result = await pool.query(
      `SELECT * FROM termine
       WHERE schueler_id = $1 AND datum = $2
       ORDER BY startzeit ASC`,
      [schuelerId, datum]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('termineAbrufen error:', err)
    res.status(500).json({ fehler: 'Termine konnten nicht geladen werden.' })
  }
}

// GET /termine/kommend — all upcoming termine from today onwards
async function termineKommend(req, res) {
  const schuelerId = req.user.id
  const heute = new Date()
  const heuteStr = `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, '0')}-${String(heute.getDate()).padStart(2, '0')}`

  try {
    const result = await pool.query(
      `SELECT * FROM termine
       WHERE schueler_id = $1 AND datum >= $2
       ORDER BY datum ASC, startzeit ASC`,
      [schuelerId, heuteStr]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('termineKommend error:', err)
    res.status(500).json({ fehler: 'Termine konnten nicht geladen werden.' })
  }
}

// DELETE /termine/:id
async function termineLoeschen(req, res) {
  const schuelerId = req.user.id
  const { id } = req.params

  try {
    const result = await pool.query(
      `DELETE FROM termine WHERE id = $1 AND schueler_id = $2 RETURNING id`,
      [id, schuelerId]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ fehler: 'Termin nicht gefunden.' })
    }
    res.json({ geloescht: true })
  } catch (err) {
    console.error('termineLoeschen error:', err)
    res.status(500).json({ fehler: 'Termin konnte nicht gelöscht werden.' })
  }
}

module.exports = { termineHinzufuegen, terminBearbeiten, termineAbrufen, termineKommend, termineLoeschen }
