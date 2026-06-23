import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import LoadingButton from '../components/ui/LoadingButton'
import SkeletonBlock from '../components/ui/SkeletonBlock'
import { getErrorMessage } from '../utils/apiError'
import ThemeToggle from '../components/ui/ThemeToggle'
import Logo from '../components/ui/Logo'
import NavStrip from "../components/ui/NavStrip";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatZeit(zeit) {
  const str = String(zeit).padStart(4, '0')
  return `${str.slice(0, 2)}:${str.slice(2)}`
}

function zeitZuInt(str) {
  if (!str) return 0
  const [h, m] = str.split(':').map(Number)
  return h * 100 + m
}

function datumStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDatum(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const heute = new Date()
  const morgen = new Date(heute)
  morgen.setDate(heute.getDate() + 1)
  if (dateStr === datumStr(heute)) return 'Heute'
  if (dateStr === datumStr(morgen)) return 'Morgen'
  return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ─── Merge consecutive same-subject timetable slots ─────────────────────────

function zuMinuten(t) {
  const str = String(t).padStart(4, '0')
  return parseInt(str.slice(0, 2)) * 60 + parseInt(str.slice(2))
}

// filterStunden — removes cancelled lessons and administrative blocks from raw WebUntis data.
// SIGNALS (confirmed for KST — update if other schools differ):
//   Cancelled:    lehrer === "Unbekannt" AND fachKuerzel !== ""
//   Veranstaltung: fach === "Unbekannt" AND fachKuerzel === ""
// If raw data structure changes, update the filter predicates here — mergeStunden is unaffected.
function filterStunden(stunden) {
  if (!stunden || stunden.length === 0) return stunden

  // Step 1: Remove cancelled lessons
  const ohneAusgefallen = stunden.filter(
    (s) => !(s.lehrer === 'Unbekannt' && s.fachKuerzel !== '')
  )

  // Step 2: Find administrative/event blocks
  const veranstaltungen = ohneAusgefallen.filter(
    (s) => s.fach === 'Unbekannt' && s.fachKuerzel === ''
  )

  if (veranstaltungen.length === 0) return ohneAusgefallen

  // Step 3: Remove lessons that a Veranstaltung block overlaps
  const gefiltert = ohneAusgefallen.filter((s) => {
    if (s.fach === 'Unbekannt' && s.fachKuerzel === '') return true
    const ueberlappt = veranstaltungen.some(
      (v) =>
        s.datum === v.datum &&
        s.startzeit < v.endzeit &&
        s.endzeit > v.startzeit
    )
    return !ueberlappt
  })

  // Step 4: Label Veranstaltung blocks cleanly
  return gefiltert.map((s) => {
    if (s.fach === 'Unbekannt' && s.fachKuerzel === '') {
      return { ...s, fach: 'Veranstaltung' }
    }
    return s
  })
}

function mergeStunden(stunden) {
  if (stunden.length === 0) return []
  const sorted = [...stunden].sort((a, b) => a.startzeit - b.startzeit)
  const result = []
  let current = { ...sorted[0], slots: [sorted[0]] }

  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i]
    const prevEndzeit = current.slots[current.slots.length - 1].endzeit
    const gap = zuMinuten(s.startzeit) - zuMinuten(prevEndzeit)
    const sameSubject = s.fach === current.fach
    const sameTeacher = s.lehrer === current.lehrer
    const sameRoom = s.raum === current.raum
    const closeEnough = gap >= 0 && gap <= 10

    if (sameSubject && sameTeacher && sameRoom && closeEnough) {
      current.slots.push(s)
      current.endzeit = s.endzeit
    } else {
      result.push(current)
      current = { ...s, slots: [s] }
    }
  }
  result.push(current)
  return result
}

// ─── WebUntis Form ───────────────────────────────────────────────────────────

function WebUntisForm({ onSaved }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [zeigePasswort, setZeigePasswort] = useState(false)
  const [status, setStatus] = useState('idle')
  const [fehlerText, setFehlerText] = useState('')
  const [zustimmung, setZustimmung] = useState(false)

  async function speichern(e) {
    e.preventDefault()
    if (!zustimmung) return
    setFehlerText('')
    setStatus('loading')
    try {
      await api.post('/stundenplan/zugangsdaten', { webuntis_username: username, webuntis_password: password })
      setStatus('success')
      setTimeout(() => onSaved(), 800)
    } catch (err) {
      setFehlerText(getErrorMessage(err, 'webuntis'))
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 24 }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>WebUntis Zugangsdaten hinterlegen</p>
      <form onSubmit={speichern} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            placeholder="Benutzername"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ flex: 1, minWidth: 140 }}
          />
          <div style={{ flex: 1, minWidth: 140, position: 'relative' }}>
            <input
              type={zeigePasswort ? 'text' : 'password'}
              placeholder="Passwort"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', paddingRight: 70, boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => setZeigePasswort(v => !v)}
              tabIndex={-1}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.04em', padding: '2px 4px',
              }}
            >
              {zeigePasswort ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={zustimmung}
            onChange={e => setZustimmung(e.target.checked)}
            style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--accent)', width: 15, height: 15 }}
          />
          <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            Ich stimme zu, dass meine WebUntis-Zugangsdaten verschlüsselt auf den Servern von SchulHub gespeichert werden, um meinen Stundenplan automatisch abzurufen. Die Daten werden ausschließlich für diesen Zweck verwendet und nicht weitergegeben.
          </span>
        </label>
        <div>
          <LoadingButton
            type="submit"
            status={status}
            loadingText="..."
            successText="Gespeichert"
            errorText="Fehler"
            disabled={!zustimmung}
            style={{ padding: '10px 18px', opacity: zustimmung ? 1 : 0.45, cursor: zustimmung ? 'pointer' : 'not-allowed' }}
          >
            Speichern
          </LoadingButton>
        </div>
      </form>
      {fehlerText && status === 'idle' && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{fehlerText}</p>}
    </div>
  )
}

// ─── Settings Panel ──────────────────────────────────────────────────────────

// Schools that use a class/grade structure
const SCHULEN_MIT_KLASSE = ['KST', 'GAV']

function SettingsPanel({ hatCredentials, onWebUntisAbmelden, onWebUntisGespeichert, onKontoGeloescht }) {
  const [form, setForm] = useState({ vorname: '', nachname: '', klasse: '', geburtsdatum: '' })
  const [klasseStufe, setKlasseStufe] = useState('')
  const [klasseBuchstabe, setKlasseBuchstabe] = useState('')
  const [schule, setSchule] = useState('')           // determines whether klasse fields are shown
  const [profilStatus, setProfilStatus] = useState('idle')
  const [profilFehlerText, setProfilFehlerText] = useState('')
  const [aktiveSektion, setAktiveSektion] = useState(null)
  const [abmeldenStatus, setAbmeldenStatus] = useState('idle')
  const [loeschenPasswort, setLoeschenPasswort] = useState('')
  const [loeschenStatus, setLoeschenStatus] = useState('idle')
  const [loeschenFehler, setLoeschenFehler] = useState('')
  const [loeschenBestaetigt, setLoeschenBestaetigt] = useState(false)

  // Whether to show klasse fields — only for KST and GAV
  const zeigeKlasseInSettings = SCHULEN_MIT_KLASSE.includes(schule)

  function toggleSektion(s) {
    setAktiveSektion(prev => prev === s ? null : s)
  }

  useEffect(() => { ladeProfil() }, [])

  async function ladeProfil() {
    try {
      const res = await api.get('/profil')
      const p = res.data
      const stufe    = p.klasse?.replace(/[a-zA-Z]/g, '') || ''
      const buchstabe = p.klasse?.replace(/[0-9]/g, '')   || ''
      setForm({ vorname: p.vorname || '', nachname: p.nachname || '', klasse: p.klasse || '', geburtsdatum: p.geburtsdatum?.slice(0, 10) || '' })
      setKlasseStufe(stufe)
      setKlasseBuchstabe(buchstabe)
      setSchule(p.schule || '')
    } catch {}
  }

  async function profilSpeichern(e) {
    e.preventDefault()
    setProfilFehlerText('')
    setProfilStatus('loading')
    // Only send klasse for schools that use it
    const klasse = zeigeKlasseInSettings ? `${klasseStufe}${klasseBuchstabe}` : undefined
    try {
      await api.put('/profil', { ...form, klasse })
      setProfilStatus('success')
      setTimeout(() => setProfilStatus('idle'), 3000)
    } catch (err) {
      setProfilFehlerText(getErrorMessage(err, 'profil'))
      setProfilStatus('error')
      setTimeout(() => setProfilStatus('idle'), 2500)
    }
  }

  async function handleAbmelden() {
    setAbmeldenStatus('loading')
    try {
      await onWebUntisAbmelden()
      setAbmeldenStatus('idle')
    } catch {
      setAbmeldenStatus('error')
      setTimeout(() => setAbmeldenStatus('idle'), 2500)
    }
  }

  async function handleKontoLoeschen(e) {
    e.preventDefault()
    setLoeschenFehler('')
    setLoeschenStatus('loading')
    try {
      await api.post('/konto/loeschen', { passwort: loeschenPasswort })
      setLoeschenStatus('success')
      setTimeout(() => onKontoGeloescht(), 800)
    } catch (err) {
      const msg = err?.response?.data?.fehler || 'Fehler beim Löschen...'
      setLoeschenFehler(msg)
      setLoeschenStatus('error')
      setTimeout(() => setLoeschenStatus('idle'), 2500)
    }
  }

  const tabStyle = (sektion) => ({
    background: aktiveSektion === sektion ? (sektion === 'loeschen' ? 'var(--danger)' : 'var(--accent)') : 'transparent',
    color: aktiveSektion === sektion ? '#fff' : (sektion === 'loeschen' ? 'var(--danger)' : 'var(--muted)'),
    border: `1px solid ${sektion === 'loeschen' ? 'var(--danger)' : 'var(--border)'}`,
    padding: '8px 16px',
    fontSize: 13,
    cursor: 'pointer',
  })

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: aktiveSektion ? 16 : 0 }}>
        <button onClick={() => toggleSektion('profil')}      style={tabStyle('profil')}>Profil ändern</button>
        <button onClick={() => toggleSektion('webuntis')}    style={tabStyle('webuntis')}>WebUntis</button>
        <button onClick={() => toggleSektion('darstellung')} style={tabStyle('darstellung')}>Darstellung</button>
        <button onClick={() => toggleSektion('loeschen')}    style={tabStyle('loeschen')}>Konto löschen</button>
      </div>

      {aktiveSektion === 'profil' && (
        <form onSubmit={profilSpeichern} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Vorname</label>
              <input value={form.vorname} onChange={e => setForm({ ...form, vorname: e.target.value })} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Nachname</label>
              <input value={form.nachname} onChange={e => setForm({ ...form, nachname: e.target.value })} required />
            </div>
          </div>

          {/* Klasse fields — only rendered for KST and GAV */}
          {zeigeKlasseInSettings && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Stufe</label>
                <select value={klasseStufe} onChange={e => setKlasseStufe(e.target.value)} required>
                  <option value="">Stufe</option>
                  {[5,6,7,8,9,10,11,12,13].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Klasse</label>
                <input
                  type="text"
                  value={klasseBuchstabe}
                  onChange={e => setKlasseBuchstabe(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 1).toLowerCase())}
                  placeholder="z.B. a"
                  maxLength={1}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Geburtsdatum</label>
            <input type="date" value={form.geburtsdatum} onChange={e => setForm({ ...form, geburtsdatum: e.target.value })} />
          </div>
          {profilFehlerText && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{profilFehlerText}</p>}
          <LoadingButton
            type="submit"
            status={profilStatus}
            loadingText="Speichern..."
            successText="Gespeichert"
            errorText="Fehler — nochmal"
            style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: 13 }}
          >
            Speichern
          </LoadingButton>
        </form>
      )}

      {aktiveSektion === 'webuntis' && (
        <div>
          {hatCredentials ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--success)' }}>✓ WebUntis verbunden</span>
              <LoadingButton
                status={abmeldenStatus}
                onClick={handleAbmelden}
                loadingText="..."
                errorText="Fehler beim Abmelden"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '8px 14px', fontSize: 12 }}
              >
                Abmelden
              </LoadingButton>
            </div>
          ) : (
            <WebUntisForm onSaved={onWebUntisGespeichert} />
          )}
        </div>
      )}

      {aktiveSektion === 'darstellung' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Farbschema</p>
          <ThemeToggle />
        </div>
      )}

      {aktiveSektion === 'loeschen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
            <p style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600, margin: '0 0 4px' }}>Konto dauerhaft löschen</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
              Alle deine Daten werden unwiderruflich gelöscht — Konto, Hausaufgaben, Termine, Stundenplan-Zugangsdaten. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={loeschenBestaetigt}
              onChange={e => setLoeschenBestaetigt(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--danger)', width: 15, height: 15 }}
            />
            <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
              Ich verstehe, dass mein Konto und alle meine Daten dauerhaft gelöscht werden.
            </span>
          </label>
          {loeschenBestaetigt && (
            <form onSubmit={handleKontoLoeschen} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Passwort zur Bestätigung</label>
                <input
                  type="password"
                  placeholder="Dein Passwort"
                  value={loeschenPasswort}
                  onChange={e => { setLoeschenPasswort(e.target.value); setLoeschenFehler('') }}
                  required
                  autoComplete="current-password"
                />
              </div>
              {loeschenFehler && <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{loeschenFehler}</p>}
              <LoadingButton
                type="submit"
                status={loeschenStatus}
                loadingText="Löschen..."
                successText="Gelöscht"
                errorText="Fehler"
                disabled={!loeschenPasswort}
                style={{
                  alignSelf: 'flex-start', padding: '10px 20px', fontSize: 13,
                  color: '#fff', background: 'var(--danger)', borderColor: 'var(--danger)',
                  opacity: loeschenPasswort ? 1 : 0.45,
                }}
              >
                Konto endgültig löschen
              </LoadingButton>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function StundenplanSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {[1, 0.6, 0.35].map((opacity, i) => (
        <div key={i} style={{ opacity, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonBlock width={70} height={12} />
          <SkeletonBlock width={60} height={11} />
        </div>
      ))}
    </div>
  )
}

function HausaufgabenSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 0.6, 0.35].map((opacity, i) => (
        <div key={i} style={{ opacity, background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <SkeletonBlock width={160} height={13} />
            <SkeletonBlock width={70} height={11} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <SkeletonBlock width={80} height={28} borderRadius="var(--radius)" />
            <SkeletonBlock width={70} height={28} borderRadius="var(--radius)" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Termin Form ──────────────────────────────────────────────────────────────

function TerminForm({ datum, onSaved, editingTermin, onEditCancel }) {
  const [titel, setTitel] = useState('')
  const [startzeit, setStartzeit] = useState('')
  const [endzeit, setEndzeit] = useState('')
  const [notiz, setNotiz] = useState('')
  const [offen, setOffen] = useState(false)
  const [status, setStatus] = useState('idle')
  const [fehler, setFehler] = useState('')

  // Pre-fill when editingTermin is set; reset internal state when it becomes null
  useEffect(() => {
    if (!editingTermin) {
      setTitel(''); setStartzeit(''); setEndzeit(''); setNotiz('')
      setFehler(''); setStatus('idle')
      return
    }
    const intZuZeit = (n) => {
      const s = String(n).padStart(4, '0')
      return `${s.slice(0, 2)}:${s.slice(2)}`
    }
    setTitel(editingTermin.titel || '')
    setStartzeit(intZuZeit(editingTermin.startzeit))
    setEndzeit(intZuZeit(editingTermin.endzeit))
    setNotiz(editingTermin.notiz || '')
    setOffen(true)
  }, [editingTermin])

  // Reset + collapse on day navigation — but skip if an edit is in progress
  useEffect(() => {
    if (editingTermin) return
    setTitel(''); setStartzeit(''); setEndzeit(''); setNotiz('')
    setOffen(false); setFehler(''); setStatus('idle')
  }, [datum, editingTermin])

  function handleAbbrechen() {
    onEditCancel?.()
    setOffen(false)
  }

  async function speichern(e) {
    e.preventDefault()
    setFehler('')
    setStatus('loading')

    // When editing a Termin from Kommende Termine on a different day,
    // always use the Termin's own datum — not the currently selected day prop.
    const terminDatum = editingTermin
      ? String(editingTermin.datum).slice(0, 10)
      : datum

    try {
      if (editingTermin) {
        await api.put(`/termine/${editingTermin.id}`, { titel, datum: terminDatum, startzeit, endzeit, notiz: notiz || null })
      } else {
        await api.post('/termine', { titel, datum: terminDatum, startzeit, endzeit, notiz: notiz || null })
      }
      setTitel(''); setStartzeit(''); setEndzeit(''); setNotiz('')
      setStatus('success')
      setTimeout(() => {
        setStatus('idle')
        setOffen(false)
        onEditCancel?.()
        onSaved()
      }, 800)
    } catch (err) {
      setFehler(err?.response?.data?.fehler || 'Fehler beim Speichern.')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  if (!offen) {
    return (
      <button
        onClick={() => setOffen(true)}
        style={{
          width: '100%', background: 'transparent', border: '1px dashed var(--accent)',
          borderRadius: 'var(--radius)', color: 'var(--accent)', fontSize: 12,
          padding: '7px 0', cursor: 'pointer', marginTop: 6, letterSpacing: '0.03em',
        }}
      >
        + Termin hinzufügen
      </button>
    )
  }

  return (
    <form onSubmit={speichern} style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 7 }}>
      {editingTermin && (
        <p style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent)', margin: 0, letterSpacing: '0.04em' }}>
          BEARBEITEN — {editingTermin.titel}
        </p>
      )}
      <input placeholder="Titel" value={titel} onChange={e => setTitel(e.target.value)} required style={{ fontSize: 13, padding: '6px 8px' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 2 }}>Von</label>
          <input type="time" value={startzeit} onChange={e => setStartzeit(e.target.value)} required style={{ fontSize: 13, padding: '6px 8px', width: '100%' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 2 }}>Bis</label>
          <input type="time" value={endzeit} onChange={e => setEndzeit(e.target.value)} required style={{ fontSize: 13, padding: '6px 8px', width: '100%' }} />
        </div>
      </div>
      <input placeholder="Notiz (optional)" value={notiz} onChange={e => setNotiz(e.target.value)} style={{ fontSize: 12, padding: '6px 8px' }} />
      {fehler && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{fehler}</p>}
      <div style={{ display: 'flex', gap: 6 }}>
        <LoadingButton type="submit" status={status} loadingText="..." successText="✓ Gespeichert" errorText="Fehler" style={{ padding: '6px 14px', fontSize: 12 }}>
          {editingTermin ? 'Änderungen speichern' : 'Speichern'}
        </LoadingButton>
        <button type="button" onClick={handleAbbrechen} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
          Abbrechen
        </button>
      </div>
    </form>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const [hausaufgaben, setHausaufgaben] = useState([])
  const [stunden, setStunden] = useState([])
  const [termine, setTermine] = useState([])
  const [termineKommend, setTermineKommend] = useState([])
  const [stundenFehler, setStundenFehler] = useState(false)
  const [alleErledigt, setAlleErledigt] = useState(false)
  const [selectedDatum, setSelectedDatum] = useState(() => new Date())
  const [stundenLaden, setStundenLaden] = useState(false)
  const swipeStartX = useRef(null)
  const [fach, setFach] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [faelligAm, setFaelligAm] = useState('')
  const [zeigeSettings, setZeigeSettings] = useState(false)
  const [hatCredentials, setHatCredentials] = useState(null)
  const [dashboardLaden, setDashboardLaden] = useState(true)
  const [hinzufuegenStatus, setHinzufuegenStatus] = useState('idle')
  const [hinzufuegenFehler, setHinzufuegenFehler] = useState('')
  const [itemLaden, setItemLaden] = useState({})
  const [itemFehler, setItemFehler] = useState({})
  const [terminLaden, setTerminLaden] = useState({})
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 760
  )

  // ─── Edit state ───────────────────────────────────────────────────────────
  const [editingHA, setEditingHA] = useState(null)          // null | HA object
  const [bearbeitenStatus, setBearbeitenStatus] = useState('idle')
  const [bearbeitenFehler, setBearbeitenFehler] = useState('')
  const [editingTermin, setEditingTermin] = useState(null)  // null | Termin object

  const navigate = useNavigate()

  useEffect(() => {
    function handleResize() { setWindowWidth(window.innerWidth) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 640

  useEffect(() => {
    Promise.allSettled([ladeHausaufgaben(), ladeStundenplan(selectedDatum), ladeTermine(selectedDatum), ladeTermineKommend(), pruefeCredentials()])
      .then(() => setDashboardLaden(false))
  }, [])

  useEffect(() => {
    if (!dashboardLaden) {
      ladeStundenplan(selectedDatum)
      ladeTermine(selectedDatum)
    }
  }, [selectedDatum])

  async function pruefeCredentials() {
    try {
      const res = await api.get('/stundenplan/credentials-status')
      setHatCredentials(res.data.hatCredentials)
    } catch {
      // Network error ≠ no credentials — leave as null (unknown) to avoid false-positive form
    }
  }

  async function ladeHausaufgaben() {
    try {
      const res = await api.get('/hausaufgaben')
      setHausaufgaben(res.data)
    } catch {}
  }

  async function ladeTermine(datum) {
    try {
      const res = await api.get(`/termine?datum=${datumStr(datum)}`)
      const heute = new Date()
      const isToday = datumStr(datum) === datumStr(heute)
      const nowInt = heute.getHours() * 100 + heute.getMinutes()
      let data = res.data
      if (isToday) data = data.filter(t => t.endzeit > nowInt)
      setTermine(data)
    } catch {
      setTermine([])
    }
  }

  async function ladeTermineKommend() {
    try {
      const res = await api.get('/termine/kommend')
      const heute = new Date()
      const heuteStr = datumStr(heute)
      const nowInt = heute.getHours() * 100 + heute.getMinutes()
      const filtered = res.data.filter(t => {
        const tDatum = String(t.datum).slice(0, 10)
        return tDatum === heuteStr ? t.endzeit > nowInt : true
      })
      setTermineKommend(filtered)
    } catch {
      setTermineKommend([])
    }
  }

  async function terminLoeschen(id) {
    // Clear edit state if we're deleting the item currently being edited
    if (editingTermin?.id === id) setEditingTermin(null)
    setTerminLaden(prev => ({ ...prev, [id]: 'loading' }))
    try {
      await api.delete(`/termine/${id}`)
      await ladeTermine(selectedDatum)
      await ladeTermineKommend()
    } catch {
      setTerminLaden(prev => ({ ...prev, [id]: 'error' }))
      setTimeout(() => setTerminLaden(prev => ({ ...prev, [id]: 'idle' })), 2500)
    }
  }

  async function ladeStundenplan(datum) {
    setStundenLaden(true)
    try {
      const ds = datumStr(datum)
      const res = await api.get(`/stundenplan/woche?datum=${ds}`)
      const datumInt = parseInt(ds.replace(/-/g, ''))
      const heute = new Date()
      const heuteStr = datumStr(heute)
      const isToday = ds === heuteStr
      const nowInt = heute.getHours() * 100 + heute.getMinutes()
      const alleTagesStunden = res.data.stunden.filter(s => s.datum === datumInt)
      let tagesStunden = alleTagesStunden
      if (isToday) {
        tagesStunden = alleTagesStunden.filter(s => s.endzeit > nowInt)
        setAlleErledigt(tagesStunden.length === 0 && alleTagesStunden.length > 0)
      } else {
        setAlleErledigt(false)
      }
      tagesStunden.sort((a, b) => a.startzeit - b.startzeit)
      setStunden(mergeStunden(filterStunden(tagesStunden)))
      setStundenFehler(false)
    } catch {
      setStundenFehler(true)
      setAlleErledigt(false)
    } finally {
      setStundenLaden(false)
    }
  }

  async function webuntisAbmelden() {
    await api.delete('/stundenplan/zugangsdaten')
    setHatCredentials(false)
  }

  async function handleLogout() {
    try { await api.post('/auth/ausloggen') } catch {}
    setConfirmLogout(false)
    navigate('/')
  }

  async function handleKontoGeloescht() {
    try { await api.post('/auth/ausloggen') } catch {}
    navigate('/')
  }

  function isWeekend(date) { return date.getDay() === 0 || date.getDay() === 6 }

  function addDays(date, n) {
    const d = new Date(date)
    d.setDate(d.getDate() + n)
    return d
  }

  function navigateDag(direction) {
    const today = new Date()
    const twoWeeksAgo   = addDays(today, -14)
    const twoWeeksAhead = addDays(today, 14)
    let next = addDays(selectedDatum, direction)
    while (isWeekend(next)) next = addDays(next, direction)
    if (next < twoWeeksAgo || next > twoWeeksAhead) return
    setSelectedDatum(next)
  }

  function handleSwipeStart(e) {
    swipeStartX.current = e.touches?.[0]?.clientX ?? e.clientX
  }

  function handleSwipeEnd(e) {
    if (swipeStartX.current === null) return
    const endX = e.changedTouches?.[0]?.clientX ?? e.clientX
    const diff = swipeStartX.current - endX
    if (Math.abs(diff) > 50) navigateDag(diff > 0 ? 1 : -1)
    swipeStartX.current = null
  }

  // ─── HA edit helpers ──────────────────────────────────────────────────────

  function haBearbeitenStarten(ha) {
    setEditingHA(ha)
    setFach(ha.fach)
    setBeschreibung(ha.beschreibung || '')
    setFaelligAm(ha.faellig_am?.slice(0, 10) || '')
    setBearbeitenFehler('')
    setBearbeitenStatus('idle')
    document.getElementById('ha-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function haBearbeitenAbbrechen() {
    setEditingHA(null)
    setFach(''); setBeschreibung(''); setFaelligAm('')
    setBearbeitenFehler('')
    setBearbeitenStatus('idle')
  }

  // ─── HA add / edit submit ─────────────────────────────────────────────────

  async function hinzufuegen(e) {
    e.preventDefault()
    setHinzufuegenFehler('')
    setBearbeitenFehler('')

    if (editingHA) {
      setBearbeitenStatus('loading')
      try {
        await api.put(`/hausaufgaben/${editingHA.id}`, { fach, beschreibung, faellig_am: faelligAm })
        setFach(''); setBeschreibung(''); setFaelligAm('')
        setEditingHA(null)
        setBearbeitenStatus('success')
        setTimeout(() => setBearbeitenStatus('idle'), 2000)
        ladeHausaufgaben()
      } catch (err) {
        setBearbeitenFehler(getErrorMessage(err, 'hausaufgabe-bearbeiten'))
        setBearbeitenStatus('error')
        setTimeout(() => setBearbeitenStatus('idle'), 2500)
      }
      return
    }

    setHinzufuegenStatus('loading')
    try {
      await api.post('/hausaufgaben', { fach, beschreibung, faellig_am: faelligAm })
      setFach(''); setBeschreibung(''); setFaelligAm('')
      setHinzufuegenStatus('success')
      setTimeout(() => setHinzufuegenStatus('idle'), 2000)
      ladeHausaufgaben()
    } catch (err) {
      setHinzufuegenFehler(getErrorMessage(err, 'hausaufgabe-hinzufuegen'))
      setHinzufuegenStatus('error')
      setTimeout(() => setHinzufuegenStatus('idle'), 2500)
    }
  }

  async function erledigen(id) {
    setItemLaden(prev => ({ ...prev, [`${id}-erledigen`]: 'loading' }))
    setItemFehler(prev => ({ ...prev, [`${id}-erledigen`]: '' }))
    try {
      await api.patch(`/hausaufgaben/${id}/erledigen`)
      await ladeHausaufgaben()
    } catch (err) {
      setItemFehler(prev => ({ ...prev, [`${id}-erledigen`]: getErrorMessage(err, 'hausaufgabe-erledigen') }))
      setItemLaden(prev => ({ ...prev, [`${id}-erledigen`]: 'error' }))
      setTimeout(() => setItemLaden(prev => ({ ...prev, [`${id}-erledigen`]: 'idle' })), 2500)
    }
  }

  async function loeschen(id) {
    // Clear edit state if we're deleting the item currently being edited
    if (editingHA?.id === id) haBearbeitenAbbrechen()
    setItemLaden(prev => ({ ...prev, [`${id}-loeschen`]: 'loading' }))
    setItemFehler(prev => ({ ...prev, [`${id}-loeschen`]: '' }))
    try {
      await api.delete(`/hausaufgaben/${id}`)
      await ladeHausaufgaben()
    } catch (err) {
      setItemFehler(prev => ({ ...prev, [`${id}-loeschen`]: getErrorMessage(err, 'hausaufgabe-loeschen') }))
      setItemLaden(prev => ({ ...prev, [`${id}-loeschen`]: 'error' }))
      setTimeout(() => setItemLaden(prev => ({ ...prev, [`${id}-loeschen`]: 'idle' })), 2500)
    }
  }

  const heute = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
  const hatTermine = termine.length > 0

  const stundenKarte = (s) => {
    const zeitAnzeige = s.slots && s.slots.length > 1
      ? `${formatZeit(s.slots[0].startzeit)}–${formatZeit(s.slots[s.slots.length - 1].endzeit)}`
      : `${formatZeit(s.startzeit)}–${formatZeit(s.endzeit)}`

    return (
      <div key={s.id} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '6px 10px', marginBottom: 5,
      }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{s.fach}</span>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', textAlign: 'right' }}>
          {zeitAnzeige}
          <span style={{ color: 'var(--accent)', marginLeft: 6 }}>{s.raum}</span>
        </div>
      </div>
    )
  }

  const terminKarte = (t, { zeigtLoeschen = true } = {}) => (
    <div key={t.id} style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderLeft: '3px solid var(--accent)', borderRadius: 'var(--radius)',
      padding: '6px 10px', marginBottom: 5,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{t.titel}</span>
        {zeigtLoeschen && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              onClick={() => setEditingTermin(t)}
              style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', padding: '0 3px', lineHeight: 1 }}
              title="Bearbeiten"
            >
              ✎
            </button>
            <button
              onClick={() => terminLoeschen(t.id)}
              disabled={terminLaden[t.id] === 'loading'}
              style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
              title="Löschen"
            >
              ×
            </button>
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
        {formatZeit(t.startzeit)}–{formatZeit(t.endzeit)}
      </div>
      {t.notiz && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, fontStyle: 'italic' }}>{t.notiz}</div>}
    </div>
  )

  const termineNachDatum = termineKommend.reduce((acc, t) => {
    const key = t.datum instanceof Date
      ? datumStr(t.datum)
      : String(t.datum).slice(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: isMobile ? '16px 12px' : '32px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Logo size="md" />
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{heute}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setZeigeSettings(v => !v)}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '8px 16px', fontSize: 13 }}
          >
            ⚙ Settings
          </button>
          {confirmLogout ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Sicher?</span>
              <button onClick={handleLogout} style={{ background: 'var(--danger)', border: '1px solid var(--danger)', color: '#fff', padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>
                Ja
              </button>
              <button onClick={() => setConfirmLogout(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>
                Nein
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmLogout(true)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '8px 16px', fontSize: 13 }}>
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Feature nav strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[
          {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/dashboard',
            status: null,
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="1" y="1" width="8" height="8" rx="2" fill="currentColor"/>
                <rect x="11" y="1" width="8" height="8" rx="2" fill="currentColor"/>
                <rect x="1" y="11" width="8" height="8" rx="2" fill="currentColor"/>
                <rect x="11" y="11" width="8" height="8" rx="2" fill="currentColor"/>
              </svg>
            ),
          },
          {
            id: 'noten',
            label: 'Noten',
            path: '/noten',
            status: 'BALD',
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="1"  y="12" width="4" height="7" rx="1.5" fill="currentColor"/>
                <rect x="8"  y="7"  width="4" height="12" rx="1.5" fill="currentColor"/>
                <rect x="15" y="2"  width="4" height="17" rx="1.5" fill="currentColor"/>
              </svg>
            ),
          },
        ].map(item => {
          const isActive = item.id === 'dashboard'
          return (
            <Link
              key={item.id}
              to={item.path}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                background: isActive ? 'rgba(108, 92, 231, 0.10)' : 'var(--surface)',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                color: isActive ? 'var(--accent)' : 'var(--muted)',
                textDecoration: 'none',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isActive ? '0 0 0 1px rgba(108, 92, 231, 0.15)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Left edge indicator — active only */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  bottom: '20%',
                  width: '3px',
                  background: 'var(--accent)',
                  borderRadius: '0 2px 2px 0',
                }} />
              )}
              {/* Icon */}
              <span style={{ display: 'flex', flexShrink: 0 }}>
                {item.icon}
              </span>
              {/* Label */}
              <span style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.01em',
              }}>
                {item.label}
              </span>
              {/* BALD / SPÄTER badge */}
              {item.status && (
                <span style={{
                  marginLeft: 'auto',
                  fontFamily: 'var(--mono)',
                  fontSize: '8px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'var(--muted)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  padding: '2px 5px',
                  flexShrink: 0,
                }}>
                  {item.status}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {hatCredentials === false && !zeigeSettings && (
        <WebUntisForm onSaved={() => { setHatCredentials(true); ladeStundenplan(selectedDatum) }} />
      )}

      {zeigeSettings && (
        <SettingsPanel
          hatCredentials={hatCredentials}
          onWebUntisAbmelden={webuntisAbmelden}
          onWebUntisGespeichert={() => { setHatCredentials(true); ladeStundenplan(selectedDatum) }}
          onKontoGeloescht={handleKontoGeloescht}
        />
      )}

      {/* Date navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
          Stundenplan
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigateDag(-1)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '3px 9px', fontSize: 15, cursor: 'pointer', borderRadius: 'var(--radius)' }}>‹</button>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', minWidth: isMobile ? 90 : 120, textAlign: 'center' }}>
            {selectedDatum.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
            {selectedDatum.toDateString() === new Date().toDateString() && (
              <span style={{ color: 'var(--accent)', marginLeft: 6 }}>· Heute</span>
            )}
          </span>
          <button onClick={() => navigateDag(1)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '3px 9px', fontSize: 15, cursor: 'pointer', borderRadius: 'var(--radius)' }}>›</button>
        </div>
      </div>

      {/* Split panel */}
      <div
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
        onMouseDown={handleSwipeStart}
        onMouseUp={handleSwipeEnd}
        style={{
          display: 'grid',
          gridTemplateColumns: (hatTermine && !isMobile) ? '1fr 1fr' : '1fr',
          gap: 12, marginBottom: 8, userSelect: 'none',
        }}
      >
        <div>
          {dashboardLaden || stundenLaden ? <StundenplanSkeleton /> : (
            <>
              {stundenFehler && <p style={{ color: 'var(--danger)', fontSize: 13 }}>Stundenplan konnte nicht geladen werden.</p>}
              {!stundenFehler && stunden.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {alleErledigt ? 'Alle Stunden erledigt.' : 'Keine Stunden heute.'}
                </p>
              )}
              {stunden.map(stundenKarte)}
            </>
          )}
        </div>

        {hatTermine && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>Termine</p>
            {termine.map(t => terminKarte(t))}
          </div>
        )}
      </div>

      <TerminForm
        datum={datumStr(selectedDatum)}
        onSaved={() => { ladeTermine(selectedDatum); ladeTermineKommend() }}
        editingTermin={editingTermin}
        onEditCancel={() => setEditingTermin(null)}
      />

      <hr style={{ margin: '24px 0' }} />

      {termineKommend.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Kommende Termine</h2>
          {Object.entries(termineNachDatum).map(([datum, items]) => (
            <div key={datum} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent)', marginBottom: 6, letterSpacing: '0.05em' }}>
                {formatDatum(datum)}
              </p>
              {items.map(t => terminKarte(t))}
            </div>
          ))}
        </div>
      )}

      {termineKommend.length > 0 && <hr style={{ marginBottom: 24 }} />}

      {/* Hausaufgaben form */}
      <div id="ha-form" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
          {editingHA ? `Bearbeiten — ${editingHA.fach}` : 'Hausaufgabe hinzufügen'}
        </h2>
        <form onSubmit={hinzufuegen} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <input placeholder="Fach" value={fach} onChange={e => setFach(e.target.value)} required style={{ flex: '0 0 130px' }} />
          <input placeholder="Beschreibung" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} style={{ flex: 2, minWidth: 160 }} />
          <div style={{ flex: '0 0 150px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.04em' }}>Fällig am</label>
            <input
              type="date"
              value={faelligAm}
              onChange={e => setFaelligAm(e.target.value)}
              required
              style={{ color: faelligAm ? 'var(--text)' : 'var(--muted)', width: '100%' }}
            />
          </div>
          <LoadingButton
            type="submit"
            status={editingHA ? bearbeitenStatus : hinzufuegenStatus}
            loadingText={editingHA ? '...' : 'Hinzufügen...'}
            successText={editingHA ? '✓ Gespeichert' : 'Hinzugefügt'}
            errorText="Fehler"
            style={{ padding: '10px 20px' }}
          >
            {editingHA ? 'Änderungen speichern' : '+ Hinzufügen'}
          </LoadingButton>
          {editingHA && (
            <button
              type="button"
              onClick={haBearbeitenAbbrechen}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '10px 16px', fontSize: 13, cursor: 'pointer' }}
            >
              Abbrechen
            </button>
          )}
        </form>
        {editingHA
          ? (bearbeitenFehler && bearbeitenStatus === 'idle' && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{bearbeitenFehler}</p>)
          : (hinzufuegenFehler && hinzufuegenStatus === 'idle' && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{hinzufuegenFehler}</p>)
        }
      </div>

      <hr />

      {/* Hausaufgaben list */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Meine Hausaufgaben</h2>
        {dashboardLaden ? <HausaufgabenSkeleton /> : (
          <>
            {hausaufgaben.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>Keine Hausaufgaben eingetragen.</p>}
            {hausaufgaben.map(ha => (
              <div key={ha.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10, opacity: ha.erledigt ? 0.4 : 1, borderLeft: ha.erledigt ? '3px solid var(--success)' : '3px solid var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ fontWeight: 600 }}>{ha.fach}<span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: 10 }}>{ha.beschreibung}</span></span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{ha.faellig_am?.slice(0, 10)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {!ha.erledigt && (
                    <LoadingButton status={itemLaden[`${ha.id}-erledigen`] || 'idle'} onClick={() => erledigen(ha.id)} loadingText="..." successText="Erledigt" errorText="Fehler" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', borderColor: 'var(--accent)', padding: '4px 12px', fontSize: 12, height: 'auto' }}>
                      ✓ Erledigt
                    </LoadingButton>
                  )}
                  {!ha.erledigt && (
                    <button
                      onClick={() => haBearbeitenStarten(ha)}
                      style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
                      title="Bearbeiten"
                    >
                      ✎
                    </button>
                  )}
                  <LoadingButton status={itemLaden[`${ha.id}-loeschen`] || 'idle'} onClick={() => loeschen(ha.id)} loadingText="..." errorText="Fehler" style={{ color: 'var(--danger)', borderColor: 'var(--border)', padding: '4px 12px', fontSize: 12, height: 'auto' }}>
                    Löschen
                  </LoadingButton>
                  {itemFehler[`${ha.id}-erledigen`] && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{itemFehler[`${ha.id}-erledigen`]}</span>}
                  {itemFehler[`${ha.id}-loeschen`]  && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{itemFehler[`${ha.id}-loeschen`]}</span>}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}