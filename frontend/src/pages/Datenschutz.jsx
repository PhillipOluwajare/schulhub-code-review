import { Link } from 'react-router-dom'

export default function Datenschutz() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <nav className="legal-nav">
          <Link to="/" className="legal-back">← Zurück</Link>
        </nav>

        <header className="legal-header">
          <p className="legal-label">Gemäß Art. 13, 14 DSGVO</p>
          <h1 className="legal-title">Datenschutzerklärung</h1>
          <p className="legal-date">Stand: Juni 2026</p>
        </header>

        {/* 1 */}
        <section className="legal-section">
          <h2>1. Verantwortlicher</h2>
          <p>
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          </p>
          <p>
            Oluwajare Phillip Alabi<br />
            Eschstraße 11<br />
            49377 Vechta<br />
            Deutschland<br />
            E-Mail: <a href="mailto:kontakt@schulhub.eu">kontakt@schulhub.eu</a>
          </p>
        </section>

        {/* 2 */}
        <section className="legal-section">
          <h2>2. Welche Daten wir verarbeiten und warum</h2>

          <h3>2.1 Registrierung und Nutzerkonto</h3>
          <p>
            Bei der Registrierung erheben wir folgende Daten:
          </p>
          <ul>
            <li>
              E-Mail-Adresse — Schülerinnen und Schüler des Kolleg St. Thomas Vechta
              und des Gymnasium Antonianum Vechta registrieren sich mit ihrer
              schulischen E-Mail-Adresse (@kst-vechta.de bzw. @gavec.de).
              Schülerinnen und Schüler der Adolf-Kolping-Schule Lohne und der
              Justus-von-Liebig-Schule Vechta registrieren sich mit ihrer privaten
              E-Mail-Adresse, da diese Schulen keine Schüler-E-Mail-Adressen vergeben.
            </li>
            <li>Vor- und Nachname</li>
            <li>Schule (Kolleg St. Thomas, Gymnasium Antonianum Vechta, Adolf-Kolping-Schule oder Justus-von-Liebig-Schule)</li>
            <li>Gewähltes Passwort (wird mittels bcrypt gehasht gespeichert — das Klartext-Passwort ist für uns zu keinem Zeitpunkt einsehbar)</li>
            <li>Klasse und Jahrgangsstufe (nur für Schulen, bei denen dies relevant ist — bei Berufsschulen optional)</li>
          </ul>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung — Bereitstellung des Dienstes).
          </p>
          <p>
            <strong>Speicherdauer:</strong> Bis zur Löschung des Nutzerkontos durch den Nutzer oder durch uns nach Maßgabe dieser Erklärung.
          </p>

          <h3>2.2 E-Mail-Verifikation und Passwort-Reset</h3>
          <p>
            Zur Verifikation der E-Mail-Adresse und zum Zurücksetzen des Passworts
            versenden wir einmalige, zeitlich begrenzte Codes an die bei der
            Registrierung angegebene E-Mail-Adresse. Diese Codes werden nach
            Ablauf automatisch gelöscht.
          </p>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO.
          </p>

          <h3>2.3 Hausaufgaben, Notizen und Termine</h3>
          <p>
            Hausaufgaben, Termine und ähnliche Einträge, die du in SchulHub
            anlegst, werden in unserem System gespeichert und sind
            ausschließlich für dich sichtbar, sofern du sie nicht aktiv mit
            der Klasse teilst. Termine umfassen Titel, Datum, Uhrzeit sowie
            eine optionale Notiz.
          </p>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO.
          </p>

          <h3>2.4 Noten und Schulleistungsdaten</h3>
          <p>
            Wenn du Noten einträgst, speichern wir: Fach, Note (1–6), Notentyp
            (Klassenarbeit, mündlich, sonstige), Datum und optionale Notiz.
            Rechtsgrundlage: Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO
            (Vertragserfüllung). Diese Daten werden ausschließlich zur Berechnung
            deines Notendurchschnitts verwendet und nicht an Dritte weitergegeben.
            Sie werden bei Kontolöschung vollständig gelöscht.
          </p>

          <h3>2.5 WebUntis-Zugangsdaten</h3>
          <p>
            Wenn du deine WebUntis-Zugangsdaten (Benutzername und Passwort)
            in SchulHub hinterlegst, speichern wir diese verschlüsselt
            (AES-256) in unserer Datenbank. Die Zugangsdaten werden
            ausschließlich dazu verwendet, deinen persönlichen Stundenplan
            von den WebUntis-Servern deiner Schule abzurufen.
          </p>
          <p>
            Deine Zugangsdaten werden zu keinem anderen Zweck genutzt,
            nicht weitergegeben und nicht mit anderen Nutzern geteilt. Du
            kannst die gespeicherten Zugangsdaten jederzeit in den
            Einstellungen löschen.
          </p>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO
            (deine ausdrückliche Einwilligung, die du beim Speichern der
            Zugangsdaten erteilst).
          </p>
          <p>
            <strong>Widerruf:</strong> Du kannst diese Einwilligung
            jederzeit durch Löschen der Zugangsdaten in den Einstellungen
            widerrufen. Der Widerruf berührt nicht die Rechtmäßigkeit der
            bis dahin erfolgten Verarbeitung.
          </p>

          <h3>2.6 Server-Logdaten</h3>
          <p>
            Bei jedem Aufruf unserer Plattform werden automatisch
            technische Daten durch unseren Server erfasst:
          </p>
          <ul>
            <li>IP-Adresse (anonymisiert nach Verarbeitung)</li>
            <li>Datum und Uhrzeit des Zugriffs</li>
            <li>Aufgerufene URL</li>
            <li>HTTP-Statuscode</li>
          </ul>
          <p>
            Diese Daten dienen ausschließlich der Sicherstellung des
            Betriebs und der Sicherheit der Plattform.
          </p>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO
            (berechtigtes Interesse an der IT-Sicherheit).
          </p>
          <p>
            <strong>Speicherdauer:</strong> 7 Tage, danach automatische Löschung.
          </p>

          <h3>2.7 E-Mail-Benachrichtigungen (optional)</h3>
          <p>
            Bei der Registrierung hast du die Möglichkeit, dich freiwillig
            für gelegentliche E-Mail-Benachrichtigungen von SchulHub
            anzumelden. Wir speichern dazu eine entsprechende Präferenz
            (Ja/Nein) in deinem Nutzerkonto.
          </p>
          <p>
            Diese Benachrichtigungen können Informationen über neue
            Funktionen oder wichtige Plattformhinweise enthalten. Sie
            werden nicht für Werbung genutzt und nicht an Dritte
            weitergegeben.
          </p>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO
            (freiwillige Einwilligung bei der Registrierung).
          </p>
          <p>
            <strong>Widerruf:</strong> Du kannst diese Einwilligung
            jederzeit widerrufen, indem du uns eine E-Mail an{' '}
            <a href="mailto:kontakt@schulhub.eu">kontakt@schulhub.eu</a>{' '}
            sendest. Der Widerruf berührt nicht die Rechtmäßigkeit der
            bis dahin erfolgten Verarbeitung.
          </p>
          <p>
            <strong>Hinweis:</strong> Diese Funktion ist derzeit noch nicht
            aktiv. Die Einwilligung wird gespeichert, aber noch kein
            Versand vorgenommen. Sobald der Versand startet, werden wir
            dich vorab per E-Mail informieren.
          </p>
        </section>

        {/* 3 */}
        <section className="legal-section">
          <h2>3. Auftragsverarbeiter</h2>
          <p>
            Wir setzen folgende Dienstleister ein, die in unserem Auftrag
            personenbezogene Daten verarbeiten. Mit allen Auftragsverarbeitern
            bestehen Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO.
          </p>

          <h3>Hetzner Online GmbH</h3>
          <p>
            Industriestraße 25, 91710 Gunzenhausen, Deutschland<br />
            Zweck: Hosting der Plattform und Datenbank (Serverstandort: Deutschland)<br />
            Datenschutz: <a href="https://www.hetzner.com/de/legal/privacy-policy" target="_blank" rel="noopener noreferrer">hetzner.com/de/legal/privacy-policy</a>
          </p>

          <h3>Resend Inc.</h3>
          <p>
            2261 Market Street #5039, San Francisco, CA 94114, USA<br />
            Zweck: Versand von Transaktions-E-Mails (Verifikation, Passwort-Reset)<br />
            Resend verarbeitet dabei ausschließlich deine E-Mail-Adresse für
            den Versand dieser Nachrichten. Die Übertragung in die USA erfolgt
            auf Grundlage von Standardvertragsklauseln gemäß Art. 46 DSGVO.<br />
            Datenschutz: <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer">resend.com/privacy</a>
          </p>
        </section>

        {/* 4 */}
        <section className="legal-section">
          <h2>4. Datenweitergabe an Dritte</h2>
          <p>
            Wir geben deine personenbezogenen Daten nicht an Dritte weiter,
            es sei denn:
          </p>
          <ul>
            <li>du hast ausdrücklich eingewilligt,</li>
            <li>die Weitergabe ist zur Vertragserfüllung erforderlich,</li>
            <li>es besteht eine gesetzliche Verpflichtung.</li>
          </ul>
          <p>
            SchulHub enthält keine Werbung. Deine Daten werden nicht zu
            Werbezwecken genutzt und nicht an Werbenetzwerke übermittelt.
          </p>
        </section>

        {/* 5 */}
        <section className="legal-section">
          <h2>5. Cookies und lokale Speicherung</h2>
          <p>
            SchulHub verwendet keine Tracking-Cookies und keine
            Analyse-Dienste. Zur Aufrechterhaltung deiner Anmeldung wird
            ein Authentifizierungstoken (JWT) als HttpOnly-Cookie gesetzt.
            Dieses Cookie ist für JavaScript nicht lesbar und verlässt
            deinen Browser ausschließlich zur Kommunikation mit dem
            SchulHub-Server.
          </p>
          <p>
            Außerdem speichern wir deine Theme-Präferenz (Hell/Dunkel/System)
            lokal in deinem Browser. Diese Daten verlassen dein Gerät nicht.
          </p>
        </section>

        {/* 6 */}
        <section className="legal-section">
          <h2>6. Minderjährige</h2>
          <p>
            SchulHub richtet sich an Schülerinnen und Schüler weiterführender
            Schulen sowie Berufsschulen. Wir setzen voraus, dass Nutzer
            mindestens 16 Jahre alt sind oder die ausdrückliche Einwilligung
            ihrer Erziehungsberechtigten besitzen (Art. 8 DSGVO).
          </p>
          <p>
            Falls wir Kenntnis davon erlangen, dass eine Person unter 16
            Jahren ohne elterliche Einwilligung Daten übermittelt hat,
            werden wir diese Daten unverzüglich löschen.
          </p>
        </section>

        {/* 7 */}
        <section className="legal-section">
          <h2>7. Deine Rechte</h2>
          <p>Dir stehen folgende Rechte zu:</p>
          <ul>
            <li>
              <strong>Auskunft (Art. 15 DSGVO):</strong> Du kannst jederzeit
              eine Auskunft über die zu deiner Person gespeicherten Daten verlangen.
            </li>
            <li>
              <strong>Berichtigung (Art. 16 DSGVO):</strong> Du hast das Recht,
              unrichtige oder unvollständige Daten berichtigen zu lassen.
            </li>
            <li>
              <strong>Löschung (Art. 17 DSGVO):</strong> Du kannst die Löschung
              deiner personenbezogenen Daten verlangen. Die Kontolöschung ist
              über die Einstellungen möglich. Alternativ kannst du uns per E-Mail
              kontaktieren.
            </li>
            <li>
              <strong>Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Du
              kannst die Einschränkung der Verarbeitung deiner Daten verlangen.
            </li>
            <li>
              <strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Du hast das
              Recht, deine bereitgestellten Daten in einem strukturierten,
              maschinenlesbaren Format zu erhalten.
            </li>
            <li>
              <strong>Widerspruch (Art. 21 DSGVO):</strong> Du kannst der
              Verarbeitung deiner Daten auf Grundlage berechtigter Interessen
              widersprechen.
            </li>
            <li>
              <strong>Widerruf von Einwilligungen:</strong> Einwilligungen
              (z.&nbsp;B. zur Speicherung der WebUntis-Zugangsdaten oder zum
              Erhalt von E-Mail-Benachrichtigungen) können jederzeit widerrufen
              werden.
            </li>
          </ul>
          <p>
            Zur Ausübung dieser Rechte wende dich bitte an:{' '}
            <a href="mailto:kontakt@schulhub.eu">kontakt@schulhub.eu</a>
          </p>
        </section>

        {/* 8 */}
        <section className="legal-section">
          <h2>8. Beschwerderecht bei der Aufsichtsbehörde</h2>
          <p>
            Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde
            zu beschweren. Die für uns zuständige Aufsichtsbehörde ist:
          </p>
          <p>
            Die Landesbeauftragte für den Datenschutz Niedersachsen (LfD)<br />
            Prinzenstraße 5<br />
            30159 Hannover<br />
            <a href="https://lfd.niedersachsen.de" target="_blank" rel="noopener noreferrer">
              lfd.niedersachsen.de
            </a>
          </p>
        </section>

        {/* 9 */}
        <section className="legal-section">
          <h2>9. Datensicherheit</h2>
          <p>
            SchulHub nutzt eine verschlüsselte HTTPS-Verbindung
            (TLS). Passwörter werden ausschließlich als bcrypt-Hash
            gespeichert. WebUntis-Zugangsdaten werden mit AES-256
            verschlüsselt. Das Authentifizierungstoken wird als HttpOnly-Cookie
            übertragen und ist für clientseitiges JavaScript nicht zugänglich.
            Der Server befindet sich in einem deutschen Rechenzentrum
            (Hetzner, Deutschland).
          </p>
        </section>

        {/* 10 */}
        <section className="legal-section">
          <h2>10. Automatisierte Entscheidungsfindung</h2>
          <p>
            SchulHub trifft keine automatisierten Entscheidungen im Sinne
            des Art. 22 DSGVO, die rechtliche oder ähnlich erhebliche
            Auswirkungen auf dich hätten.
          </p>
        </section>

        {/* 11 */}
        <section className="legal-section">
          <h2>11. Änderungen dieser Datenschutzerklärung</h2>
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf
            anzupassen, um sie aktuell und rechtskonform zu halten. Die
            jeweils aktuelle Version ist jederzeit unter{' '}
            <a href="https://schulhub.eu/datenschutz">schulhub.eu/datenschutz</a>{' '}
            abrufbar. Wesentliche Änderungen teilen wir dir per E-Mail mit.
          </p>
        </section>

        <footer className="legal-footer">
          <Link to="/impressum">Impressum</Link>
          <Link to="/nutzungsbedingungen">Nutzungsbedingungen</Link>
        </footer>
      </div>
    </div>
  )
}
