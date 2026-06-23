import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import api from '../api/axios'
import LoadingButton from '../components/ui/LoadingButton'
import { getErrorMessage } from '../utils/apiError'
import Logo from '../components/ui/Logo'

const RESEND_COOLDOWN_SECS = 60

export default function Verify() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(() => {
    return location.state?.email || sessionStorage.getItem('verify_email') || ''
  })
  const [code, setCode] = useState('')
  const [neueEmail, setNeueEmail] = useState('')
  const [emailAendernPasswort, setEmailAendernPasswort] = useState('')
  const [emailAendernOffen, setEmailAendernOffen] = useState(false)

  const [verifizierenStatus, setVerifizierenStatus] = useState({ state: 'idle', message: '' })
  const [neusendenStatus, setNeusendenStatus] = useState({ state: 'idle', message: '' })
  const [emailAendernStatus, setEmailAendernStatus] = useState({ state: 'idle', message: '' })

  // Resend cooldown — tracks seconds remaining
  const [cooldownSek, setCooldownSek] = useState(0)
  const cooldownRef = useRef(null)

  useEffect(() => {
    if (email) sessionStorage.setItem('verify_email', email)
  }, [email])

  // Countdown timer — ticks every second while cooldown is active
  useEffect(() => {
    if (cooldownSek <= 0) return
    cooldownRef.current = setInterval(() => {
      setCooldownSek(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(cooldownRef.current)
  }, [cooldownSek > 0])  // only start a new interval when transitioning from 0 → active

  async function handleVerifizieren(e) {
    e.preventDefault()
    setVerifizierenStatus({ state: 'loading', message: '' })
    try {
      await api.post('/auth/verifizieren', { email, code })
      setVerifizierenStatus({ state: 'success', message: '' })
      sessionStorage.removeItem('verify_email')
      setTimeout(() => {
        navigate('/login', { state: { nachricht: 'E-Mail bestätigt! Du kannst dich jetzt einloggen.' } })
      }, 800)
    } catch (err) {
      setVerifizierenStatus({ state: 'error', message: getErrorMessage(err, 'verify') })
    }
  }

  async function handleCodeNeuSenden() {
    if (cooldownSek > 0) return
    setNeusendenStatus({ state: 'loading', message: '' })
    try {
      await api.post('/auth/code-neu-senden', { email })
      setCooldownSek(RESEND_COOLDOWN_SECS)
      setNeusendenStatus({ state: 'success', message: 'Neuer Code gesendet.' })
      setTimeout(() => setNeusendenStatus({ state: 'idle', message: '' }), 3000)
    } catch (err) {
      setNeusendenStatus({ state: 'error', message: getErrorMessage(err, 'code-neu-senden') })
      setTimeout(() => setNeusendenStatus({ state: 'idle', message: '' }), 4000)
    }
  }

  // FIX June 20 evening: backend now requires `passwort` on this call as the
  // ownership check that closes the account-takeover hole (see authController.js).
  // Previously this only sent alteEmail + neueEmail — would now fail every time
  // with the new backend deployed, since the field is missing entirely.
  async function handleEmailAendern(e) {
    e.preventDefault()
    setEmailAendernStatus({ state: 'loading', message: '' })
    try {
      const res = await api.post('/auth/email-aendern', {
        alteEmail: email,
        neueEmail,
        passwort: emailAendernPasswort,
      })
      setEmail(res.data.email)
      sessionStorage.setItem('verify_email', res.data.email)
      setNeueEmail('')
      setEmailAendernPasswort('')
      // Reset cooldown when email changes — new code was just sent
      setCooldownSek(RESEND_COOLDOWN_SECS)
      setEmailAendernStatus({ state: 'success', message: '' })
      setTimeout(() => {
        setEmailAendernOffen(false)
        setEmailAendernStatus({ state: 'idle', message: '' })
      }, 800)
    } catch (err) {
      setEmailAendernStatus({ state: 'error', message: getErrorMessage(err, 'email-aendern') })
    }
  }

  const resendDisabled = neusendenStatus.state === 'loading' || cooldownSek > 0

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ marginBottom: 40 }}>
          <Logo size="lg" />
          <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 20 }}>E-Mail bestätigen</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>
            Wir haben einen 6-stelligen Code an <strong style={{ color: 'var(--text)' }}>{email}</strong> gesendet.
          </p>
        </div>

        {!emailAendernOffen ? (
          <>
            <form onSubmit={handleVerifizieren} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="6-stelliger Code"
                value={code}
                onChange={e => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  if (verifizierenStatus.state === 'error') setVerifizierenStatus({ state: 'idle', message: '' })
                }}
                maxLength={6}
                inputMode="numeric"
                style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }}
                required
              />
              {verifizierenStatus.message && (
                <p style={{ color: 'var(--danger)', fontSize: 13 }}>{verifizierenStatus.message}</p>
              )}
              <LoadingButton
                type="submit"
                status={verifizierenStatus.state}
                disabled={verifizierenStatus.state === 'loading' || code.length !== 6}
                loadingText="Wird geprüft..."
                successText="Bestätigt"
                errorText="Fehlgeschlagen"
              >
                Bestätigen
              </LoadingButton>
            </form>

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <LoadingButton
                  status={neusendenStatus.state}
                  onClick={handleCodeNeuSenden}
                  disabled={resendDisabled}
                  loadingText="Wird gesendet..."
                  successText="Code gesendet"
                  errorText="Senden fehlgeschlagen"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendDisabled ? 'var(--muted)' : 'var(--accent)',
                    fontSize: 14,
                    cursor: resendDisabled ? 'default' : 'pointer',
                    padding: '4px 8px',
                    opacity: resendDisabled ? 0.5 : 1,
                  }}
                >
                  {cooldownSek > 0
                    ? `Code erneut senden (${cooldownSek}s)`
                    : 'Code erneut senden'}
                </LoadingButton>
                {neusendenStatus.message && (
                  <p style={{ fontSize: 12, color: neusendenStatus.state === 'error' ? 'var(--danger)' : 'var(--success)' }}>
                    {neusendenStatus.message}
                  </p>
                )}
              </div>

              <button
                onClick={() => setEmailAendernOffen(true)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer' }}
              >
                Falsche E-Mail? Hier ändern
              </button>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleEmailAendern} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email"
                placeholder="Neue E-Mail-Adresse"
                value={neueEmail}
                onChange={e => {
                  setNeueEmail(e.target.value)
                  if (emailAendernStatus.state === 'error') setEmailAendernStatus({ state: 'idle', message: '' })
                }}
                required
              />
              <input
                type="password"
                placeholder="Dein Passwort (zur Bestätigung)"
                value={emailAendernPasswort}
                onChange={e => {
                  setEmailAendernPasswort(e.target.value)
                  if (emailAendernStatus.state === 'error') setEmailAendernStatus({ state: 'idle', message: '' })
                }}
                required
              />
              {emailAendernStatus.message && (
                <p style={{ color: 'var(--danger)', fontSize: 13 }}>{emailAendernStatus.message}</p>
              )}
              <LoadingButton
                type="submit"
                status={emailAendernStatus.state}
                disabled={emailAendernStatus.state === 'loading'}
                loadingText="Wird geändert..."
                successText="E-Mail geändert"
                errorText="Änderung fehlgeschlagen"
              >
                E-Mail ändern & neuen Code senden
              </LoadingButton>
            </form>
            <button
              onClick={() => {
                setEmailAendernOffen(false)
                setEmailAendernPasswort('')
                setEmailAendernStatus({ state: 'idle', message: '' })
              }}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', marginTop: 16 }}
            >
              ← Zurück
            </button>
          </>
        )}

        <p style={{ marginTop: 32, color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
          <Link to="/login">Zurück zum Login</Link>
        </p>
      </div>
    </div>
  )
}