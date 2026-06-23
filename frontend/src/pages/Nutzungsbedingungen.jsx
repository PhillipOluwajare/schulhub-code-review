import { Link } from 'react-router-dom'

export default function Nutzungsbedingungen() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <nav className="legal-nav">
          <Link to="/" className="legal-back">← Zurück</Link>
        </nav>

        <header className="legal-header">
          <p className="legal-label">Zuletzt aktualisiert: Juni 2026</p>
          <h1 className="legal-title">Nutzungsbedingungen</h1>
          <p className="legal-date">Stand: Juni 2026</p>
        </header>

        {/* 1 */}
        <section className="legal-section">
          <h2>1. Geltungsbereich</h2>
          <p>
            Diese Nutzungsbedingungen gelten für die Nutzung der Plattform SchulHub
            unter <a href="https://schulhub.eu">schulhub.eu</a>, betrieben von
            Oluwajare Phillip Alabi, Eschstraße 11, 49377 Vechta (nachfolgend „Betreiber").
          </p>
          <p>
            SchulHub richtet sich an Schülerinnen und Schüler der folgenden Schulen
            im Raum Vechta:
          </p>
          <ul>
            <li>Kolleg St. Thomas Vechta (KST) — @kst-vechta.de</li>
            <li>Gymnasium Antonianum Vechta (GAV) — @gavec.de</li>
            <li>Adolf-Kolping-Schule Lohne (AKS)</li>
            <li>Justus-von-Liebig-Schule Vechta</li>
          </ul>
          <p>
            Für das Kolleg St. Thomas Vechta und das Gymnasium Antonianum Vechta
            ist die Registrierung mit der jeweiligen schulischen E-Mail-Adresse
            erforderlich. Für die Adolf-Kolping-Schule Lohne und die
            Justus-von-Liebig-Schule Vechta ist die Registrierung mit einer
            privaten E-Mail-Adresse möglich, da diese Schulen keine
            Schüler-E-Mail-Adressen vergeben.
          </p>
          <p>
            Mit der Registrierung und Nutzung von SchulHub erklärst du dich mit
            diesen Nutzungsbedingungen einverstanden.
          </p>
        </section>

        {/* 2 */}
        <section className="legal-section">
          <h2>2. Nutzerkonto</h2>
          <p>
            Für die Nutzung von SchulHub ist eine Registrierung erforderlich. Du
            musst mindestens 16 Jahre alt sein oder die ausdrückliche Einwilligung
            deiner Erziehungsberechtigten besitzen.
          </p>
          <p>
            Du bist verpflichtet, bei der Registrierung wahrheitsgemäße Angaben
            zu machen und deine Zugangsdaten vertraulich zu behandeln. Du bist
            für alle Aktivitäten verantwortlich, die über dein Konto erfolgen.
          </p>
          <p>
            Bei Verdacht auf unbefugten Zugriff auf dein Konto bist du verpflichtet,
            den Betreiber unverzüglich unter{' '}
            <a href="mailto:kontakt@schulhub.eu">kontakt@schulhub.eu</a> zu informieren.
          </p>
        </section>

        {/* 3 */}
        <section className="legal-section">
          <h2>3. Erlaubte Nutzung</h2>
          <p>SchulHub darf ausschließlich für folgende Zwecke genutzt werden:</p>
          <ul>
            <li>Verwaltung und Organisation von Hausaufgaben und Lernmaterial</li>
            <li>Abruf des persönlichen Stundenplans über die WebUntis-Schnittstelle</li>
            <li>Austausch schulbezogener Inhalte mit Mitschülerinnen und Mitschülern</li>
            <li>Nutzung sonstiger Funktionen, die SchulHub im Rahmen des Dienstes anbietet</li>
          </ul>
        </section>

        {/* 4 */}
        <section className="legal-section">
          <h2>4. Verbotene Nutzung</h2>
          <p>Folgende Handlungen sind ausdrücklich untersagt:</p>
          <ul>
            <li>Weitergabe von Zugangsdaten an Dritte</li>
            <li>Automatisiertes Auslesen von Daten (Scraping)</li>
            <li>Verbreitung rechtswidriger, beleidigender oder diskriminierender Inhalte</li>
            <li>Versuche, die Plattform zu manipulieren, zu hacken oder den Betrieb zu stören</li>
            <li>Nutzung fremder WebUntis-Zugangsdaten</li>
            <li>Jede kommerzielle Nutzung der Plattform oder ihrer Inhalte</li>
          </ul>
          <p>
            Bei Verstößen behält sich der Betreiber das Recht vor, das Konto
            unverzüglich zu sperren oder zu löschen.
          </p>
        </section>

        {/* 5 */}
        <section className="legal-section">
          <h2>5. Inhalte der Nutzer</h2>
          <p>
            Für Inhalte, die du auf SchulHub einstellst (z.&nbsp;B. Hausaufgaben,
            Notizen), bist du selbst verantwortlich. Du versicherst, dass diese
            Inhalte keine Rechte Dritter verletzen und nicht gegen geltendes
            Recht verstoßen.
          </p>
          <p>
            Der Betreiber übernimmt keine Haftung für nutzergenerierte Inhalte.
          </p>
        </section>

        {/* 6 */}
        <section className="legal-section">
          <h2>6. Verfügbarkeit</h2>
          <p>
            SchulHub ist ein privates Schülerprojekt. Der Betreiber übernimmt
            keine Garantie für die ständige Verfügbarkeit der Plattform. Wartungen,
            Unterbrechungen oder technische Störungen können jederzeit auftreten.
          </p>
          <p>
            Ein Anspruch auf ununterbrochene Nutzbarkeit besteht nicht.
          </p>
        </section>

        {/* 7 */}
        <section className="legal-section">
          <h2>7. Haftungsausschluss</h2>
          <p>
            Der Betreiber haftet nicht für Schäden, die durch die Nutzung oder
            Nichtnutzbarkeit von SchulHub entstehen, sofern diese nicht auf
            vorsätzlichem oder grob fahrlässigem Handeln des Betreibers beruhen.
          </p>
          <p>
            Für die Richtigkeit der über die WebUntis-Schnittstelle abgerufenen
            Stundenplaninformationen übernimmt der Betreiber keine Gewähr. Maßgeblich
            sind stets die offiziellen Informationen der jeweiligen Schule.
          </p>
        </section>

        {/* 8 */}
        <section className="legal-section">
          <h2>8. Änderungen der Nutzungsbedingungen</h2>
          <p>
            Der Betreiber behält sich vor, diese Nutzungsbedingungen jederzeit
            anzupassen. Wesentliche Änderungen werden registrierten Nutzern per
            E-Mail mitgeteilt. Die jeweils aktuelle Version ist unter{' '}
            <a href="https://schulhub.eu/nutzungsbedingungen">
              schulhub.eu/nutzungsbedingungen
            </a>{' '}
            abrufbar.
          </p>
          <p>
            Die weitere Nutzung von SchulHub nach Inkrafttreten geänderter
            Nutzungsbedingungen gilt als Zustimmung zu den Änderungen.
          </p>
        </section>

        {/* 9 */}
        <section className="legal-section">
          <h2>9. Kündigung und Kontolöschung</h2>
          <p>
            Du kannst dein Konto jederzeit in den Einstellungen löschen. Alle
            damit verbundenen Daten werden unwiderruflich entfernt.
          </p>
          <p>
            Der Betreiber behält sich das Recht vor, Konten bei Verstößen gegen
            diese Nutzungsbedingungen ohne Vorankündigung zu sperren oder zu löschen.
          </p>
        </section>

        {/* 10 */}
        <section className="legal-section">
          <h2>10. Anwendbares Recht</h2>
          <p>
            Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist,
            soweit gesetzlich zulässig, Vechta, Niedersachsen.
          </p>
        </section>

        {/* 11 */}
        <section className="legal-section">
          <h2>11. Kontakt</h2>
          <p>
            Bei Fragen zu diesen Nutzungsbedingungen wende dich an:{' '}
            <a href="mailto:kontakt@schulhub.eu">kontakt@schulhub.eu</a>
          </p>
        </section>

        <footer className="legal-footer">
          <Link to="/impressum">Impressum</Link>
          <Link to="/datenschutz">Datenschutz</Link>
        </footer>
      </div>
    </div>
  )
}
