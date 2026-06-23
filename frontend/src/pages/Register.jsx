import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { getErrorMessage } from '../utils/apiError'
import LoadingButton from '../components/ui/LoadingButton'

// stufen: grade range for the Jahrgangsstufe selector
// KST is upper secondary only (10–13)
// GAV is a full Gymnasium (5–13)
const SCHULEN = [
  {
    value:            'KST',
    label:            'Kolleg St. Thomas (KST)',
    domain:           'kst-vechta.de',
    emailPlaceholder: 'dein.name@kst-vechta.de',
    hatKlasse:        true,
    hatSchulEmail:    true,
    stufen:           [10, 11, 12, 13],
  },
  {
    value:            'GAV',
    label:            'Gymnasium Antonianum Vechta (GAV)',
    domain:           'gavec.de',
    emailPlaceholder: 'dein.name@gavec.de',
    hatKlasse:        true,
    hatSchulEmail:    true,
    stufen:           [5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    value:            'AKS',
    label:            'Adolf-Kolping-Schule (AKS)',
    domain:           null,
    emailPlaceholder: 'deine@email.de',
    hatKlasse:        false,
    hatSchulEmail:    false,
    stufen:           [],
  },
  {
    value:            'Justus',
    label:            'Justus-von-Liebig-Schule',
    domain:           null,
    emailPlaceholder: 'deine@email.de',
    hatKlasse:        false,
    hatSchulEmail:    false,
    stufen:           [],
  },
]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    vorname:          '',
    nachname:         '',
    email:            '',
    passwort:         '',
    passwortBestaetigen: '',
    klasse:           '',
    klassenBuchstabe: '',
    schule:           '',
  })
  const [zeigePasswort, setZeigePasswort] = useState(false)
  const [zeigePasswortBestaetigen, setZeigePasswortBestaetigen] = useState(false)
  const [alterBestaetigt, setAlterBestaetigt] = useState(false)
  const [datenschutzBestaetigt, setDatenschutzBestaetigt] = useState(false)
  const [nutzungsbedingungenBestaetigt, setNutzungsbedingungenBestaetigt] = useState(false)
  const [benachrichtigungen, setBenachrichtigungen] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('idle')

  const selectedSchule = SCHULEN.find(s => s.value === form.schule)
  const schuleAktiv     = !!selectedSchule && form.schule !== ''
  const zeigeKlasse     = selectedSchule?.hatKlasse === true
  const hatSchulEmail   = selectedSchule?.hatSchulEmail === true
  const stufenOptionen  = selectedSchule?.stufen || []

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'schule') {
      setForm({ ...form, schule: value, email: '', klasse: '', klassenBuchstabe: '' })
    } else if (name === 'klassenBuchstabe') {
      setForm({ ...form, klassenBuchstabe: value.replace(/[^a-zA-Z]/g, '').slice(0, 1).toLowerCase() })
    } else {
      setForm({ ...form, [name]: value })
    }
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.schule) {
      setError('Bitte wähle deine Schule aus.')
      return
    }
    if (!schuleAktiv) {
      setError('Diese Schule ist noch nicht verfügbar.')
      return
    }
    if (!form.vorname || !form.nachname) {
      setError('Bitte Vor- und Nachname eingeben.')
      return
    }
    if (form.passwort !== form.passwortBestaetigen) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }
    if (!alterBestaetigt) {
      setError('Bitte bestätige dein Alter bzw. die Einwilligung deiner Erziehungsberechtigten.')
      return
    }
    if (!datenschutzBestaetigt) {
      setError('Bitte stimme der Datenschutzerklärung zu.')
      return
    }
    if (!nutzungsbedingungenBestaetigt) {
      setError('Bitte akzeptiere die Nutzungsbedingungen.')
      return
    }

    setStatus('loading')
    try {
      await axios.post('/auth/registrieren', {
        vorname:          form.vorname,
        nachname:         form.nachname,
        email:            form.email,
        passwort:         form.passwort,
        klasse:           zeigeKlasse ? form.klasse           : undefined,
        klassenBuchstabe: zeigeKlasse ? form.klassenBuchstabe : undefined,
        schule:           form.schule,
        benachrichtigungen,
      })
      setStatus('success')
      setTimeout(() => navigate('/verify', { state: { email: form.email } }), 1200)
    } catch (err) {
      setStatus('error')
      setError(getErrorMessage(err, 'register'))
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  const canSubmit = alterBestaetigt && datenschutzBestaetigt && nutzungsbedingungenBestaetigt && schuleAktiv

  // Reusable show/hide toggle button
  const PasswortToggle = ({ zeige, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      style={{
        position:  'absolute',
        right:     10,
        top:       '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border:    'none',
        color:     'var(--muted)',
        cursor:    'pointer',
        fontSize:  11,
        fontFamily: 'var(--mono)',
        letterSpacing: '0.04em',
        padding:   '2px 4px',
      }}
    >
      {zeige ? 'HIDE' : 'SHOW'}
    </button>
  )

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '40px 32px',
      }}>

        <div style={{ marginBottom: 28 }}>
          <Link to="/" style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', textDecoration: 'none', letterSpacing: 1 }}>
            SchulHub
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '8px 0 4px' }}>Konto erstellen</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            {form.schule && selectedSchule ? selectedSchule.label : 'Wähle zuerst deine Schule'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* School selector — always first */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Schule</label>
            <select name="schule" value={form.schule} onChange={handleChange} required>
              <option value="">Schule auswählen</option>
              {SCHULEN.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Rest of form — only shown once school is selected */}
          {schuleAktiv && (
            <>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Vorname</label>
                  <input type="text" name="vorname" value={form.vorname} onChange={handleChange} placeholder="Max" required autoComplete="given-name" />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Nachname</label>
                  <input type="text" name="nachname" value={form.nachname} onChange={handleChange} placeholder="Mustermann" required autoComplete="family-name" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                  {hatSchulEmail ? 'Schul-E-Mail' : 'E-Mail-Adresse'}
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={selectedSchule?.emailPlaceholder || ''}
                  required
                  autoComplete="email"
                />
                {!hatSchulEmail && (
                  <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                    Deine Schule vergibt keine Schüler-E-Mails — registriere dich mit deiner privaten E-Mail-Adresse.
                  </p>
                )}
              </div>

              {/* Password with show/hide */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Passwort</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={zeigePasswort ? 'text' : 'password'}
                    name="passwort"
                    value={form.passwort}
                    onChange={handleChange}
                    placeholder="Mindestens 8 Zeichen"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    style={{ width: '100%', paddingRight: 90, boxSizing: 'border-box' }}
                  />
                  <PasswortToggle zeige={zeigePasswort} onToggle={() => setZeigePasswort(v => !v)} />
                </div>
              </div>

              {/* Password confirm with show/hide */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Passwort bestätigen</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={zeigePasswortBestaetigen ? 'text' : 'password'}
                    name="passwortBestaetigen"
                    value={form.passwortBestaetigen}
                    onChange={handleChange}
                    placeholder="Passwort wiederholen"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    style={{ width: '100%', paddingRight: 90, boxSizing: 'border-box' }}
                  />
                  <PasswortToggle zeige={zeigePasswortBestaetigen} onToggle={() => setZeigePasswortBestaetigen(v => !v)} />
                </div>
              </div>

              {/* Klasse — only for KST and GAV, grade range from school config */}
              {zeigeKlasse && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Jahrgangsstufe</label>
                    <select name="klasse" value={form.klasse} onChange={handleChange} required>
                      <option value="">Stufe</option>
                      {stufenOptionen.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Klasse (Buchstabe)</label>
                    <input
                      type="text"
                      name="klassenBuchstabe"
                      value={form.klassenBuchstabe}
                      onChange={handleChange}
                      placeholder="z.B. a"
                      maxLength={1}
                      style={{ textTransform: 'lowercase' }}
                    />
                  </div>
                </div>
              )}

              {/* ── Required consents ─────────────────────────────── */}

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={alterBestaetigt} onChange={(e) => setAlterBestaetigt(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--accent)', width: 15, height: 15 }} />
                <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Ich bestätige, dass ich mindestens 16 Jahre alt bin oder die Einwilligung meiner Erziehungsberechtigten zur Nutzung von SchulHub vorliegt.{' '}
                  <span style={{ color: 'var(--danger)' }}>*</span>
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={datenschutzBestaetigt} onChange={(e) => setDatenschutzBestaetigt(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--accent)', width: 15, height: 15 }} />
                <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Ich habe die{' '}
                  <Link to="/datenschutz" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Datenschutzerklärung</Link>{' '}
                  gelesen und stimme der Verarbeitung meiner Daten zu.{' '}
                  <span style={{ color: 'var(--danger)' }}>*</span>
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={nutzungsbedingungenBestaetigt} onChange={(e) => setNutzungsbedingungenBestaetigt(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--accent)', width: 15, height: 15 }} />
                <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Ich habe die{' '}
                  <Link to="/nutzungsbedingungen" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Nutzungsbedingungen</Link>{' '}
                  gelesen und akzeptiere sie.{' '}
                  <span style={{ color: 'var(--danger)' }}>*</span>
                </span>
              </label>

              {/* ── Optional: Benachrichtigungen ───────────────────── */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={benachrichtigungen}
                    onChange={(e) => setBenachrichtigungen(e.target.checked)}
                    style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--accent)', width: 15, height: 15 }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                    Ich möchte gelegentlich per E-Mail über neue Funktionen und wichtige Hinweise von SchulHub informiert werden.{' '}
                    <span style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.7 }}>(optional — kann jederzeit widerrufen werden)</span>
                  </span>
                </label>
              </div>
            </>
          )}

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>
          )}

          <LoadingButton
            status={status}
            loadingText="Registrieren…"
            successText="Konto erstellt ✓"
            errorText="Fehler — nochmal versuchen"
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: 14,
              opacity: canSubmit ? 1 : 0.45,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            Konto erstellen
          </LoadingButton>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
          Bereits registriert?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>Anmelden</Link>
        </p>
      </div>
    </div>
  )
}
