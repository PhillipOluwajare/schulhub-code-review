const db = require('../db')

// ─── Shared validation ────────────────────────────────────────────────────────

function validiereHausaufgabenFelder(fach, beschreibung, faellig_am) {
  if (!fach || !fach.trim())
    return 'Fach ist erforderlich.'
  if (fach.trim().length > 100)
    return 'Fach ist zu lang (max. 100 Zeichen).'
  if (beschreibung && beschreibung.length > 2000)
    return 'Beschreibung ist zu lang (max. 2000 Zeichen).'
  if (!faellig_am || isNaN(Date.parse(faellig_am)))
    return 'Ungültiges oder fehlendes Datum.'
  return null
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function alleHausaufgaben(req, res) {
  try {
    const result = await db.query(
      'SELECT * FROM hausaufgaben WHERE schueler_id = $1 ORDER BY faellig_am ASC',
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('alleHausaufgaben error:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Laden' })
  }
}

async function hinzufuegen(req, res) {
  const { fach, beschreibung, faellig_am } = req.body

  const fehler = validiereHausaufgabenFelder(fach, beschreibung, faellig_am)
  if (fehler) return res.status(400).json({ fehler })

  try {
    const result = await db.query(
      'INSERT INTO hausaufgaben (schueler_id, fach, beschreibung, faellig_am) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, fach.trim(), beschreibung?.trim() || null, faellig_am]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('hinzufuegen error:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Hinzufügen' })
  }
}

async function hausaufgabeBearbeiten(req, res) {
  const { fach, beschreibung, faellig_am } = req.body

  const fehler = validiereHausaufgabenFelder(fach, beschreibung, faellig_am)
  if (fehler) return res.status(400).json({ fehler })

  try {
    const result = await db.query(
      `UPDATE hausaufgaben
       SET fach = $1, beschreibung = $2, faellig_am = $3
       WHERE id = $4 AND schueler_id = $5
       RETURNING *`,
      [fach.trim(), beschreibung?.trim() || null, faellig_am, req.params.id, req.user.id]
    )
    if (result.rowCount === 0)
      return res.status(404).json({ fehler: 'Hausaufgabe nicht gefunden.' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('hausaufgabeBearbeiten error:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Bearbeiten.' })
  }
}

async function erledigen(req, res) {
  try {
    const result = await db.query(
      'UPDATE hausaufgaben SET erledigt = TRUE WHERE id = $1 AND schueler_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ fehler: 'Hausaufgabe nicht gefunden.' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('erledigen error:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Aktualisieren' })
  }
}

async function loeschen(req, res) {
  try {
    const result = await db.query(
      'DELETE FROM hausaufgaben WHERE id = $1 AND schueler_id = $2',
      [req.params.id, req.user.id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ fehler: 'Hausaufgabe nicht gefunden.' })
    }
    res.json({ nachricht: 'Gelöscht' })
  } catch (err) {
    console.error('loeschen error:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Löschen' })
  }
}

module.exports = { alleHausaufgaben, hinzufuegen, hausaufgabeBearbeiten, erledigen, loeschen }