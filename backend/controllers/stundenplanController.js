const { WebUntis } = require('webuntis');
const pool = require('../db/index');
const { encrypt, decrypt } = require('../utils/webuntisCrypto');

const SCHULE_UNTIS_MAP = {
  KST:    { schulname: 'kolleg-st-thomas',  host: 'kolleg-st-thomas.webuntis.com' },
  GAV:    { schulname: 'gavec',             host: 'gavec.webuntis.com'            },
  AKS:    { schulname: 'aks',               host: 'aks.webuntis.com'              },
  Justus: { schulname: 'justus-vechta',     host: 'justus-vechta.webuntis.com'   },
}

const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const toLocalDateStr = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Weekends only — WebUntis is the source of truth for everything else.
// Holidays, public holidays, teacher-only days, cancelled weeks — all handled
// by WebUntis returning an empty array. No manual list to maintain or get wrong.
const isWeekend = (date) => {
  const day = date.getDay()
  return day === 0 || day === 6
}

const getUntisConfig = async (schuelerId) => {
  const result = await pool.query(
    'SELECT schule, webuntis_username, webuntis_password_encrypted FROM schueler WHERE id = $1',
    [schuelerId]
  )
  const schueler = result.rows[0]
  const untisConfig = SCHULE_UNTIS_MAP[schueler.schule]
  if (!untisConfig) throw new Error(`Keine WebUntis-Konfiguration für Schule: ${schueler.schule}`)
  return { schueler, untisConfig }
}

const getStundenplan = async (req, res) => {
  try {
    const datumStr = req.query.datum
      ? req.query.datum.slice(0, 10)
      : toLocalDateStr(new Date())

    const datum = parseLocalDate(datumStr)

    if (isWeekend(datum)) {
      return res.json({ stunden: [], frei: true, cached: true })
    }

    const cacheResult = await pool.query(
      `SELECT daten, abgerufen_am FROM stundenplan_cache 
       WHERE schueler_id = $1 AND datum = $2`,
      [req.user.id, datumStr]
    )

    if (cacheResult.rows.length > 0) {
      const cachedAt = new Date(cacheResult.rows[0].abgerufen_am)
      const ageMinutes = (Date.now() - cachedAt.getTime()) / 60000
      if (ageMinutes < 5) {
        return res.json({ stunden: cacheResult.rows[0].daten, cached: true })
      }
    }

    const { schueler, untisConfig } = await getUntisConfig(req.user.id)

    if (!schueler.webuntis_username || !schueler.webuntis_password_encrypted) {
      return res.status(400).json({ fehler: 'WebUntis-Zugangsdaten nicht hinterlegt' })
    }

    const passwort = decrypt(schueler.webuntis_password_encrypted)

    const untis = new WebUntis(
      untisConfig.schulname,
      schueler.webuntis_username,
      passwort,
      untisConfig.host
    )

    await untis.login()
    const session = untis.sessionInformation

    let stunden
    try {
      stunden = await untis.getOwnTimetableFor(datum)
    } catch (e) {
      // Fallback: some schools (e.g. AKS) disable personal timetable API access
      if (!session?.klasseId) throw e
      console.log(`Fallback to class timetable for schueler ${req.user.id} (klasseId: ${session.klasseId})`)
      stunden = await untis.getTimetableFor(datum, session.klasseId, 1)
    }

    await untis.logout()

    const aufbereitet = stunden.map(stunde => ({
      id:          stunde.id,
      datum:       stunde.date,
      startzeit:   stunde.startTime,
      endzeit:     stunde.endTime,
      fach:        stunde.su[0]?.longname || 'Unbekannt',
      fachKuerzel: stunde.su[0]?.name     || '',
      lehrer:      stunde.te[0]?.longname || 'Unbekannt',
      raum:        stunde.ro[0]?.name     || '',
      typ:         stunde.activityType    || null,
      ausgefallen: stunde.code === 1,
    }))

    // Group by time slot and resolve conflicts
    const zeitSlots = {}
    aufbereitet.forEach(s => {
      const key = `${s.startzeit}-${s.endzeit}`
      if (!zeitSlots[key]) zeitSlots[key] = []
      zeitSlots[key].push(s)
    })

    const gefiltert = Object.values(zeitSlots).flatMap(gruppe => {
      if (gruppe.length === 1) return gruppe

      const ohneTyp = gruppe.filter(s => !s.typ)
      const mitTyp  = gruppe.filter(s =>  s.typ)

      if (ohneTyp.length > 0 && mitTyp.length > 0) return ohneTyp

      if (mitTyp.length > 1) {
        const maxId = Math.max(...mitTyp.map(s => s.id))
        return mitTyp.filter(s => s.id === maxId)
      }

      return gruppe
    })

    gefiltert.sort((a, b) => a.startzeit - b.startzeit)

    await pool.query(
      `INSERT INTO stundenplan_cache (schueler_id, datum, daten, abgerufen_am)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (schueler_id, datum) 
       DO UPDATE SET daten = $3, abgerufen_am = NOW()`,
      [req.user.id, datumStr, JSON.stringify(gefiltert)]
    )

    res.json({ stunden: gefiltert, cached: false })

  } catch (err) {
    console.error('Stundenplan-Fehler:', err.message)
    res.status(500).json({ fehler: 'Fehler beim Laden des Stundenplans' })
  }
}

const webuntisZugangsdatenSpeichern = async (req, res) => {
  const { webuntis_username, webuntis_password } = req.body
  try {
    if (!webuntis_username || !webuntis_password) {
      return res.status(400).json({ fehler: 'Bitte beide Felder ausfüllen' })
    }

    const { schueler, untisConfig } = await getUntisConfig(req.user.id)

    if (!untisConfig) {
      return res.status(400).json({ fehler: 'Schule nicht erkannt. Bitte neu registrieren.' })
    }

    const untis = new WebUntis(
      untisConfig.schulname,
      webuntis_username,
      webuntis_password,
      untisConfig.host
    )

    await untis.login()
    await untis.logout()

    const verschluesselt = encrypt(webuntis_password)

    await pool.query(
      'UPDATE schueler SET webuntis_username = $1, webuntis_password_encrypted = $2 WHERE id = $3',
      [webuntis_username, verschluesselt, req.user.id]
    )

    res.json({ nachricht: 'WebUntis-Zugangsdaten erfolgreich gespeichert!' })

  } catch (err) {
    console.error('Fehler:', err.message)
    res.status(500).json({ fehler: 'Login fehlgeschlagen. Zugangsdaten prüfen.' })
  }
}

const credentialsStatus = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT webuntis_username FROM schueler WHERE id = $1',
      [req.user.id]
    )
    const hatCredentials = !!result.rows[0]?.webuntis_username
    res.json({ hatCredentials })
  } catch (err) {
    res.status(500).json({ fehler: 'Fehler' })
  }
}

const webuntisAbmelden = async (req, res) => {
  try {
    await pool.query(
      'UPDATE schueler SET webuntis_username = NULL, webuntis_password_encrypted = NULL WHERE id = $1',
      [req.user.id]
    )
    res.json({ nachricht: 'WebUntis abgemeldet' })
  } catch (err) {
    res.status(500).json({ fehler: 'Fehler beim Abmelden' })
  }
}

module.exports = { getStundenplan, webuntisZugangsdatenSpeichern, credentialsStatus, webuntisAbmelden }
