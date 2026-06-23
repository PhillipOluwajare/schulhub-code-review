const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// FIX June 20 evening, aux security review:
// pg's Pool emits an 'error' event when an IDLE client hits an unexpected
// error (backend terminates the connection, network blip, Postgres
// restart, etc). With no listener attached, that event becomes an
// uncaught exception and crashes the entire Node process — every user
// goes down at once, not just the one query that failed. This is the
// single highest-leverage fix in this review: one line, and it's the
// difference between "one query fails" and "the whole server is down
// until PM2 restarts it."
pool.on('error', (err) => {
  console.error('Unerwarteter Fehler bei einem inaktiven DB-Client:', err.message);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Datenbankverbindung fehlgeschlagen:', err.message);
  } else {
    release();
    console.log('Datenbankverbindung erfolgreich!');
  }
});

module.exports = pool;