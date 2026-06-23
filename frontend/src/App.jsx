// frontend/src/App.jsx
// BUGS FIXED:
// 1. LoadingScreen was firing on every route change (1.6s delay on every navigation).
//    Fix: useRef(false) guard — once mounted, never re-trigger.
// 2. Floating ThemeToggle in App.jsx was overlapping Landing page nav.
//    Fix: removed global ThemeToggle from App. It lives in Dashboard SettingsPanel → Darstellung.
//    That's the right place — authenticated users configure it in their settings, not a floating global button.
//
// RULES:
// - BrowserRouter MUST wrap everything here (required for useNavigate/useLocation in children)
// - LoadingScreen MUST use `visible` prop, NOT conditional rendering: <LoadingScreen visible={laden} />
// - Linux import paths are case-sensitive — Loadingscreen.jsx is lowercase 's'
// - ThemeProvider must be outermost so all pages get CSS variables

import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import LoadingScreen from './components/ui/Loadingscreen'

import Landing            from './pages/Landing'
import Login              from './pages/Login'
import Register           from './pages/Register'
import Verify             from './pages/Verify'
import Dashboard          from './pages/Dashboard'
import PasswortVergessen  from './pages/PasswortVergessen'
import Impressum          from './pages/Impressum'
import Datenschutz        from './pages/Datenschutz'
import Nutzungsbedingungen from './pages/Nutzungsbedingungen'
import ProtectedRoute from './components/ui/ProtectedRoute'
import Noten from "./pages/Noten"
// ── AppInner is inside BrowserRouter so hooks like useLocation work if needed ──

function AppInner() {
  const [laden, setLaden] = useState(true)
  const hasMounted = useRef(false)

  useEffect(() => {
    // Guard: only run on initial mount.
    // Without this guard, any effect dependency that changes on navigation
    // (e.g. location) would re-trigger the 600ms loading flash on every page change.
    if (hasMounted.current) return
    hasMounted.current = true

    const timer = setTimeout(() => setLaden(false), 600)
    return () => clearTimeout(timer)
  }, []) // empty dep array + ref guard = fires exactly once

  return (
    <>
      <LoadingScreen visible={laden} />
      <Routes>
        <Route path="/"                     element={<Landing />}            />
        <Route path="/login"                element={<Login />}              />
        <Route path="/registrieren"         element={<Register />}           />
        <Route path="/verify"               element={<Verify />}             />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />       
        <Route path="/passwort-vergessen"   element={<PasswortVergessen />}  />
        <Route path="/impressum"            element={<Impressum />}          />
        <Route path="/datenschutz"          element={<Datenschutz />}        />
        <Route path="/nutzungsbedingungen"  element={<Nutzungsbedingungen />}/>
        <Route path="/noten" element={
          <ProtectedRoute>
            <Noten />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  )
}

// ── App is the root — ThemeProvider → BrowserRouter → AppInner ──────────────

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </ThemeProvider>
  )
}
