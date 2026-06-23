const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./db/index');

const app = express();
app.set('trust proxy', 'loopback')
const PORT = process.env.PORT || 5000;

// ─── Sentry (must be first, before any other middleware) ──────────────────────
let Sentry = null;
try {
  Sentry = require('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'production' });
  console.log('Sentry initialised');
} catch (err) {
  console.error('Sentry failed to initialise:', err.message);
  Sentry = null;
}

// ─── Core middleware ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cookieParser());

// FIX: Use conditional to avoid "http://undefined:5173" being added to allowedOrigins
// when LOCAL_IP is not set in the environment (which it isn't on production).
const allowedOrigins = [
  'http://localhost:5173',
  process.env.LOCAL_IP ? `http://${process.env.LOCAL_IP}:5173` : null,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked: ' + origin));
    }
  },
  credentials: true
}));

app.use(express.json());

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Strict limiter for auth routes (login, register, password reset etc.)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { fehler: 'Zu viele Versuche. Bitte 15 Minuten warten.' }
});

// General limiter for authenticated API routes — prevents scripted hammering.
// 60 req/min is invisible to normal use; a full page load is ~3-5 requests.
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { fehler: 'Zu viele Anfragen. Bitte kurz warten.' }
});

// ─── Health & monitoring endpoints ───────────────────────────────────────────

// Basic liveness — was already here
app.get('/', (req, res) => {
  res.json({ message: 'SchulHub Backend laeuft!', status: 'online' });
  // FIX: removed version: '1.0.0' — unnecessary info disclosure
});

// DB health — UptimeRobot monitor 1
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, db: 'unreachable' });
  }
});

// Build timestamp — detects stale code / rogue process
// UptimeRobot monitor 2: check this returns 200
// Manually verify: the timestamp should change after every deploy
app.get('/api/ping', (req, res) => {
  res.json({
    ok: true,
    built: process.env.BUILD_TIMESTAMP || 'not set',
    started: app.locals.startedAt,
    // FIX: removed env: process.env.NODE_ENV — minor info disclosure, not needed externally
  });
});

// WebUntis smoke test — UptimeRobot monitor 3
// Uses HEALTH_UNTIS_USER + HEALTH_UNTIS_PASS from .env (your own KST credentials)
// Returns 200 if WebUntis login succeeds, 503 if it fails
// UptimeRobot alert triggers on anything other than 200
app.get('/api/health/webuntis', async (req, res) => {
  const { WebUntis } = require('webuntis');

  const user = process.env.HEALTH_UNTIS_USER;
  const pass = process.env.HEALTH_UNTIS_PASS;

  if (!user || !pass) {
    return res.json({ ok: true, webuntis: 'skipped', reason: 'credentials not configured' });
  }

  try {
    const untis = new WebUntis(
      'kolleg-st-thomas',
      user,
      pass,
      'kolleg-st-thomas.webuntis.com'
    );

    await untis.login();
    const today = new Date();
    const timetable = await untis.getOwnTimetableFor(today);
    await untis.logout();

    res.json({
      ok: true,
      webuntis: 'reachable',
      lessonsToday: timetable.length,
      checkedAt: new Date().toISOString()
    });

  } catch (err) {
    // FIX: Error message logged server-side and captured by Sentry.
    // Do NOT include err.message in the response — this endpoint is public
    // and WebUntis errors can contain internal infrastructure details.
    console.error('WebUntis health check failed:', err.message);
    res.status(503).json({
      ok: false,
      webuntis: 'unreachable',
      checkedAt: new Date().toISOString()
    });
  }
});

// ─── App routes ───────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
app.use('/api/auth', authLimiter, authRoutes);

// FIX: apiLimiter applied to all authenticated routes.
// Prevents scripted hammering — especially /api/stundenplan/woche which
// triggers live WebUntis API calls on cache miss.
const stundenplanRoutes = require('./routes/stundenplan');
app.use('/api/stundenplan', apiLimiter, stundenplanRoutes);

const hausaufgabenRoutes = require('./routes/hausaufgaben');
app.use('/api/hausaufgaben', apiLimiter, hausaufgabenRoutes);

const profilRoutes = require('./routes/profil');
app.use('/api/profil', apiLimiter, profilRoutes);

const kontoRoutes = require('./routes/konto');
app.use('/api/konto', apiLimiter, kontoRoutes);

const termineRouter = require('./routes/termine')
app.use('/api/termine', apiLimiter, termineRouter)

const notenRoutes = require('./routes/noten')
app.use('/api/noten', apiLimiter, notenRoutes)

// ─── Sentry error handler (must be after routes, before any other error handler)

// ─── Generic error fallback ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ fehler: 'Interner Serverfehler' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.locals.startedAt = new Date().toISOString();
app.listen(PORT, () => {
  console.log('SchulHub Backend laeuft auf Port ' + PORT);
  console.log('Build timestamp:', process.env.BUILD_TIMESTAMP || 'not set');
});