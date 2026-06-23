import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__disclaimer">
          SchulHub ist ein unabhängiges Schülerprojekt und steht in keiner
          offiziellen Verbindung zum Kolleg St.&nbsp;Thomas Vechta oder zur Untis GmbH.
        </p>
        <nav className="site-footer__links">
          <Link to="/impressum">Impressum</Link>
          <span aria-hidden="true">·</span>
          <Link to="/datenschutz">Datenschutz</Link>
          <span aria-hidden="true">·</span>
          <Link to="/nutzungsbedingungen">Nutzungsbedingungen</Link>
          <span aria-hidden="true">·</span>
          <a href="mailto:kontakt@schulhub.eu">Kontakt</a>
        </nav>
        <p className="site-footer__copy">© {year}  Oluwajare  Phillip Alabi</p>
      </div>
    </footer>
  )
}
