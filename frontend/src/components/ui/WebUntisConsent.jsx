/**
 * WebUntisConsent.jsx
 *
 * Drop this checkbox into the WebUntis credentials form BEFORE the save button.
 * Pass `checked` and `onChange` as props.
 *
 * Usage in Dashboard (WebUntis form):
 *
 *   const [untisEinwilligung, setUntisEinwilligung] = useState(false)
 *
 *   <WebUntisConsent
 *     checked={untisEinwilligung}
 *     onChange={(e) => setUntisEinwilligung(e.target.checked)}
 *   />
 *
 *   // Disable save button if !untisEinwilligung
 */

import { Link } from 'react-router-dom'

export default function WebUntisConsent({ checked, onChange }) {
  return (
    <div className="form-group form-checkbox-group webuntis-consent">
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
        />
        <span>
          Ich stimme zu, dass SchulHub meine WebUntis-Zugangsdaten
          verschlüsselt speichert, um meinen Stundenplan automatisch
          abzurufen. Ich kann diese Einwilligung jederzeit in den
          Einstellungen widerrufen.{' '}
          <Link to="/datenschutz" target="_blank" rel="noopener noreferrer">
            Mehr erfahren
          </Link>
        </span>
      </label>
    </div>
  )
}
