import { useState, useEffect, useRef } from "react";
import confetti from 'canvas-confetti';
import api from "../api/axios";
import NavStrip from "../components/ui/NavStrip";
import LoadingButton from "../components/ui/LoadingButton";




/* ============================================================
   Helpers — Sek I (1–6) — unchanged from Phase 3a
   ============================================================ */
function notenFarbe(avg) {
  if (avg <= 2.4) return "#4ade80";
  if (avg <= 3.4) return "#fbbf24";
  if (avg <= 4.4) return "#f97316";
  return "#ef4444";
}

function formatDatum(isoDate) {
  if (!isoDate) return "";
  const dateStr = isoDate.split("T")[0];
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

function datumFuerInput(isoDate) {
  if (!isoDate) return "";
  return isoDate.split("T")[0];
}

function berechneSchnitt(noten) {
  if (!noten.length) return null;
  return noten.reduce((s, n) => s + n.wert, 0) / noten.length;
}

function gruppiereNachFach(liste) {
  return liste.reduce((acc, n) => {
    if (!acc[n.fach]) acc[n.fach] = [];
    acc[n.fach].push(n);
    return acc;
  }, {});
}

const TYP_MAP = {
  klassenarbeit: { label: "KA",     oberstufeLabel: "Klausur",        bg: "#3b82f620", color: "#3b82f6" },
  muendlich:     { label: "Mündl.", oberstufeLabel: "Sonst. Mitarb.", bg: "#8b5cf620", color: "#8b5cf6" },
  sonstige:      { label: "Sonst.", oberstufeLabel: "Sonst.",         bg: "transparent", color: "var(--muted)", border: "1px solid var(--border)" },
};

const HEUTE = new Date().toISOString().split("T")[0];

/* ============================================================
   Helpers — Oberstufe (0–15 Punkte, Kursart, Schuljahr)
   ============================================================ */

// Standard NDS Punkte→Note banding (Sekundarstufe II)
function punkteZuNoteInt(punkte) {
  if (punkte >= 13) return 1;
  if (punkte >= 10) return 2;
  if (punkte >= 7) return 3;
  if (punkte >= 5) return 4;
  if (punkte >= 3) return 5;
  return 6;
}

function punkteFarbe(punkte) {
  return notenFarbe(punkteZuNoteInt(punkte));
}

// German Schuljahr runs Aug–Jul. "2025" means Schuljahr 2025/26.
function aktuellesSchuljahr() {
  const heute = new Date();
  const jahr = heute.getFullYear();
  const monat = heute.getMonth() + 1; // 1–12
  return monat >= 8 ? jahr : jahr - 1;
}

// Oct–Jan = H1, Feb–Jul = H2 (Aug/Sep treated as start of H1)
function aktuellesHalbjahr() {
  const monat = new Date().getMonth() + 1;
  return monat >= 2 && monat <= 7 ? 2 : 1;
}

function schuljahrLabel(jahr) {
  if (jahr === null || jahr === undefined) return "";
  return `${jahr}/${String((jahr + 1) % 100).padStart(2, "0")}`;
}

// Weighted Oberstufe average. If one bucket (Klausuren / Sonstige) is
// empty, the other bucket counts 100% — no silent zeroing.
function berechneFachDurchschnittOberstufe(fachNoten, einst) {
  const gewicht = einst?.klausur_gewicht ?? 50;
  const klausuren = fachNoten.filter((n) => n.typ === "klassenarbeit");
  const sonstige = fachNoten.filter((n) => n.typ !== "klassenarbeit");
  const avgK = klausuren.length ? klausuren.reduce((s, n) => s + n.wert, 0) / klausuren.length : null;
  const avgS = sonstige.length ? sonstige.reduce((s, n) => s + n.wert, 0) / sonstige.length : null;
  if (avgK === null && avgS === null) return null;
  if (avgK === null) return avgS;
  if (avgS === null) return avgK;
  return avgK * (gewicht / 100) + avgS * ((100 - gewicht) / 100);
}

// fachListe: [{ fach, kursart, avg }] — avg may be null, filtered out first
function berechneUngewichtet(fachListe) {
  const gueltig = fachListe.filter((f) => f.avg !== null && f.avg !== undefined);
  if (!gueltig.length) return null;
  return gueltig.reduce((s, f) => s + f.avg, 0) / gueltig.length;
}

// eA subjects count double. Subjects with no grades yet are excluded
// from both the numerator and denominator (fixes a null*2=0 skew bug).
function berechneKursgewichtet(fachListe) {
  const gueltig = fachListe.filter((f) => f.avg !== null && f.avg !== undefined);
  if (!gueltig.length) return null;
  let summe = 0, gewichtSumme = 0;
  gueltig.forEach((f) => {
    const g = f.kursart === "eA" ? 2 : 1;
    summe += f.avg * g;
    gewichtSumme += g;
  });
  return summe / gewichtSumme;
}

const DEFAULT_FACH_EINSTELLUNG = { notensystem: "sek1", kursart: "gA", klausur_gewicht: 50 };

/* ============================================================
   Shared style constants
   ============================================================ */
const labelStyle = { display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "6px" };
const pencilBtnStyle = { background: "transparent", border: "none", fontSize: "0.95rem", padding: 0, width: "36px", height: "36px", minWidth: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", lineHeight: 1, borderRadius: "8px" };
const deleteBtnStyle = { background: "transparent", border: "none", color: "var(--muted)", fontSize: "1.2rem", padding: 0, width: "36px", height: "36px", minWidth: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", lineHeight: 1, borderRadius: "8px" };
const loeschBestaetigenBtnStyle = { background: "transparent", border: "1px solid #ef4444", color: "#ef4444", fontSize: "0.78rem", padding: "3px 8px", borderRadius: "4px", cursor: "pointer" };
const addButtonStyle = { width: "100%", background: "transparent", border: "1px dashed var(--accent)", color: "var(--accent)", borderRadius: "var(--radius)", padding: "12px", fontSize: "0.9rem", cursor: "pointer", marginBottom: "24px" };
const formContainerStyle = { border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px", marginBottom: "24px", background: "var(--surface)" };
const fachCardStyle = { border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "14px 16px", marginBottom: "12px", background: "var(--surface)" };
const presetBtnStyle = { background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "6px", padding: "5px 9px", fontSize: "0.72rem", cursor: "pointer" };

function segButtonStyle(active) {
  return {
    flex: 1, padding: "7px 6px", fontSize: "0.78rem", fontWeight: 600,
    background: active ? "var(--accent)" : "transparent",
    color: active ? "#fff" : "var(--muted)",
    border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
    borderRadius: "6px", cursor: "pointer",
  };
}

function tabButtonStyle(active) {
  return {
    padding: "8px 14px", borderRadius: "var(--radius)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
    background: active ? "var(--accent)" : "transparent",
    color: active ? "#fff" : "var(--muted)",
    border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
    whiteSpace: "nowrap",
  };
}

/* ============================================================
   Small presentational components
   ============================================================ */

function WertPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            flex: 1, padding: "8px 0",
            background: value === n ? "var(--accent)" : "transparent",
            color: value === n ? "#fff" : "var(--muted)",
            border: value === n ? "1px solid var(--accent)" : "1px solid var(--border)",
            borderRadius: "var(--radius)",
            fontFamily: "var(--mono)", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
          }}
        >{n}</button>
      ))}
    </div>
  );
}

function PunkteRaster({ value, onChange }) {
  const werte = Array.from({ length: 16 }, (_, i) => i); // 0–15
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        {werte.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{
              minHeight: "44px", padding: "10px 0",
              background: value === n ? "var(--accent)" : "transparent",
              color: value === n ? "#fff" : "var(--muted)",
              border: value === n ? "1px solid var(--accent)" : "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontFamily: "var(--mono)", fontWeight: 700, fontSize: "1rem", cursor: "pointer",
            }}
          >{n}</button>
        ))}
      </div>
      <div style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: "8px", textAlign: "center" }}>
        0 = schwächster Wert · 15 = bester Wert
      </div>
    </div>
  );
}

function TypPicker({ value, onChange }) {
  const TYPEN = [
    { value: "klassenarbeit", label: "KA" },
    { value: "muendlich",     label: "Mündlich" },
    { value: "sonstige",      label: "Sonstiges" },
  ];
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {TYPEN.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          style={{
            flex: 1, padding: "8px 4px",
            background: value === t.value ? "var(--accent)" : "transparent",
            color: value === t.value ? "#fff" : "var(--muted)",
            border: value === t.value ? "1px solid var(--accent)" : "1px solid var(--border)",
            borderRadius: "var(--radius)", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer",
          }}
        >{t.label}</button>
      ))}
    </div>
  );
}

function TypPickerOberstufe({ value, onChange }) {
  const TYPEN = [
    { value: "klassenarbeit", label: "Klausur" },
    { value: "muendlich",     label: "Sonstige Mitarbeit" },
  ];
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {TYPEN.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          style={{
            flex: 1, padding: "8px 4px",
            background: value === t.value ? "var(--accent)" : "transparent",
            color: value === t.value ? "#fff" : "var(--muted)",
            border: value === t.value ? "1px solid var(--accent)" : "1px solid var(--border)",
            borderRadius: "var(--radius)", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer",
          }}
        >{t.label}</button>
      ))}
    </div>
  );
}

function WertBadge({ wert }) {
  const farbe = notenFarbe(wert);
  return (
    <span style={{
      minWidth: "28px", textAlign: "center", padding: "2px 6px", borderRadius: "4px",
      background: farbe + "20", color: farbe,
      fontFamily: "var(--mono)", fontWeight: 700, fontSize: "0.9rem",
    }}>{wert}</span>
  );
}

function WertBadgeOberstufe({ wert }) {
  const farbe = punkteFarbe(wert);
  return (
    <span style={{
      minWidth: "28px", textAlign: "center", padding: "2px 6px", borderRadius: "4px",
      background: farbe + "20", color: farbe,
      fontFamily: "var(--mono)", fontWeight: 700, fontSize: "0.9rem",
    }}>{wert}</span>
  );
}

function TypBadge({ typ, oberstufe }) {
  const t = TYP_MAP[typ] || TYP_MAP.sonstige;
  const label = oberstufe ? (t.oberstufeLabel || t.label) : t.label;
  return (
    <span style={{
      background: t.bg, color: t.color, border: t.border || "none",
      borderRadius: "4px", padding: "1px 6px", fontSize: "0.75rem",
      fontFamily: "var(--sans)", whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function KursartBadge({ kursart }) {
  if (kursart === "eA") {
    return (
      <span title="Erweiterungskurs — zählt doppelt im Gesamtschnitt" style={{
        background: "rgba(127,119,221,0.18)", color: "var(--accent)", border: "1px solid var(--accent)",
        borderRadius: "4px", padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700, fontFamily: "var(--mono)", cursor: "help",
      }}>eA</span>
    );
  }
  if (kursart === "ergaenzung") {
    return (
      <span title="Ergänzungsfach" style={{
        background: "transparent", color: "var(--muted)", border: "1px solid var(--border)",
        borderRadius: "4px", padding: "1px 7px", fontSize: "0.7rem", fontFamily: "var(--sans)", cursor: "help",
      }}>Erg.</span>
    );
  }
  return null; // gA = the default, no visual noise
}

// First-time setup — replaces the whole page until noten_einstellungen.setup_done is true.
function EinrichtungsAssistent({ schritt, onKlasseWahl, onSchuljahrWahl, vorgeschlagenesJahr, jahrOptionen }) {
  if (schritt === 1) {
    const OPTIONEN = [
      { id: "u1", label: "5–9",        modus: "sek1" },
      { id: "u2", label: "10",         modus: "sek1" },
      { id: "u3", label: "11 · EF",    modus: "sek1" },
      { id: "u4", label: "12 · Q1+Q2", modus: "oberstufe", klasse: 12 },
      { id: "u5", label: "13 · Q3+Q4", modus: "oberstufe", klasse: 13 },
    ];
    return (
      <div style={{ maxWidth: "440px", margin: "48px auto", padding: "0 4px", textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: "1.15rem", marginBottom: "8px" }}>
          Welche Klasse bist du gerade?
        </div>
        <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "26px", lineHeight: 1.5 }}>
          Das entscheidet, wie deine Noten-Seite aussieht. Du kannst das später jederzeit ändern.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {OPTIONEN.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onKlasseWahl(o)}
              style={{
                padding: "16px 8px", border: "1px solid var(--border)", borderRadius: "var(--radius)",
                background: "var(--surface)", color: "var(--text)", fontWeight: 600, cursor: "pointer",
              }}
            >{o.label}</button>
          ))}
        </div>
      </div>
    );
  }

  // schritt === 2 — only reached for Oberstufe (12 or 13)
  return (
    <div style={{ maxWidth: "440px", margin: "48px auto", padding: "0 4px", textAlign: "center" }}>
      <div style={{ fontWeight: 700, fontSize: "1.15rem", marginBottom: "8px" }}>
        In welchem Schuljahr hast du mit Q1 begonnen?
      </div>
      <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "26px", lineHeight: 1.5 }}>
        Damit trennen wir deine Noten richtig nach Q1+Q2 und Q3+Q4.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {jahrOptionen.map((j) => (
          <button
            key={j}
            type="button"
            onClick={() => onSchuljahrWahl(j)}
            style={{
              padding: "14px",
              border: j === vorgeschlagenesJahr ? "1px solid var(--accent)" : "1px solid var(--border)",
              borderRadius: "var(--radius)",
              background: j === vorgeschlagenesJahr ? "rgba(127,119,221,0.08)" : "var(--surface)",
              color: "var(--text)", fontWeight: 600, cursor: "pointer",
            }}
          >
            {schuljahrLabel(j)}{j === vorgeschlagenesJahr ? " · Vorschlag" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

// Inline per-subject settings strip, opened via the gear icon on an Oberstufe card.
// NOTE: this strip is only ever rendered for a subject that already has at least
// one Oberstufe-tagged grade (see renderOberstufeFach). There is deliberately no
// "switch this subject's Notensystem" control here — flipping it would leave
// existing grades tagged with the old system while new grades get the new one,
// splitting one subject into two separate cards (Oberstufe + Sek I) with no
// migration path. Kursart and Klausurgewichtung are safe to change after the
// fact, so those stay editable.
function FachEinstellungenStrip({ fach, einst, onSpeichern, onAbbrechen }) {
  const [kursart, setKursart] = useState(einst.kursart);
  const [gewicht, setGewicht] = useState(einst.klausur_gewicht);

  return (
    <div style={{
      background: "rgba(127,119,221,0.05)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "14px", marginTop: "10px",
    }}>
      <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "10px", fontWeight: 600 }}>
        Einstellungen — {fach}
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "6px" }}>Kursart</div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button type="button" onClick={() => setKursart("gA")} title="Grundkurs" style={segButtonStyle(kursart === "gA")}>gA</button>
          <button type="button" onClick={() => setKursart("eA")} title="Erweiterungskurs (früher: Leistungskurs)" style={segButtonStyle(kursart === "eA")}>eA</button>
          <button type="button" onClick={() => setKursart("ergaenzung")} title="Ergänzungsfach" style={segButtonStyle(kursart === "ergaenzung")}>Ergänzung</button>
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "6px", lineHeight: 1.4 }}>
          gA = Grundkurs · eA = Erweiterungskurs (früher „Leistungskurs") — zählt doppelt im Gesamtschnitt
        </div>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "6px" }}>
          Gewichtung — Klausuren {gewicht}% · Sonstige Mitarbeit {100 - gewicht}%
        </div>
        <input
          type="range" min={0} max={100} step={5} value={gewicht}
          onChange={(e) => setGewicht(parseInt(e.target.value))}
          style={{ width: "100%" }}
        />
        <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
          <button type="button" onClick={() => setGewicht(50)} style={presetBtnStyle}>NDS Standard 50/50</button>
          <button type="button" onClick={() => setGewicht(0)} style={presetBtnStyle}>Nur mündlich</button>
          <button type="button" onClick={() => setGewicht(100)} style={presetBtnStyle}>Nur Klausuren</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => onSpeichern({ notensystem: einst.notensystem, kursart, klausur_gewicht: gewicht })}
          style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius)", padding: "9px", fontWeight: 600, cursor: "pointer" }}
        >Speichern</button>
        <button
          type="button"
          onClick={onAbbrechen}
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "var(--radius)", padding: "9px 14px", cursor: "pointer" }}
        >Abbrechen</button>
      </div>
    </div>
  );
}

// Top-level settings strip — lets a student fix a setup mistake
// (wrong Klasse/Modus or wrong Schuljahr-Beginn) after the initial
// EinrichtungsAssistent has already run. Switching INTO Oberstufe is
// always safe (existing Sek I grades fall into the "außerhalb der
// Q-Phase" section by design). Switching BACK to Sek I is only safe
// while there are zero Oberstufe-tagged grades — once any exist,
// flipping the top-level modus would make them invisible (no
// equivalent fallback section exists in the Sek I render branch), so
// that direction is disabled with an explanation instead of silently
// hiding data.
function NotenEinstellungenStrip({ einstellungen, hatOberstufeNoten, onSpeichern, onAbbrechen }) {
  const [modus, setModus] = useState(einstellungen.noten_modus);
  const [schuljahrBeginn, setSchuljahrBeginn] = useState(einstellungen.schuljahr_beginn ?? aktuellesSchuljahr());
  const jahrOptionen = [aktuellesSchuljahr() - 2, aktuellesSchuljahr() - 1, aktuellesSchuljahr()];

  const sperrtWechselZurueck = einstellungen.noten_modus === "oberstufe" && modus === "sek1" && hatOberstufeNoten;
  const kannSpeichern = !sperrtWechselZurueck && (modus !== "oberstufe" || schuljahrBeginn !== null);

  return (
    <div style={{
      background: "rgba(127,119,221,0.05)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "16px", marginBottom: "20px",
    }}>
      <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "10px", fontWeight: 600 }}>
        Noten-Einstellungen
      </div>

      <div style={{ fontSize: "0.85rem", color: "var(--text)", marginBottom: "16px", lineHeight: 1.5 }}>
        Du bist aktuell in: <strong>
          {einstellungen.noten_modus === "oberstufe"
            ? `Oberstufe · 0–15 Punkte${einstellungen.schuljahr_beginn !== null ? ` · Schuljahr ${schuljahrLabel(einstellungen.schuljahr_beginn)}` : ""}`
            : "Schulnoten · 1–6"}
        </strong>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "6px" }}>Klasse / Modus</div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button type="button" onClick={() => setModus("sek1")} style={segButtonStyle(modus === "sek1")}>Schulnoten · 1–6</button>
          <button type="button" onClick={() => setModus("oberstufe")} style={segButtonStyle(modus === "oberstufe")}>Oberstufe · 0–15</button>
        </div>
      </div>

      {modus === "oberstufe" && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "6px" }}>In welchem Schuljahr hast du mit Q1 begonnen?</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {jahrOptionen.map((j) => (
              <button key={j} type="button" onClick={() => setSchuljahrBeginn(j)} style={segButtonStyle(schuljahrBeginn === j)}>
                {schuljahrLabel(j)}
              </button>
            ))}
          </div>
        </div>
      )}

      {sperrtWechselZurueck && (
        <div style={{ color: "#f97316", fontSize: "0.78rem", marginBottom: "12px", lineHeight: 1.5 }}>
          Du hast bereits Oberstufen-Noten eingetragen. Ein Wechsel zurück zu Schulnoten würde diese
          ausblenden — sie werden nicht gelöscht, aber so lange nicht mehr angezeigt, bis du
          wieder auf Oberstufe wechselst.
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          disabled={!kannSpeichern}
          onClick={() => onSpeichern({
            noten_modus: modus,
            schuljahr_beginn: modus === "oberstufe" ? schuljahrBeginn : null,
            setup_done: true,
          })}
          style={{
            flex: 1, background: kannSpeichern ? "var(--accent)" : "var(--border)",
            color: kannSpeichern ? "#fff" : "var(--muted)", border: "none",
            borderRadius: "var(--radius)", padding: "9px", fontWeight: 600,
            cursor: kannSpeichern ? "pointer" : "not-allowed",
          }}
        >Speichern</button>
        <button
          type="button"
          onClick={onAbbrechen}
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "var(--radius)", padding: "9px 14px", cursor: "pointer" }}
        >Abbrechen</button>
      </div>
    </div>
  );
}

/* ============================================================
   Main component
   ============================================================ */

export default function Noten() {
  const [noten, setNoten]             = useState([]);
  const [schule, setSchule]           = useState("");
  const [laden, setLaden]             = useState(true);
  const [ladeError, setLadeError]     = useState(false);
  const [formOffen, setFormOffen]     = useState(false);
  const [editiereId, setEditiereId]   = useState(null);
  const [speicherStatus, setSpeicherStatus] = useState("idle");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const [showLaunch, setShowLaunch] = useState(
    () => !localStorage.getItem('noten_launched')
  )
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    if (!showLaunch) return
    if (countdown === 0) {
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } })
      localStorage.setItem('noten_launched', '1')
      setTimeout(() => setShowLaunch(false), 1500)
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, showLaunch])

  const [einstellungen, setEinstellungen] = useState(null); // null = not loaded yet
  const [fachEinstellungen, setFachEinstellungen] = useState([]);
  const [setupSchritt, setSetupSchritt] = useState(1);
  const [setupKlasse, setSetupKlasse] = useState(null);

  const [aktiverTab, setAktiverTab] = useState("jahr1"); // jahr1 | jahr2 | gesamt
  const [zweitesJahrManuell, setZweitesJahrManuell] = useState(false);
  const [offenesGearFach, setOffenesGearFach] = useState(null);
  const [einstellungenOffen, setEinstellungenOffen] = useState(false);
  const [sek1Tab, setSek1Tab] = useState("alle");

  const [fach, setFach]   = useState("");
  const [wert, setWert]   = useState(null);
  const [typ, setTyp]     = useState("sonstige");
  const [datum, setDatum] = useState(HEUTE);
  const [notiz, setNotiz] = useState("");
  const [formSchuljahr, setFormSchuljahr] = useState(null);
  const [formHalbjahr, setFormHalbjahr]   = useState(aktuellesHalbjahr());

  const formRef = useRef(null);

  useEffect(() => { ladeAlles(); }, []);

  async function ladeAlles() {
    setLaden(true);
    setLadeError(false);
    try {
      const [notenRes, profilRes, einstRes, fachEinstRes] = await Promise.all([
        api.get("/noten"),
        api.get("/profil"),
        api.get("/noten/einstellungen"),
        api.get("/noten/fach-einstellungen"),
      ]);
      setNoten(notenRes.data);
      setSchule(profilRes.data.schule || "");
      setFachEinstellungen(fachEinstRes.data || []);

      const schuleWert = profilRes.data.schule || "";
      const istBS = schuleWert === "AKS" || schuleWert === "Justus";

      if (istBS && !einstRes.data.setup_done) {
        // Berufsschule students already know their school's grading
        // system — never make them tap through the setup flow.
        const stilleEinst = { noten_modus: "sek1", schuljahr_beginn: null, setup_done: true };
        setEinstellungen(stilleEinst);
        api.put("/noten/einstellungen", stilleEinst).catch((e) =>
          console.error("Stille Einstellung (Berufsschule) fehlgeschlagen:", e)
        );
      } else {
        setEinstellungen(einstRes.data);
      }
    } catch (err) {
      console.error("Laden fehlgeschlagen:", err);
      setLadeError(true);
    } finally {
      setLaden(false);
    }
  }

  async function ladeNoten() {
    const res = await api.get("/noten");
    setNoten(res.data);
  }

  // ── Setup flow handlers ──────────────────────────────────────────────
  async function speichereEinstellungenSetup(payload) {
    try {
      const res = await api.put("/noten/einstellungen", payload);
      setEinstellungen(res.data);
    } catch (err) {
      console.error("Einstellungen speichern fehlgeschlagen:", err);
    }
  }

  function setupKlasseWahl(option) {
    if (option.modus === "sek1") {
      speichereEinstellungenSetup({ noten_modus: "sek1", schuljahr_beginn: null, setup_done: true });
    } else {
      setSetupKlasse(option.klasse);
      setSetupSchritt(2);
    }
  }

  function setupSchuljahrWahl(jahr) {
    speichereEinstellungenSetup({ noten_modus: "oberstufe", schuljahr_beginn: jahr, setup_done: true });
  }

  async function einstellungenAktualisieren(payload) {
    try {
      const res = await api.put("/noten/einstellungen", payload);
      setEinstellungen(res.data);
      setEinstellungenOffen(false);
    } catch (err) {
      console.error("Einstellungen aktualisieren fehlgeschlagen:", err);
    }
  }

  // ── Per-subject settings ─────────────────────────────────────────────
  function holeFachEinstellung(fachName) {
    const gefunden = fachEinstellungen.find((f) => f.fach === fachName);
    if (gefunden) return gefunden;
    return { ...DEFAULT_FACH_EINSTELLUNG, notensystem: istOberstufe ? "oberstufe" : "sek1" };
  }

  async function speichereFachEinstellung(fachName, payload) {
    try {
      const res = await api.put(`/noten/fach-einstellungen/${encodeURIComponent(fachName)}`, payload);
      setFachEinstellungen((prev) => [...prev.filter((f) => f.fach !== fachName), res.data]);
      setOffenesGearFach(null);
    } catch (err) {
      console.error("Fach-Einstellung speichern fehlgeschlagen:", err);
    }
  }

  async function sicherstelleFachEinstellung(fachName, gewuenschtesSystem) {
    if (fachEinstellungen.some((f) => f.fach === fachName)) return;
    try {
      const res = await api.put(`/noten/fach-einstellungen/${encodeURIComponent(fachName)}`, {
        notensystem: gewuenschtesSystem, kursart: "gA", klausur_gewicht: 50,
      });
      setFachEinstellungen((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Fach-Einstellung anlegen fehlgeschlagen:", err);
    }
  }

  // ── Derived state ────────────────────────────────────────────────────
  const istOberstufe = einstellungen?.noten_modus === "oberstufe";
  const istBerufsschule = schule === "AKS" || schule === "Justus";
  const schuljahrJahr1 = einstellungen?.schuljahr_beginn ?? null;
  const schuljahrJahr2 = schuljahrJahr1 !== null ? schuljahrJahr1 + 1 : null;

  const oberstufeNoten = noten.filter((n) => n.notensystem === "oberstufe");
  const sek1NotenAlle  = noten.filter((n) => n.notensystem !== "oberstufe");

  const jahr1Noten = oberstufeNoten.filter((n) => n.schuljahr === schuljahrJahr1);
  const jahr2Noten = oberstufeNoten.filter((n) => n.schuljahr === schuljahrJahr2);

  const jahr1NachFach = gruppiereNachFach(jahr1Noten);
  const jahr2NachFach = gruppiereNachFach(jahr2Noten);
  const oberstufeNachFachGesamt = gruppiereNachFach(oberstufeNoten);

  const hatJahr2Noten = jahr2Noten.length > 0;
  const jahr2AutoSichtbar = schuljahrJahr1 !== null && schuljahrJahr1 < aktuellesSchuljahr();
  const tab2Sichtbar = jahr2AutoSichtbar || zweitesJahrManuell || hatJahr2Noten;

  const sek1JahreVorhanden = [...new Set(sek1NotenAlle.map((n) => n.schuljahr).filter((j) => j !== null && j !== undefined))].sort();
  const sek1MultiJahr = sek1JahreVorhanden.length > 1;
  const sek1GefiltertNoten = sek1Tab === "alle" ? sek1NotenAlle : sek1NotenAlle.filter((n) => n.schuljahr === sek1Tab);
  const sek1NachFach = gruppiereNachFach(sek1GefiltertNoten);
  const sek1FachKeys = Object.keys(sek1NachFach).sort();
  const sek1GesamtSchnitt = berechneSchnitt(sek1GefiltertNoten);

  const uniqueFaecher = [...new Set(noten.map((n) => n.fach))];

  // Effective notensystem for the form: locked to the note's own tag
  // while editing (preserves history), otherwise derived live from
  // whatever subject name is currently typed.
  const aktivesFachSystem = fach.trim()
    ? holeFachEinstellung(fach.trim()).notensystem
    : (istOberstufe ? "oberstufe" : "sek1");
  const editLabel = editiereId !== null ? noten.find((n) => n.id === editiereId) : null;
  const formSystem = editiereId !== null ? (editLabel?.notensystem || "sek1") : aktivesFachSystem;

  const formJahrOptionen = tab2Sichtbar
    ? [schuljahrJahr1, schuljahrJahr2].filter((j) => j !== null)
    : [schuljahrJahr1].filter((j) => j !== null);

  const kannSpeichern = fach.trim() && wert !== null && wert !== undefined && datum &&
    (formSystem !== "oberstufe" || (formSchuljahr !== null && formHalbjahr !== null));
  const istLaden = speicherStatus === "loading";

  // Reset wert/typ whenever the active subject's system changes mid-entry
  // (e.g. user types a name matching a subject already flagged Oberstufe).
  // Only while adding a new note — editing locks the system to the note's own tag.
  useEffect(() => {
    if (formOffen && editiereId === null) {
      setWert(null);
      setTyp(formSystem === "oberstufe" ? "klassenarbeit" : "sonstige");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formSystem]);

  // ── Form lifecycle ───────────────────────────────────────────────────
  function feldernZuruecksetzen() {
    setFach("");
    setWert(null);
    setTyp(istOberstufe ? "klassenarbeit" : "sonstige");
    setDatum(HEUTE);
    setNotiz("");
    setEditiereId(null);
    setFormSchuljahr(istOberstufe ? (aktiverTab === "jahr2" ? schuljahrJahr2 : schuljahrJahr1) : null);
    setFormHalbjahr(aktuellesHalbjahr());
  }

  function formSchliessen() {
    feldernZuruecksetzen();
    setFormOffen(false);
  }

  function formOeffnenNeu() {
    feldernZuruecksetzen();
    setFormOffen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function bearbeiteNote(note) {
    setEditiereId(note.id);
    setFach(note.fach);
    setWert(note.wert);
    setTyp(note.typ);
    setDatum(datumFuerInput(note.datum));
    setNotiz(note.notiz || "");
    setFormSchuljahr(note.schuljahr ?? null);
    setFormHalbjahr(note.halbjahr ?? aktuellesHalbjahr());
    setFormOffen(true);
    setPendingDeleteId(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function noteSpeichern() {
    if (!fach.trim() || wert === null || wert === undefined || !datum) return;
    setSpeicherStatus("loading");
    const system = formSystem;
    const payload = {
      fach: fach.trim(),
      wert,
      typ,
      datum,
      notiz: notiz.trim() || null,
      notensystem: system,
      // Oberstufe: schuljahr is user-controlled via the tab/segmented control.
      // Sek I: schuljahr is an invisible background tag, never shown in the
      // UI. New entries get auto-stamped with the current schuljahr (so the
      // multi-year tab feature can detect "spans >1 year" later); edits
      // preserve whatever the note already had (legacy notes may be null —
      // editing a typo shouldn't silently reassign it to "this year").
      schuljahr: system === "oberstufe"
        ? formSchuljahr
        : (editiereId !== null ? formSchuljahr : aktuellesSchuljahr()),
      halbjahr: system === "oberstufe" ? formHalbjahr : null,
    };
    try {
      if (editiereId !== null) {
        await api.put(`/noten/${editiereId}`, payload);
      } else {
        await api.post("/noten", payload);
        if (system === "oberstufe") await sicherstelleFachEinstellung(fach.trim(), "oberstufe");
      }
      setSpeicherStatus("success");
      try { await ladeNoten(); } catch (_) { /* list stale but save succeeded */ }
      setTimeout(() => { formSchliessen(); setSpeicherStatus("idle"); }, 800);
    } catch (err) {
      console.error("Speichern fehlgeschlagen:", err);
      setSpeicherStatus("error");
      setTimeout(() => setSpeicherStatus("idle"), 2000);
    }
  }

  function armiereLoeschen(id) {
    setPendingDeleteId(id);
    setTimeout(() => setPendingDeleteId((c) => (c === id ? null : c)), 3000);
  }

  async function bestaetigenLoeschen(id) {
    try {
      await api.delete(`/noten/${id}`);
      setPendingDeleteId(null);
      if (editiereId === id) formSchliessen();
      await ladeNoten();
    } catch (err) {
      console.error("Löschen fehlgeschlagen:", err);
    }
  }

  // ── Header statistics (ungewichtet + kursgewichtet + disclaimer) ────
  function kopfStatistik(nachFachObjekt) {
    const fachListe = Object.keys(nachFachObjekt).map((f) => {
      const einst = holeFachEinstellung(f);
      return { fach: f, kursart: einst.kursart, avg: berechneFachDurchschnittOberstufe(nachFachObjekt[f], einst) };
    });
    const ungewichtet = berechneUngewichtet(fachListe);
    const hatEA = fachListe.some((f) => f.kursart === "eA" && f.avg !== null);
    const gewichtet = hatEA ? berechneKursgewichtet(fachListe) : null;
    return { ungewichtet, gewichtet };
  }

  function renderKopfStatistik(nachFachObjekt) {
    const { ungewichtet, gewichtet } = kopfStatistik(nachFachObjekt);
    if (ungewichtet === null) return null;
    return (
      <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "24px 18px", marginBottom: "18px", textAlign: "center", background: "rgba(127,119,221,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap" }}>
          <div style={{ maxWidth: "180px" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "2.2rem", fontWeight: 700, color: punkteFarbe(ungewichtet), lineHeight: 1 }}>
              {ungewichtet.toFixed(1)}
            </div>
            <div style={{ color: "var(--text)", fontSize: "0.82rem", marginTop: "6px", fontWeight: 600 }}>Ø ungewichtet</div>
            <div style={{ color: "var(--muted)", fontSize: "0.7rem", marginTop: "2px", lineHeight: 1.4 }}>Alle Fächer zählen gleich</div>
          </div>
          {gewichtet !== null && (
            <div style={{ maxWidth: "180px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "2.2rem", fontWeight: 700, color: punkteFarbe(gewichtet), lineHeight: 1 }}>
                {gewichtet.toFixed(1)}
              </div>
              <div style={{ color: "var(--text)", fontSize: "0.82rem", marginTop: "6px", fontWeight: 600 }}>Ø mit Kursgewichtung</div>
              <div style={{ color: "var(--muted)", fontSize: "0.7rem", marginTop: "2px", lineHeight: 1.4 }}>Leistungskurse (eA) zählen doppelt, wie im Abitur</div>
            </div>
          )}
        </div>
        <div style={{ color: "var(--muted)", fontSize: "0.74rem", marginTop: "16px", lineHeight: 1.5, borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
          Dein Notendurchschnitt hier ist eine Orientierungshilfe. Er entspricht nicht der offiziellen
          Zeugnisnote deiner Schule, da Lehrer verschiedene Kriterien und Gewichtungen verwenden.
        </div>
      </div>
    );
  }

  // ── Subject card renderers ───────────────────────────────────────────
  function renderSek1Fach(fachName, fachNoten) {
    const sortiert = [...fachNoten].sort((a, b) => new Date(b.datum) - new Date(a.datum));
    const schnitt = berechneSchnitt(fachNoten);
    return (
      <div key={fachName} style={fachCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ fontWeight: 600, fontSize: "1rem" }}>{fachName}</span>
          <span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.9rem", color: notenFarbe(schnitt), fontWeight: 700 }}>
              Ø {schnitt.toFixed(2)}
            </span>
            <span style={{ color: "var(--muted)", fontSize: "0.75rem", marginLeft: "4px" }}>(ungewichtet)</span>
          </span>
        </div>
        {sortiert.map((note) => {
          const isPending = pendingDeleteId === note.id;
          const isEditing = editiereId === note.id;
          return (
            <div key={note.id} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 0", borderTop: "1px solid var(--border)",
              background: isPending ? "rgba(204,51,51,0.05)" : isEditing ? "rgba(127,119,221,0.05)" : "transparent",
              borderRadius: (isPending || isEditing) ? "4px" : "0",
            }}>
              <WertBadge wert={note.wert} />
              <TypBadge typ={note.typ} />
              <span style={{ color: "var(--muted)", fontSize: "0.82rem", fontFamily: "var(--mono)", whiteSpace: "nowrap" }}>
                {formatDatum(note.datum)}
              </span>
              {note.notiz && (
                <span style={{ color: "var(--muted)", fontSize: "0.8rem", fontStyle: "italic", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {note.notiz}
                </span>
              )}
              <div style={{ marginLeft: "auto", flexShrink: 0, display: "flex", gap: "4px", alignItems: "center" }}>
                {isPending ? (
                  <button onClick={() => bestaetigenLoeschen(note.id)} style={loeschBestaetigenBtnStyle}>Löschen bestätigen</button>
                ) : (
                  <>
                    <button onClick={() => bearbeiteNote(note)} style={{ ...pencilBtnStyle, color: isEditing ? "var(--accent)" : "var(--muted)" }} aria-label="Note bearbeiten" title="Bearbeiten">✎</button>
                    <button onClick={() => armiereLoeschen(note.id)} style={deleteBtnStyle} aria-label="Note löschen">×</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderOberstufeFach(fachName, fachNoten) {
    const einst = holeFachEinstellung(fachName);
    const avg = berechneFachDurchschnittOberstufe(fachNoten, einst);
    const sortiert = [...fachNoten].sort((a, b) => new Date(b.datum) - new Date(a.datum));
    const gearOffen = offenesGearFach === fachName;

    return (
      <div key={fachName} style={fachCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <span style={{ fontWeight: 600, fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis" }}>{fachName}</span>
            <KursartBadge kursart={einst.kursart} />
            <button
              type="button"
              onClick={() => setOffenesGearFach(gearOffen ? null : fachName)}
              aria-label={`Einstellungen für ${fachName}`} title={`Einstellungen für ${fachName} — Kursart & Gewichtung`}
              style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem", padding: 0, width: "32px", height: "32px", minWidth: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px" }}
            >⚙</button>
          </div>
          <span style={{ flexShrink: 0, fontFamily: "var(--mono)", fontWeight: 700, fontSize: "0.9rem", color: avg !== null ? punkteFarbe(avg) : "var(--muted)" }}>
            {avg !== null ? `${avg.toFixed(1)} Pkt · ≈ Note ${punkteZuNoteInt(avg)}` : "— Pkt"}
          </span>
        </div>

        {gearOffen && (
          <FachEinstellungenStrip
            fach={fachName}
            einst={einst}
            onSpeichern={(payload) => speichereFachEinstellung(fachName, payload)}
            onAbbrechen={() => setOffenesGearFach(null)}
          />
        )}

        <div style={{ marginTop: "10px" }}>
          {sortiert.map((note) => {
            const isPending = pendingDeleteId === note.id;
            const isEditing = editiereId === note.id;
            return (
              <div key={note.id} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "9px 0", borderTop: "1px solid var(--border)",
                background: isPending ? "rgba(204,51,51,0.05)" : isEditing ? "rgba(127,119,221,0.05)" : "transparent",
                borderRadius: (isPending || isEditing) ? "4px" : "0",
              }}>
                <WertBadgeOberstufe wert={note.wert} />
                <TypBadge typ={note.typ} oberstufe />
                <span style={{ background: "var(--border)", color: "var(--muted)", fontSize: "0.7rem", padding: "1px 5px", borderRadius: "3px", fontFamily: "var(--mono)" }}>
                  H{note.halbjahr || "?"}
                </span>
                <span style={{ color: "var(--muted)", fontSize: "0.82rem", fontFamily: "var(--mono)", whiteSpace: "nowrap" }}>
                  {formatDatum(note.datum)}
                </span>
                {note.notiz && (
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem", fontStyle: "italic", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {note.notiz}
                  </span>
                )}
                <div style={{ marginLeft: "auto", flexShrink: 0, display: "flex", gap: "4px", alignItems: "center" }}>
                  {isPending ? (
                    <button onClick={() => bestaetigenLoeschen(note.id)} style={loeschBestaetigenBtnStyle}>Löschen bestätigen</button>
                  ) : (
                    <>
                      <button onClick={() => bearbeiteNote(note)} style={{ ...pencilBtnStyle, color: isEditing ? "var(--accent)" : "var(--muted)" }} aria-label="Note bearbeiten" title="Bearbeiten">✎</button>
                      <button onClick={() => armiereLoeschen(note.id)} style={deleteBtnStyle} aria-label="Note löschen">×</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderGesamtuebersicht() {
    const fachKeys = Object.keys(oberstufeNachFachGesamt).sort();
    if (fachKeys.length === 0) {
      return (
        <div style={{ color: "var(--muted)", textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontWeight: 600, marginBottom: "6px", color: "var(--text)" }}>Noch keine Oberstufen-Noten eingetragen.</div>
          <div style={{ fontSize: "0.9rem" }}>Füge deine erste Note über das Formular oben hinzu.</div>
        </div>
      );
    }
    return fachKeys.map((fachName) => {
      const alle = oberstufeNachFachGesamt[fachName];
      const einst = holeFachEinstellung(fachName);
      const fachNoten1 = alle.filter((n) => n.schuljahr === schuljahrJahr1);
      const fachNoten2 = alle.filter((n) => n.schuljahr === schuljahrJahr2);
      const avgGesamt = berechneFachDurchschnittOberstufe(alle, einst);
      const avg1 = berechneFachDurchschnittOberstufe(fachNoten1, einst);
      const avg2 = berechneFachDurchschnittOberstufe(fachNoten2, einst);

      return (
        <div key={fachName} style={fachCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: "1rem" }}>{fachName}</span>
              <KursartBadge kursart={einst.kursart} />
            </div>
            <span style={{ flexShrink: 0, fontFamily: "var(--mono)", fontWeight: 700, fontSize: "0.9rem", color: avgGesamt !== null ? punkteFarbe(avgGesamt) : "var(--muted)" }}>
              {avgGesamt !== null ? `${avgGesamt.toFixed(1)} Pkt · ≈ Note ${punkteZuNoteInt(avgGesamt)}` : "— Pkt"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--muted)", width: "84px", flexShrink: 0 }}>{schuljahrLabel(schuljahrJahr1)}</span>
              <span>{avg1 !== null ? `${avg1.toFixed(1)} Pkt · ≈ Note ${punkteZuNoteInt(avg1)}` : "—"}</span>
              <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{fachNoten1.length} Einträge</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--muted)", width: "84px", flexShrink: 0 }}>{schuljahrLabel(schuljahrJahr2)}</span>
              {fachNoten2.length > 0 ? (
                <>
                  <span>{avg2 !== null ? `${avg2.toFixed(1)} Pkt · ≈ Note ${punkteZuNoteInt(avg2)}` : "—"}</span>
                  <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{fachNoten2.length} Einträge</span>
                </>
              ) : (
                <span style={{ color: "var(--muted)", fontSize: "0.8rem", fontStyle: "italic" }}>
                  Noch keine Noten
                  {!tab2Sichtbar && (
                    <>
                      {" · "}
                      <button
                        type="button"
                        onClick={() => { setZweitesJahrManuell(true); setAktiverTab("jahr2"); }}
                        style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: "0.8rem" }}
                      >Jetzt beginnen</button>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    });
  }

  // ── Render ────────────────────────────────────────────────────────────
  if (laden && einstellungen === null) {
    return (
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "clamp(16px, 4vw, 32px)", minHeight: "100vh" }}>
        <NavStrip activeId="noten" />
        <div style={{ color: "var(--muted)", textAlign: "center", padding: "60px 0" }}>Lädt…</div>
      </div>
    );
  }

  if (ladeError) {
    return (
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "clamp(16px, 4vw, 32px)", minHeight: "100vh" }}>
        <NavStrip activeId="noten" />
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontWeight: 600, marginBottom: "8px" }}>Deine Noten konnten nicht geladen werden.</div>
          <div style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
            Prüfe deine Verbindung und versuche es erneut.
          </div>
          <button
            onClick={ladeAlles}
            style={{
              background: "var(--accent)", color: "#fff", border: "none",
              borderRadius: "var(--radius)", padding: "10px 20px", fontWeight: 600, cursor: "pointer",
            }}
          >Erneut versuchen</button>
        </div>
      </div>
    );
  }

  if (einstellungen !== null && !einstellungen.setup_done) {
    return (
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "clamp(16px, 4vw, 32px)", minHeight: "100vh" }}>
        <NavStrip activeId="noten" />
        <EinrichtungsAssistent
          schritt={setupSchritt}
          onKlasseWahl={setupKlasseWahl}
          onSchuljahrWahl={setupSchuljahrWahl}
          vorgeschlagenesJahr={setupKlasse === 13 ? aktuellesSchuljahr() - 1 : aktuellesSchuljahr()}
          jahrOptionen={[aktuellesSchuljahr() - 2, aktuellesSchuljahr() - 1, aktuellesSchuljahr()]}
        />
      </div>
    );
  }

  const aktuellerTabNachFach = aktiverTab === "jahr1" ? jahr1NachFach : aktiverTab === "jahr2" ? jahr2NachFach : oberstufeNachFachGesamt;

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "clamp(16px, 4vw, 32px)", minHeight: "100vh" }}>

      {showLaunch && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'var(--bg)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '1.5rem'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>
            Noten sind live 🎉
          </div>
          <div style={{
            fontSize: '5rem', fontWeight: 700,
            fontFamily: 'var(--mono)', color: 'var(--text)'
          }}>
            {String(countdown).padStart(2, '0')}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Deine Noten warten auf dich
          </div>
        </div>
      )}

      <NavStrip activeId="noten" />

      {!istBerufsschule && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
          <button
            type="button"
            onClick={() => setEinstellungenOffen((offen) => !offen)}
            title="Klasse, Modus oder Schuljahr ändern"
            style={{
              background: "none", border: "none", color: "var(--muted)",
              cursor: "pointer", fontSize: "0.82rem", padding: "4px 2px",
              display: "flex", alignItems: "center", gap: "4px",
            }}
          >⚙ Einstellungen</button>
        </div>
      )}

      {einstellungenOffen && (
        <NotenEinstellungenStrip
          einstellungen={einstellungen}
          hatOberstufeNoten={oberstufeNoten.length > 0}
          onSpeichern={einstellungenAktualisieren}
          onAbbrechen={() => setEinstellungenOffen(false)}
        />
      )}

      {istBerufsschule && (
        <div style={{
          border: "1px solid var(--border)", color: "var(--muted)",
          padding: "10px 14px", borderRadius: "6px", fontSize: "0.85rem", marginBottom: "20px",
        }}>
          Hinweis: Das Punkte-System (0–15) für Berufsschulen kommt bald. Du kannst Noten 1–6 bereits eintragen.
        </div>
      )}

      {istOberstufe && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "18px", flexWrap: "wrap" }}>
          <button onClick={() => setAktiverTab("jahr1")} style={tabButtonStyle(aktiverTab === "jahr1")}>
            Q1+Q2 · {schuljahrLabel(schuljahrJahr1)}
          </button>
          {tab2Sichtbar ? (
            <button onClick={() => setAktiverTab("jahr2")} style={tabButtonStyle(aktiverTab === "jahr2")}>
              Q3+Q4 · {schuljahrLabel(schuljahrJahr2)}
            </button>
          ) : (
            <button onClick={() => { setZweitesJahrManuell(true); setAktiverTab("jahr2"); }} style={{ ...tabButtonStyle(false), borderStyle: "dashed", color: "var(--accent)" }}>
              + Neues Schuljahr
            </button>
          )}
          <button onClick={() => setAktiverTab("gesamt")} style={tabButtonStyle(aktiverTab === "gesamt")}>
            Gesamtübersicht
          </button>
        </div>
      )}

      {istOberstufe && !laden && renderKopfStatistik(aktuellerTabNachFach)}

      {!istOberstufe && sek1MultiJahr && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "18px", flexWrap: "wrap" }}>
          <button onClick={() => setSek1Tab("alle")} style={tabButtonStyle(sek1Tab === "alle")}>Alle</button>
          {sek1JahreVorhanden.map((j) => (
            <button key={j} onClick={() => setSek1Tab(j)} style={tabButtonStyle(sek1Tab === j)}>
              {schuljahrLabel(j)}
            </button>
          ))}
        </div>
      )}

      {!istOberstufe && !laden && sek1GefiltertNoten.length > 0 && sek1GesamtSchnitt !== null && (
        <div style={{
          textAlign: "center", padding: "28px 20px",
          border: "1px solid var(--border)", borderRadius: "12px", marginBottom: "24px",
          background: "rgba(127,119,221,0.06)",
        }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "2.8rem", fontWeight: 700, color: notenFarbe(sek1GesamtSchnitt), lineHeight: 1 }}>
            {sek1GesamtSchnitt.toFixed(2)}
          </div>
          <div style={{ color: "var(--text)", fontSize: "0.9rem", marginTop: "8px", fontWeight: 600 }}>Dein Schnitt</div>
          <div style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "2px" }}>Ø über alle Fächer, ungewichtet</div>
        </div>
      )}

      {/* Form anchor — scrolled into view on edit/add */}
      <div ref={formRef}>
        {!formOffen ? (
          <button onClick={formOeffnenNeu} style={addButtonStyle}>+ Note hinzufügen</button>
        ) : (
          <div style={formContainerStyle}>
            <div style={{
              fontSize: "0.8rem", fontWeight: 600,
              color: editiereId !== null ? "var(--accent)" : "var(--text)",
              marginBottom: "14px",
            }}>
              {editiereId !== null
                ? `Note bearbeiten${editLabel ? ` — ${editLabel.fach} · ${editLabel.wert} · ${formatDatum(editLabel.datum)}` : ""}`
                : "Note hinzufügen"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Fach</label>
                <input
                  type="text" list="fach-vorschlaege"
                  placeholder="z. B. Mathematik"
                  value={fach} onChange={(e) => setFach(e.target.value)}
                  maxLength={100} required
                />
                <datalist id="fach-vorschlaege">
                  {uniqueFaecher.map((f) => <option key={f} value={f} />)}
                </datalist>
              </div>

              {formSystem === "oberstufe" ? (
                <>
                  <div>
                    <label style={labelStyle}>Punkte</label>
                    <PunkteRaster value={wert} onChange={setWert} />
                  </div>
                  <div>
                    <label style={labelStyle}>Art</label>
                    <TypPickerOberstufe value={typ} onChange={setTyp} />
                  </div>
                  <div style={{ display: "flex", gap: "14px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Schuljahr</label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {formJahrOptionen.map((j) => (
                          <button key={j} type="button" onClick={() => setFormSchuljahr(j)} style={segButtonStyle(formSchuljahr === j)}>
                            {schuljahrLabel(j)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Halbjahr</label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {[1, 2].map((h) => (
                          <button key={h} type="button" onClick={() => setFormHalbjahr(h)} style={segButtonStyle(formHalbjahr === h)}>
                            H{h}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={labelStyle}>Note</label>
                    <WertPicker value={wert} onChange={setWert} />
                  </div>
                  <div>
                    <label style={labelStyle}>Art</label>
                    <TypPicker value={typ} onChange={setTyp} />
                  </div>
                </>
              )}

              <div>
                <label style={labelStyle}>Datum</label>
                <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} required />
              </div>

              <div>
                <label style={labelStyle}>Notiz (optional)</label>
                <textarea
                  placeholder="Optionale Notiz..." rows={2}
                  value={notiz} onChange={(e) => setNotiz(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <LoadingButton
                  status={speicherStatus}
                  onClick={noteSpeichern}
                  disabled={!kannSpeichern || istLaden}
                  style={{ flex: 1 }}
                >
                  {editiereId !== null ? "Änderungen speichern" : "Note speichern"}
                </LoadingButton>
                <button
                  type="button"
                  onClick={formSchliessen}
                  style={{
                    background: "transparent", border: "1px solid var(--border)",
                    color: "var(--muted)", padding: "10px 16px", borderRadius: "var(--radius)",
                  }}
                >Abbrechen</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {laden && (
        <div style={{ color: "var(--muted)", textAlign: "center", padding: "40px 0" }}>Lädt…</div>
      )}

      {!laden && istOberstufe && (
        <>
          {aktiverTab === "gesamt" ? (
            renderGesamtuebersicht()
          ) : (
            <>
              {Object.keys(aktuellerTabNachFach).length === 0 ? (
                <div style={{ color: "var(--muted)", textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontWeight: 600, marginBottom: "6px", color: "var(--text)" }}>Noch keine Noten in diesem Schuljahr.</div>
                  <div style={{ fontSize: "0.9rem" }}>Füge deine erste Note über das Formular oben hinzu.</div>
                </div>
              ) : (
                Object.keys(aktuellerTabNachFach).sort().map((f) => renderOberstufeFach(f, aktuellerTabNachFach[f]))
              )}
            </>
          )}

          {sek1FachKeys.length > 0 && (
            <div style={{ marginTop: "28px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted)", marginBottom: "10px" }}>
                Fächer mit Schulnoten (außerhalb der Q-Phase)
              </div>
              {sek1FachKeys.map((f) => renderSek1Fach(f, sek1NachFach[f]))}
            </div>
          )}
        </>
      )}

      {!laden && !istOberstufe && (
        <>
          {sek1FachKeys.length === 0 && (
            <div style={{ color: "var(--muted)", textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontWeight: 600, marginBottom: "6px", color: "var(--text)" }}>Noch keine Noten eingetragen.</div>
              <div style={{ fontSize: "0.9rem" }}>Füge deine erste Note über das Formular oben hinzu.</div>
            </div>
          )}
          {sek1FachKeys.map((f) => renderSek1Fach(f, sek1NachFach[f]))}
        </>
      )}
    </div>
  );
}