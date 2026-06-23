import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import api from '../api/axios'
import LoadingButton from '../components/ui/LoadingButton'
import Logo from '../components/ui/Logo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [zeigePasswort, setZeigePasswort] = useState(false)
  const [fehler, setFehler] = useState('')
  const [status, setStatus] = useState('idle')
  const navigate = useNavigate()
  const location = useLocation()
  const nachricht = location.state?.nachricht

  async function handleLogin(e) {
    e.preventDefault()
    setFehler('')
    setStatus('loading')
    try {
      await api.post('/auth/einloggen', { email, passwort })
      setStatus('success')
      navigate('/dashboard')
    } catch (err) {
      setFehler(err.response?.data?.fehler || 'Ein Fehler ist aufgetreten')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 40 }}>
          <Logo size="lg" />
          <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 20 }}>Willkommen zurück</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>Melde dich mit deiner E-Mail-Adresse an.</p>
        </div>

        {nachricht && (
          <p style={{ color: 'var(--success)', fontSize: 14, marginBottom: 16, padding: '10px 14px', border: '1px solid var(--success)', borderRadius: 6 }}>
            {nachricht}
          </p>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          {/* Password field with show/hide toggle */}
          <div style={{ position: 'relative' }}>
            <input
              type={zeigePasswort ? 'text' : 'password'}
              placeholder="Passwort"
              value={passwort}
              onChange={e => setPasswort(e.target.value)}
              required
              style={{ width: '100%', paddingRight: 90, boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => setZeigePasswort(v => !v)}
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
              {zeigePasswort ? 'HIDE' : 'SHOW'}
            </button>
          </div>

          <div style={{ textAlign: 'right', marginTop: -4 }}>
            <Link to="/passwort-vergessen" style={{ fontSize: 13, color: 'var(--muted)' }}>
              Passwort vergessen?
            </Link>
          </div>

          {fehler && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{fehler}</p>}
          <LoadingButton
            type="submit"
            status={status}
            loadingText="Einloggen..."
            successText="Erfolgreich!"
            errorText="Fehler — nochmal"
            style={{ width: '100%', marginTop: 4, fontSize: 15 }}
          >
            Einloggen
          </LoadingButton>
        </form>

        <p style={{ marginTop: 24, color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
          Noch kein Konto? <Link to="/registrieren">Registrieren</Link>
        </p>
      </div>
    </div>
  )
}
