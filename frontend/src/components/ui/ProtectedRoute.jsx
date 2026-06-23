// frontend/src/components/ProtectedRoute.jsx
// Auth guard — wraps any route that requires login.
// Calls /api/profil (existing endpoint, auth middleware) to verify JWT cookie.
// - Valid cookie → renders children normally
// - No cookie / expired / invalid → redirects to /login
// - While checking → renders null (blank, avoids flash of protected content)
//
// Usage in App.jsx:
//   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//   <Route path="/noten"     element={<ProtectedRoute><NotenKommt /></ProtectedRoute>} />

import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../../api/axios'

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking') // 'checking' | 'ok' | 'unauthorized'

  useEffect(() => {
    api.get('/profil')
      .then(() => setStatus('ok'))
      .catch(() => setStatus('unauthorized'))
  }, [])

  if (status === 'checking') return null
  if (status === 'unauthorized') return <Navigate to="/login" replace />
  return children
}
