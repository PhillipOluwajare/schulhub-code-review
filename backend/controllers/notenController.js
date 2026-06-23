const pool = require('../db')

// ============================================================
// Grades (noten) — existing endpoints, extended for Oberstufe
// ============================================================

async function alleNoten(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM noten WHERE schueler_id = $1 ORDER BY datum DESC, erstellt_am DESC',
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('alleNoten error:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Laden der Noten.' })
  }
}

// notensystem-aware validation — sek1: 1-6, oberstufe: 0-15 (Punkte)
function validiereNotenFelder({ fach, wert, typ, datum, notiz, notensystem, schuljahr, halbjahr }) {
  if (!fach || !fach.trim()) return 'Fach ist erforderlich.'
  if (fach.trim().length > 100) return 'Fach ist zu lang (max. 100 Zeichen).'

  const system = notensystem === 'oberstufe' ? 'oberstufe' : 'sek1'
  const wertInt = parseInt(wert)
  if (system === 'oberstufe') {
    if (isNaN(wertInt) || wertInt < 0 || wertInt > 15) return 'Punkte müssen zwischen 0 und 15 liegen.'
  } else {
    if (isNaN(wertInt) || wertInt < 1 || wertInt > 6) return 'Note muss zwischen 1 und 6 liegen.'
  }

  const erlaubteTypen = ['klassenarbeit', 'muendlich', 'sonstige']
  if (!erlaubteTypen.includes(typ)) return 'Ungültiger Notentyp.'
  if (!datum) return 'Datum ist erforderlich.'
  if (isNaN(Date.parse(datum))) return 'Ungültiges Datum.'
  if (notiz && notiz.trim().length > 1000) return 'Notiz ist zu lang (max. 1000 Zeichen).'

  if (schuljahr !== undefined && schuljahr !== null && schuljahr !== '') {
    const sjInt = parseInt(schuljahr)
    if (isNaN(sjInt) || sjInt < 2000 || sjInt > 2100) return 'Ungültiges Schuljahr.'
  }
  if (halbjahr !== undefined && halbjahr !== null && halbjahr !== '') {
    const hjInt = parseInt(halbjahr)
    if (![1, 2].includes(hjInt)) return 'Halbjahr muss 1 oder 2 sein.'
  }

  return null
}

async function notenHinzufuegen(req, res) {
  const { fach, wert, typ, datum, notiz, notensystem, schuljahr, halbjahr } = req.body
  const fehler = validiereNotenFelder({ fach, wert, typ, datum, notiz, notensystem, schuljahr, halbjahr })
  if (fehler) return res.status(400).json({ fehler })

  const system = notensystem === 'oberstufe' ? 'oberstufe' : 'sek1'

  try {
    const result = await pool.query(
      `INSERT INTO noten (schueler_id, fach, wert, typ, datum, notiz, notensystem, schuljahr, halbjahr)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.user.id,
        fach.trim(),
        parseInt(wert),
        typ,
        datum,
        notiz?.trim() || null,
        system,
        schuljahr ? parseInt(schuljahr) : null,
        halbjahr ? parseInt(halbjahr) : null,
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('notenHinzufuegen error:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Speichern.' })
  }
}

async function notenBearbeiten(req, res) {
  const { fach, wert, typ, datum, notiz, notensystem, schuljahr, halbjahr } = req.body
  const fehler = validiereNotenFelder({ fach, wert, typ, datum, notiz, notensystem, schuljahr, halbjahr })
  if (fehler) return res.status(400).json({ fehler })

  const system = notensystem === 'oberstufe' ? 'oberstufe' : 'sek1'

  try {
    const result = await pool.query(
      `UPDATE noten
       SET fach = $1, wert = $2, typ = $3, datum = $4, notiz = $5,
           notensystem = $6, schuljahr = $7, halbjahr = $8
       WHERE id = $9 AND schueler_id = $10
       RETURNING *`,
      [
        fach.trim(),
        parseInt(wert),
        typ,
        datum,
        notiz?.trim() || null,
        system,
        schuljahr ? parseInt(schuljahr) : null,
        halbjahr ? parseInt(halbjahr) : null,
        req.params.id,
        req.user.id,
      ]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ fehler: 'Note nicht gefunden.' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('notenBearbeiten error:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Aktualisieren.' })
  }
}

async function notenLoeschen(req, res) {
  try {
    const result = await pool.query(
      'DELETE FROM noten WHERE id = $1 AND schueler_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ fehler: 'Note nicht gefunden.' })
    }
    res.json({ geloescht: true })
  } catch (err) {
    console.error('notenLoeschen error:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Löschen.' })
  }
}

// ============================================================
// Global Noten preferences (one row per user) — drives the
// setup flow and which mode (sek1 / oberstufe) Noten.jsx renders.
// ============================================================

function validiereEinstellungen({ noten_modus, schuljahr_beginn, setup_done }) {
  const erlaubteModi = ['sek1', 'oberstufe']
  if (!erlaubteModi.includes(noten_modus)) return 'Ungültiger Noten-Modus.'

  if (schuljahr_beginn !== null && schuljahr_beginn !== undefined && schuljahr_beginn !== '') {
    const sjInt = parseInt(schuljahr_beginn)
    if (isNaN(sjInt) || sjInt < 2000 || sjInt > 2100) return 'Ungültiges Schuljahr.'
  }

  if (typeof setup_done !== 'boolean') return 'setup_done muss ein Boolean sein.'

  return null
}

async function getEinstellungen(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM noten_einstellungen WHERE schueler_id = $1',
      [req.user.id]
    )
    if (result.rowCount === 0) {
      // No row yet = first visit. Not an error — frontend uses this
      // to trigger the setup flow. No row is written until the
      // first PUT (either via setup completion or the silent
      // Berufsschule auto-skip).
      return res.json({
        schueler_id: req.user.id,
        noten_modus: 'sek1',
        schuljahr_beginn: null,
        setup_done: false,
      })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('getEinstellungen error:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Laden der Einstellungen.' })
  }
}

async function saveEinstellungen(req, res) {
  const { noten_modus, schuljahr_beginn, setup_done } = req.body
  const fehler = validiereEinstellungen({ noten_modus, schuljahr_beginn, setup_done })
  if (fehler) return res.status(400).json({ fehler })

  try {
    const result = await pool.query(
      `INSERT INTO noten_einstellungen (schueler_id, noten_modus, schuljahr_beginn, setup_done)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (schueler_id) DO UPDATE
       SET noten_modus = $2, schuljahr_beginn = $3, setup_done = $4
       RETURNING *`,
      [req.user.id, noten_modus, schuljahr_beginn ? parseInt(schuljahr_beginn) : null, setup_done]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error('saveEinstellungen error:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Speichern der Einstellungen.' })
  }
}

// ============================================================
// Per-subject settings — notensystem override, kursart (gA/eA/
// Ergänzungsfach), Klausur-Gewichtung. Keyed by (schueler_id, fach).
// ============================================================

function validiereFachEinstellungen({ notensystem, kursart, klausur_gewicht }) {
  const erlaubteSysteme = ['sek1', 'oberstufe']
  if (!erlaubteSysteme.includes(notensystem)) return 'Ungültiges Notensystem.'

  const erlaubteKursarten = ['gA', 'eA', 'ergaenzung']
  if (!erlaubteKursarten.includes(kursart)) return 'Ungültige Kursart.'

  const kgInt = parseInt(klausur_gewicht)
  if (isNaN(kgInt) || kgInt < 0 || kgInt > 100) return 'Klausurgewichtung muss zwischen 0 und 100 liegen.'

  return null
}

async function alleFachEinstellungen(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM noten_fach_einstellungen WHERE schueler_id = $1',
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('alleFachEinstellungen error:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Laden der Fach-Einstellungen.' })
  }
}

// PUT /fach-einstellungen/:fach — fach arrives URL-decoded by Express
// automatically (handles umlauts/spaces like "Gemeinschaftskunde",
// "Ernährungslehre" correctly as long as the frontend encodes the URL).
async function fachEinstellungenSpeichern(req, res) {
  const fach = req.params.fach
  if (!fach || !fach.trim()) return res.status(400).json({ fehler: 'Fach ist erforderlich.' })
  if (fach.trim().length > 100) return res.status(400).json({ fehler: 'Fach ist zu lang (max. 100 Zeichen).' })

  const { notensystem, kursart, klausur_gewicht } = req.body
  const fehler = validiereFachEinstellungen({ notensystem, kursart, klausur_gewicht })
  if (fehler) return res.status(400).json({ fehler })

  try {
    const result = await pool.query(
      `INSERT INTO noten_fach_einstellungen (schueler_id, fach, notensystem, kursart, klausur_gewicht)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (schueler_id, fach) DO UPDATE
       SET notensystem = $3, kursart = $4, klausur_gewicht = $5
       RETURNING *`,
      [req.user.id, fach.trim(), notensystem, kursart, parseInt(klausur_gewicht)]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error('fachEinstellungenSpeichern error:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Speichern der Fach-Einstellungen.' })
  }
}

module.exports = {
  alleNoten,
  notenHinzufuegen,
  notenBearbeiten,
  notenLoeschen,
  getEinstellungen,
  saveEinstellungen,
  alleFachEinstellungen,
  fachEinstellungenSpeichern,
}
