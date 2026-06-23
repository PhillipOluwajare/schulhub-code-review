// backend/utils/webuntisCrypto.js
//
// NEW FILE — June 20 evening, aux security review.
//
// Replaces crypto-js's AES.encrypt(text, passphrase) for WebUntis credential
// storage. crypto-js's passphrase mode derives the actual encryption key via
// EVP_BytesToKey using MD5 — dated, not a real KDF, no iteration cost. It does
// embed a random salt per call (so identical passwords don't produce identical
// ciphertext), but if ENCRYPTION_KEY ever leaked, every stored WebUntis
// credential is one MD5-speed derivation away from plaintext.
//
// This uses Node's built-in crypto module directly: AES-256-GCM with an
// explicit 32-byte key (not a passphrase) and a random 12-byte IV per call.
// GCM is authenticated — tampering with stored ciphertext is detected on
// decrypt, which CBC (what crypto-js was using) doesn't give you.
//
// ⚠️ DEPLOYMENT NOTE — READ BEFORE APPLYING:
// ENCRYPTION_KEY must change format: from "any passphrase string" to a
// 64-character hex string (32 bytes). Generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//
// ⚠️ EXISTING DATA WILL NOT DECRYPT under the new scheme — different
// algorithm, different key format, different ciphertext layout. Any row
// with webuntis_password_encrypted set under the OLD crypto-js scheme
// becomes unreadable the moment this ships. At current scale (Muaz at AKS,
// possibly one or two others) the practical move is: on deploy, run a
// one-time migration that NULLs webuntis_username and
// webuntis_password_encrypted for all existing rows, so getUntisConfig's
// existing "Zugangsdaten nicht hinterlegt" check naturally prompts those
// few users to re-enter credentials once, rather than attempting to decrypt
// old data with the old method and re-encrypt with the new one in the same
// migration (doable, but more moving parts than it's worth for 1-2 rows).
// Confirm the affected user count with Phillip before deploying this.

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended IV size for GCM

function getKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY muss ein 64-Zeichen-Hex-String sein (32 Byte). Siehe webuntisCrypto.js Kommentar.');
  }
  return Buffer.from(keyHex, 'hex');
}

function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // iv:authTag:ciphertext, all base64, colon-separated for easy storage as one TEXT column
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decrypt(payload) {
  const key = getKey();
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Ungültiges Verschlüsselungsformat — Daten evtl. noch im alten crypto-js Format gespeichert.');
  }
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
