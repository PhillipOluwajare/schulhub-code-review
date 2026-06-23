import { Link } from 'react-router-dom'

export default function Impressum() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <nav className="legal-nav">
          <Link to="/" className="legal-back">← Zurück</Link>
        </nav>

        <header className="legal-header">
          <p className="legal-label">Angaben gemäß § 5 DDG</p>
          <h1 className="legal-title">Impressum</h1>
        </header>

        {/* Verantwortlicher */}
        <section className="legal-section">
          <h2>Verantwortlicher Diensteanbieter</h2>
          {/* FIX #8: Removed square brackets from address — was "[Eschstraße 11]" */}
          <p>
            Oluwajare Phillip Alabi<br />
            Eschstraße 11<br />
            49377 Vechta<br />
            Deutschland
          </p>
        </section>

        {/* Kontakt */}
        <section className="legal-section">
          <h2>Kontakt</h2>
          <p>
            E-Mail: <a href="mailto:kontakt@schulhub.eu">kontakt@schulhub.eu</a>
          </p>
          <p className="legal-note">
            Bitte beachte: SchulHub ist ein privates Schülerprojekt und kein
            kommerzielles Angebot. Anfragen werden schnellstmöglich beantwortet.
          </p>
        </section>

        {/* Hinweis zur Plattform */}
        {/* FIX #27: Now names all 4 active schools + Untis GmbH, not just KST */}
        <section className="legal-section">
          <h2>Hinweis zur Plattform</h2>
          <p>
            SchulHub ist ein unabhängiges Schülerprojekt und steht in keiner
            offiziellen Verbindung zum Kolleg St.&nbsp;Thomas Vechta,
            zum Gymnasium Antonianum Vechta, zur Adolf-Kolping-Schule Lohne,
            zur Justus-von-Liebig-Schule Vechta, zur Untis GmbH oder anderen
            genannten Institutionen.
          </p>
        </section>

        {/* Haftung für Inhalte */}
        <section className="legal-section">
          <h2>Haftung für Inhalte</h2>
          <p>
            Die Inhalte dieser Plattform wurden mit größtmöglicher Sorgfalt
            erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der
            bereitgestellten Inhalte übernehme ich als Betreiber keine Gewähr.
            Als privater Diensteanbieter bin ich gemäß § 7 Abs. 1 DDG für
            eigene Inhalte auf dieser Plattform nach den allgemeinen Gesetzen
            verantwortlich.
          </p>
          <p>
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
            Informationen nach den allgemeinen Gesetzen bleiben hiervon
            unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
            Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
            Bei Bekanntwerden von entsprechenden Rechtsverletzungen werde ich
            diese Inhalte umgehend entfernen.
          </p>
        </section>

        {/* Haftung für Links */}
        <section className="legal-section">
          <h2>Haftung für Links</h2>
          <p>
            Mein Angebot enthält Links zu externen Websites Dritter, auf deren
            Inhalte ich keinen Einfluss habe. Deshalb übernehme ich für diese
            fremden Inhalte auch keine Gewähr. Für die Inhalte der verlinkten
            Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten
            verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
            Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
            Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
          </p>
          <p>
            Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist
            jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht
            zumutbar. Bei Bekanntwerden von Rechtsverletzungen werde ich
            derartige Links umgehend entfernen.
          </p>
        </section>

        <footer className="legal-footer">
          <Link to="/datenschutz">Datenschutzerklärung</Link>
          <Link to="/nutzungsbedingungen">Nutzungsbedingungen</Link>
        </footer>
      </div>
    </div>
  )
}
