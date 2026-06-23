/**
 * apiError.js — SchulHub error message resolver
 *
 * Takes an axios error and a context string,
 * returns a precise German user-facing message.
 *
 * Usage:
 *   import { getErrorMessage } from '../utils/apiError'
 *   setFehler(getErrorMessage(err, 'login'))
 */

export function getErrorMessage(err, context = 'general') {
  // No response at all — network/server down
  if (!err.response) {
    return 'Keine Verbindung. Bitte Internetverbindung prüfen.'
  }

  const status = err.response?.status
  const serverMessage = err.response?.data?.fehler || ''

  switch (context) {

    case 'login':
      if (status === 401) return 'E-Mail oder Passwort falsch.'
      if (status === 403) return 'E-Mail-Adresse noch nicht bestätigt. Bitte überprüfe dein Postfach.'
      if (status === 404) return 'Kein Konto mit dieser E-Mail gefunden.'
      if (status >= 500)  return 'Serverfehler. Bitte in ein paar Minuten nochmal versuchen.'
      return 'Anmeldung fehlgeschlagen. Bitte nochmal versuchen.'

    case 'register':
      if (status === 409) return 'Diese E-Mail-Adresse ist bereits registriert.'
      if (status === 422) return 'Nur @kst-vechta.de E-Mail-Adressen sind erlaubt.'
      if (status === 400) return serverMessage || 'Ungültige Eingabe. Bitte alle Felder prüfen.'
      if (status >= 500)  return 'Serverfehler. Bitte in ein paar Minuten nochmal versuchen.'
      return 'Registrierung fehlgeschlagen. Bitte nochmal versuchen.'

    case 'verify':
      if (status === 400) return 'Falscher oder abgelaufener Code. Bitte neuen Code anfordern.'
      if (status === 404) return 'Konto nicht gefunden. Bitte neu registrieren.'
      if (status === 429) return 'Zu viele Versuche. Bitte kurz warten.'
      if (status >= 500)  return 'Serverfehler. Bitte in ein paar Minuten nochmal versuchen.'
      return 'Bestätigung fehlgeschlagen. Bitte nochmal versuchen.'

    case 'code-neu-senden':
      if (status === 400) return 'E-Mail-Adresse bereits bestätigt.'
      if (status === 404) return 'Kein Konto mit dieser E-Mail gefunden.'
      if (status === 429) return 'Bitte warte kurz bevor du einen neuen Code anforderst.'
      if (status >= 500)  return 'Code konnte nicht gesendet werden. Bitte später nochmal versuchen.'
      return 'Senden fehlgeschlagen. Bitte nochmal versuchen.'

    case 'email-aendern':
      if (status === 400) return 'Ungültige Eingabe. Bitte alle Felder prüfen.'
      if (status === 404) return 'Konto nicht gefunden.'
      if (status === 409) return 'Diese E-Mail-Adresse ist bereits registriert.'
      if (status === 422) return 'Nur @kst-vechta.de E-Mail-Adressen sind erlaubt.'
      if (status >= 500)  return 'E-Mail konnte nicht geändert werden. Bitte später nochmal versuchen.'
      return 'Änderung fehlgeschlagen. Bitte nochmal versuchen.'

    case 'webuntis':
      if (status === 400 || status === 401) return 'Falsche WebUntis-Zugangsdaten. Bitte nochmal prüfen.'
      if (status === 403) return 'Zugriff verweigert.'
      if (status >= 500)  return 'WebUntis konnte nicht erreicht werden. Bitte später nochmal versuchen.'
      return 'WebUntis konnte nicht verbunden werden.'

    case 'webuntis-disconnect':
      if (status === 401) return 'Nicht eingeloggt. Bitte Seite neu laden.'
      if (status >= 500)  return 'Serverfehler beim Abmelden.'
      return 'Abmelden fehlgeschlagen. Bitte nochmal versuchen.'

    case 'stundenplan':
      if (status === 401) return 'Sitzung abgelaufen. Bitte neu einloggen.'
      if (status >= 500)  return 'Stundenplan konnte nicht geladen werden.'
      return 'Stundenplan nicht verfügbar.'

    case 'hausaufgabe-hinzufuegen':
      if (status === 400) return 'Bitte alle Felder ausfüllen.'
      if (status === 401) return 'Sitzung abgelaufen. Bitte neu einloggen.'
      if (status >= 500)  return 'Hausaufgabe konnte nicht gespeichert werden.'
      return 'Hinzufügen fehlgeschlagen. Bitte nochmal versuchen.'

    case 'hausaufgabe-erledigen':
      if (status === 403) return 'Keine Berechtigung für diese Hausaufgabe.'
      if (status === 404) return 'Hausaufgabe nicht gefunden.'
      if (status === 401) return 'Sitzung abgelaufen. Bitte neu einloggen.'
      if (status >= 500)  return 'Konnte nicht als erledigt markiert werden.'
      return 'Aktion fehlgeschlagen. Bitte nochmal versuchen.'

    case 'hausaufgabe-loeschen':
      if (status === 403) return 'Keine Berechtigung, diese Hausaufgabe zu löschen.'
      if (status === 404) return 'Hausaufgabe nicht gefunden — möglicherweise bereits gelöscht.'
      if (status === 401) return 'Sitzung abgelaufen. Bitte neu einloggen.'
      if (status >= 500)  return 'Hausaufgabe konnte nicht gelöscht werden.'
      return 'Löschen fehlgeschlagen. Bitte nochmal versuchen.'

    case 'profil':
      if (status === 400) return 'Ungültige Eingabe. Bitte alle Felder prüfen.'
      if (status === 401) return 'Sitzung abgelaufen. Bitte neu einloggen.'
      if (status >= 500)  return 'Profil konnte nicht gespeichert werden.'
      return 'Speichern fehlgeschlagen. Bitte nochmal versuchen.'

    default:
      if (status === 401) return 'Sitzung abgelaufen. Bitte neu einloggen.'
      if (status >= 500)  return 'Serverfehler. Bitte in ein paar Minuten nochmal versuchen.'
      return serverMessage || 'Ein Fehler ist aufgetreten. Bitte nochmal versuchen.'
  }
}