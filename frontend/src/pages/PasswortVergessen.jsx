import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import LoadingButton from '../components/ui/LoadingButton'
import Logo from '../components/ui/Logo'

export default function PasswortVergessen() {
  const [schritt, setSchritt] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [neuesPasswort, setNeuesPasswort] = useState('')
  const [passwortWiederholen, setPasswortWiederholen] = useState('')
  const [zeigeNeuesPasswort, setZeigeNeuesPasswort] = useState(false)
  const [zeigeWiederholen, setZeigeWiederholen] = useState(false)
  const [fehler, setFehler] = useState('')
  const [status, setStatus] = useState('idle')
  const navigate = useNavigate()

  async function handleEmailSenden(e) {
    e.preventDefault()
    setFehler('')
    setStatus('loading')
    try {
      await api.post('/auth/passwort-vergessen', { email })
      setStatus('success')
      setTimeout(() => { setStatus('idle'); setSchritt(2) }, 1000)
    } catch (err) {
      setFehler(err.response?.data?.fehler || 'Ein Fehler ist aufgetreten')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  async function handlePasswortAendern(e) {
    e.preventDefault()
    setFehler('')
    if (neuesPasswort !== passwortWiederholen) {
      return setFehler('Passwörter stimmen nicht überein')
    }
    if (neuesPasswort.length < 8) {
      return setFehler('Passwort muss mindestens 8 Zeichen lang sein')
    }
    setStatus('loading')
    try {
      await api.post('/auth/passwort-zuruecksetzen', { email, code, neuesPasswort })
      setStatus('success')
      setTimeout(() => {
        navigate('/login', { state: { nachricht: 'Passwort geändert! Du kannst dich jetzt einloggen.' } })
      }, 1200)
    } catch (err) {
      setFehler(err.response?.data?.fehler || 'Ein Fehler ist aufgetreten')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  function zumAnfang() {
    setSchritt(1)
    setCode('')
    setNeuesPasswort('')
    setPasswortWiederholen('')
    setZeigeNeuesPasswort(false)
    setZeigeWiederholen(false)
    setFehler('')
    setStatus('idle')
  }

  // Reusable show/hide toggle
  const PasswortToggle = ({ zeige, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      style={{
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: 'var(--muted)',
        cursor: 'pointer',
        fontSize: 11,
        fontFamily: 'var(--mono)',
        letterSpacing: '0.04em',
        padding: '2px 4px',
      }}
    >
      {zeige ? 'HIDE' : 'SHOW'}
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ marginBottom: 40 }}>
          <Logo size="lg" />
          <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 20 }}>Passwort vergessen</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>
            {schritt === 1
              ? 'Wir senden dir einen Code per Email.'
              : `Code gesendet an ${email}`}
          </p>
        </div>

        {schritt === 1 ? (
          <form onSubmit={handleEmailSenden} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={e => { setEmail(e.target.value); setFehler('') }}
              required
            />
            {fehler && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{fehler}</p>}
            <LoadingButton
              type="submit"
              status={status}
              loadingText="Senden..."
              successText="Code gesendet!"
              errorText="Fehler — nochmal"
              style={{ width: '100%', marginTop: 4, fontSize: 15 }}
            >
              Code senden
            </LoadingButton>
          </form>
        ) : (
          <form onSubmit={handlePasswortAendern} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Code input */}
            <input
              type="text"
              placeholder="6-stelliger Code"
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setFehler('') }}
              maxLength={6}
              inputMode="numeric"
              required
              style={{ letterSpacing: 6, fontSize: 22, textAlign: 'center', fontFamily: 'var(--mono)' }}
            />

            {/* New password with show/hide */}
            <div style={{ position: 'relative' }}>
              <input
                type={zeigeNeuesPasswort ? 'text' : 'password'}
                placeholder="Neues Passwort"
                value={neuesPasswort}
                onChange={e => { setNeuesPasswort(e.target.value); setFehler('') }}
                required
                style={{ width: '100%', paddingRight: 90, boxSizing: 'border-box' }}
              />
              <PasswortToggle zeige={zeigeNeuesPasswort} onToggle={() => setZeigeNeuesPasswort(v => !v)} />
            </div>

            {/* Repeat password with show/hide */}
            <div style={{ position: 'relative' }}>
              <input
                type={zeigeWiederholen ? 'text' : 'password'}
                placeholder="Passwort wiederholen"
                value={passwortWiederholen}
                onChange={e => { setPasswortWiederholen(e.target.value); setFehler('') }}
                required
                style={{ width: '100%', paddingRight: 90, boxSizing: 'border-box' }}
              />
              <PasswortToggle zeige={zeigeWiederholen} onToggle={() => setZeigeWiederholen(v => !v)} />
            </div>

            {fehler && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{fehler}</p>}
            <LoadingButton
              type="submit"
              status={status}
              loadingText="Ändern..."
              successText="Passwort geändert!"
              errorText="Fehler — nochmal"
              style={{ width: '100%', marginTop: 4, fontSize: 15 }}
            >
              Passwort ändern
            </LoadingButton>
            <button
              type="button"
              onClick={zumAnfang}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', marginTop: 4 }}
            >
              Anderen Code anfordern
            </button>
          </form>
        )}

        <p style={{ marginTop: 24, color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
          <Link to="/login">← Zurück zum Login</Link>
        </p>

      </div>
    </div>
  )
}
