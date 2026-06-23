// frontend/src/pages/Landing.jsx
// MOBILE FIX (375px): hero padding was 100px top (too much) — now clamp(56px, 10vw, 100px)
// CTA banner padding was 80px top/bottom — now clamp(48px, 8vw, 80px)
// previewSection bottom padding was 60px — now clamp(32px, 6vw, 60px)
// heroTitle maxWidth added so it doesn't stretch weird on wide screens
// All clamp() values already on nav, features, footer from previous fix session
// June 18 2026: DashboardMockup updated — teacher names removed, NavStrip added,
// Termin button added, pencil button on HA cards, date format updated

import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// ─── Static Dashboard Mockup ────────────────────────────────────────────────

function DashboardMockup() {
  const heute = new Date().toLocaleDateString("de-DE", {
    weekday: "short", day: "numeric", month: "long"
  });

  return (
    <div style={mockup.shell}>
      <div style={mockup.bar} />
      <div style={mockup.db}>

        {/* Header */}
        <div style={mockup.header}>
          <div>
            <div style={mockup.logo}>SchulHub</div>
            <div style={mockup.headerDate}>{heute}</div>
          </div>
          <div style={mockup.headerBtns}>
            <div style={mockup.btnSm}>⚙ Settings</div>
            <div style={mockup.btnSm}>Logout</div>
          </div>
        </div>

        {/* NavStrip */}
        <div style={mockup.navStrip}>
          <div style={mockup.navPillActive}>▦ Dashboard</div>
          <div style={mockup.navPillMuted}>
            ▪ Noten <span style={mockup.bald}>BALD</span>
          </div>
        </div>

        {/* Stundenplan */}
        <div style={{ marginBottom: 16 }}>
          <div style={mockup.sectionNav}>
            <span style={mockup.sectionLabel}>Stundenplan</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={mockup.navArrow}>‹</div>
              <span style={mockup.navDate}>Do., 18. Juni</span>
              <div style={mockup.navArrow}>›</div>
            </div>
          </div>
          {[
            { fach: "Mathematik", zeit: "07:55–08:40", raum: "R 204" },
            { fach: "Englisch",   zeit: "08:45–09:30", raum: "R 112" },
            { fach: "Physik",     zeit: "09:50–10:35", raum: "R 307" },
            { fach: "Deutsch",    zeit: "10:40–11:25", raum: "R 108" },
          ].map((s, i) => (
            <div key={i} style={mockup.lesson}>
              <span style={mockup.lessonFach}>{s.fach}</span>
              <div style={{ textAlign: "right" }}>
                <div style={mockup.lessonZeit}>{s.zeit}</div>
                <div style={mockup.lessonRaum}>{s.raum}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Termin button */}
        <div style={mockup.terminBtn}>+ Termin hinzufügen</div>

        <div style={mockup.divider} />

        {/* Hausaufgaben */}
        <div style={{ marginTop: 16 }}>
          <p style={mockup.sectionLabel}>Meine Hausaufgaben</p>
          {[
            { fach: "Englisch", desc: "Vocabulary Unit 8 lernen",   date: "Morgen",  done: false },
            { fach: "Physik",   desc: "Aufgabenblatt Elektrizität", date: "+2 Tage", done: false },
            { fach: "Deutsch",  desc: "Aufsatz Entwurf abgeben",    date: "Gestern", done: true  },
          ].map((ha, i) => (
            <div key={i} style={{ ...mockup.haCard, ...(ha.done ? mockup.haCardDone : {}) }}>
              <div style={mockup.haTop}>
                <span>
                  <span style={mockup.haFach}>{ha.fach}</span>
                  <span style={mockup.haDesc}>{ha.desc}</span>
                </span>
                <span style={mockup.haDate}>{ha.date}</span>
              </div>
              {!ha.done && (
                <div style={{ display: "flex", gap: 7 }}>
                  <div style={mockup.haBtnDone}>✓ Erledigt</div>
                  <div style={mockup.haBtnEdit}>✎</div>
                  <div style={mockup.haBtnDel}>Löschen</div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

const mockup = {
  shell: {
    background: "#181818",
    borderRadius: 16,
    padding: 10,
    border: "1px solid #2a2a2a",
    maxWidth: 560,
    margin: "0 auto",
    boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
  },
  bar: { height: 4, width: 36, background: "#333", borderRadius: 2, margin: "0 auto 10px" },
  db: {
    background: "#0f0f0f",
    borderRadius: 10,
    padding: "20px 18px",
    color: "#e8e6e0",
    fontFamily: "'DM Sans', sans-serif",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  logo: { fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#7F77DD", letterSpacing: "0.02em" },
  headerDate: { color: "#555", fontSize: 11, marginTop: 2 },
  headerBtns: { display: "flex", gap: 6 },
  btnSm: { background: "transparent", border: "1px solid #2a2a2a", color: "#555", padding: "5px 10px", fontSize: 11, borderRadius: 6 },
  navStrip: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    borderBottom: "1px solid #1e1e1e",
    paddingBottom: 12,
  },
  navPillActive: {
    background: "rgba(127,119,221,0.12)",
    color: "#7F77DD",
    border: "1px solid #7F77DD",
    padding: "5px 12px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  navPillMuted: {
    color: "#444",
    padding: "5px 12px",
    borderRadius: 6,
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  bald: {
    fontFamily: "monospace",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.06em",
    background: "#1a1a1a",
    color: "#444",
    border: "1px solid #333",
    padding: "1px 5px",
    borderRadius: 3,
  },
  sectionNav: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionLabel: { fontSize: 10, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px", display: "block" },
  navArrow: { background: "transparent", border: "1px solid #2a2a2a", color: "#555", padding: "2px 8px", fontSize: 13, borderRadius: 6 },
  navDate: { fontFamily: "monospace", fontSize: 10, color: "#555", minWidth: 80, textAlign: "center" },
  lesson: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#141414", border: "1px solid #2a2a2a", borderRadius: 7, padding: "9px 12px", marginBottom: 6 },
  lessonFach: { fontWeight: 600, fontSize: 13, color: "#e8e6e0" },
  lessonZeit: { fontFamily: "monospace", fontSize: 10, color: "#555" },
  lessonRaum: { fontFamily: "monospace", fontSize: 10, color: "#7F77DD", marginTop: 2 },
  terminBtn: {
    border: "1px dashed #7F77DD",
    color: "#7F77DD",
    borderRadius: 7,
    padding: "8px 12px",
    fontSize: 11,
    textAlign: "center",
    marginBottom: 16,
    cursor: "default",
  },
  divider: { borderTop: "1px solid #1e1e1e", margin: "16px 0" },
  haCard: { background: "#141414", border: "1px solid #2a2a2a", borderLeft: "3px solid #7F77DD", borderRadius: 7, padding: "10px 12px", marginBottom: 7 },
  haCardDone: { opacity: 0.35, borderLeftColor: "#2a7a4a" },
  haTop: { display: "flex", justifyContent: "space-between", marginBottom: 7 },
  haFach: { fontWeight: 600, fontSize: 12, color: "#e8e6e0" },
  haDesc: { fontWeight: 400, color: "#555", marginLeft: 7, fontSize: 12 },
  haDate: { fontFamily: "monospace", fontSize: 10, color: "#555" },
  haBtnDone: { background: "rgba(127,119,221,0.12)", color: "#7F77DD", border: "1px solid #7F77DD", padding: "2px 9px", fontSize: 10, borderRadius: 5 },
  haBtnEdit: { background: "transparent", color: "#444", border: "1px solid #2a2a2a", padding: "2px 9px", fontSize: 10, borderRadius: 5 },
  haBtnDel:  { background: "transparent", color: "#444", border: "1px solid #2a2a2a", padding: "2px 9px", fontSize: 10, borderRadius: 5 },
};

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc, tag, delay }) {
  const [vis, setVis] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVis(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        ...styles.card,
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease ${delay}, transform 0.6s ease ${delay}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <span style={styles.cardIcon}>{icon}</span>
        {tag && (
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 4,
            letterSpacing: "0.06em",
            background: tag === "live" ? "var(--accent-dim)" : "var(--surface)",
            color:      tag === "live" ? "var(--accent)"     : "var(--muted)",
            border:     tag === "live" ? "1px solid var(--accent)" : "1px solid var(--border)",
          }}>
            {tag === "live" ? "LIVE" : "BALD"}
          </span>
        )}
      </div>
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardDesc}>{desc}</p>
    </div>
  );
}

// ─── School Badge ─────────────────────────────────────────────────────────────

function SchoolBadge({ name, status }) {
  return (
    <div style={styles.schoolBadge}>
      <span style={styles.schoolName}>{name}</span>
      {/* Status badge uses CSS variables — works in both light and dark mode */}
      <span style={{
        ...styles.schoolStatus,
        background: status === "aktiv" ? "var(--accent-dim)" : "var(--surface)",
        color:      status === "aktiv" ? "var(--accent)"     : "var(--muted)",
        border:     status === "aktiv" ? "1px solid var(--accent)" : "1px solid var(--border)",
      }}>
        {status === "aktiv" ? "Aktiv" : "Kommt bald"}
      </span>
    </div>
  );
}

// ─── Main Landing ─────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [mockupVis, setMockupVis] = useState(false);
  const mockupRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setMockupVis(true); },
      { threshold: 0.1 }
    );
    if (mockupRef.current) observer.observe(mockupRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={styles.root}>

      {/* Nav */}
      <nav style={styles.nav}>
        <span style={styles.navLogo}>SchulHub</span>
        <div style={styles.navLinks}>
          <button style={styles.navBtn} onClick={() => navigate("/login")}>
            Anmelden
          </button>
          <button style={styles.navBtnPrimary} onClick={() => navigate("/registrieren")}>
            Registrieren
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          ...styles.hero,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        <div style={styles.heroTag}>Für Schüler in Vechta</div>
        <h1 style={styles.heroTitle}>
          Kein Chaos mehr.<br />
          <span style={styles.heroAccent}>Nur noch Schule.</span>
        </h1>
        <p style={styles.heroSub}>
          Stundenplan direkt aus WebUntis, Hausaufgaben im Blick —
          alles in einer App. Kostenlos.
        </p>
        <div style={styles.heroCtas}>
          <button style={styles.ctaPrimary} onClick={() => navigate("/registrieren")}>
            Jetzt kostenlos starten
          </button>
          <button style={styles.ctaSecondary} onClick={() => navigate("/login")}>
            Bereits registriert →
          </button>
        </div>
        <p style={styles.heroSchools}>
          KST Vechta · Gymnasium Antonianum · Adolf-Kolping-Schule · Justus-von-Liebig-Schule
        </p>
      </section>

      {/* Dashboard Preview */}
      <section
        ref={mockupRef}
        style={{
          ...styles.previewSection,
          opacity: mockupVis ? 1 : 0,
          transform: mockupVis ? "translateY(0)" : "translateY(32px)",
          transition: "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s",
        }}
      >
        <p style={styles.previewLabel}>So sieht's aus</p>
        <DashboardMockup />
        <p style={styles.previewCaption}>
          Stundenplan direkt aus WebUntis. Kein manuelles Eintragen.
        </p>
      </section>

      {/* Features */}
      <section style={styles.features}>
        <FeatureCard
          icon="📅"
          title="WebUntis-Sync"
          desc="Dein Stundenplan automatisch aktualisiert — Vertretungen inklusive. Einmal einrichten, nie wieder manuell."
          tag="live"
          delay="0.1s"
        />
        <FeatureCard
          icon="✏️"
          title="Hausaufgaben"
          desc="Aufgaben eintragen, abhaken, vergessen. Fach-Filter, Fälligkeiten — nichts geht unter."
          tag="live"
          delay="0.2s"
        />
        <FeatureCard
          icon="🗓️"
          title="Termine"
          desc="Eigene Termine eintragen — Arzt, Nachhilfe, Prüfung. Im Stundenplan sichtbar, mit Erinnerung im Blick."
          tag="live"
          delay="0.3s"
        />
        <FeatureCard
          icon="📊"
          title="Noten & Durchschnitt"
          desc="Noten eintragen, Durchschnitt berechnen, Tendenzen erkennen. Pro Fach und gesamt."
          tag="bald"
          delay="0.4s"
        />
        <FeatureCard
          icon="👥"
          title="Klasse vernetzt"
          desc="Notizen teilen, Klassen-Feed, gemeinsam vorbereiten. Kommt später."
          tag="bald"
          delay="0.5s"
        />
      </section>

      {/* Schools */}
      <section style={styles.schoolsSection}>
        <p style={styles.schoolsLabel}>Verfügbar an deiner Schule</p>
        <div style={styles.schoolsList}>
          <SchoolBadge name="KST Vechta"               status="aktiv" />
          <SchoolBadge name="Gymnasium Antonianum"      status="aktiv" />
          <SchoolBadge name="Adolf-Kolping-Schule"      status="aktiv" />
          <SchoolBadge name="Justus-von-Liebig-Schule"  status="aktiv" />
        </div>
      </section>

      {/* CTA Banner */}
      <section style={styles.ctaBanner}>
        <h2 style={styles.ctaBannerTitle}>Einmal einrichten. Täglich nutzen.</h2>
        <p style={styles.ctaBannerSub}>Kein Download. Kein Abo. Kostenlos und direkt im Browser.</p>
        <button style={styles.ctaPrimary} onClick={() => navigate("/registrieren")}>
          Kostenlos registrieren
        </button>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <span style={styles.footerLogo}>SchulHub</span>
        <div style={styles.footerLinks}>
          <Link to="/impressum"   style={styles.footerLink}>Impressum</Link>
          <Link to="/datenschutz" style={styles.footerLink}>Datenschutz</Link>
          <a href="mailto:kontakt@schulhub.eu" style={styles.footerLink}>Kontakt</a>
        </div>
        <span style={styles.footerCopy}>© 2026 SchulHub</span>
      </footer>

    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  root: {
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px clamp(20px, 5vw, 40px)",
    borderBottom: "1px solid var(--border)",
    position: "sticky",
    top: 0,
    background: "var(--bg)",
    zIndex: 100,
  },
  navLogo: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--accent)",
    letterSpacing: "0.02em",
  },
  navLinks: { display: "flex", gap: "12px", alignItems: "center" },
  navBtn: {
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text)",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px",
    width: "auto",
  },
  navBtnPrimary: {
    background: "var(--accent)",
    border: "none",
    color: "#000",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    width: "auto",
  },
  hero: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "clamp(56px, 10vw, 100px) clamp(16px, 4vw, 24px) 60px",
    maxWidth: "760px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  heroTag: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "11px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--accent)",
    background: "var(--accent-dim)",
    padding: "4px 12px",
    borderRadius: "4px",
    marginBottom: "28px",
  },
  heroTitle: {
    fontSize: "clamp(32px, 7vw, 64px)",
    fontWeight: 700,
    lineHeight: 1.12,
    margin: "0 0 24px",
    letterSpacing: "-0.02em",
    maxWidth: "600px",
  },
  heroAccent: { color: "var(--accent)" },
  heroSub: {
    fontSize: "clamp(15px, 2.5vw, 18px)",
    color: "var(--muted)",
    lineHeight: 1.6,
    maxWidth: "520px",
    margin: "0 0 40px",
  },
  heroCtas: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: "32px",
  },
  ctaPrimary: {
    background: "var(--accent)",
    color: "#000",
    border: "none",
    padding: "14px 28px",
    borderRadius: "8px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    width: "auto",
  },
  ctaSecondary: {
    background: "transparent",
    color: "var(--muted)",
    border: "1px solid var(--border)",
    padding: "14px 28px",
    borderRadius: "8px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "16px",
    cursor: "pointer",
    width: "auto",
  },
  heroSchools: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "11px",
    color: "var(--muted)",
    letterSpacing: "0.06em",
    textAlign: "center",
    lineHeight: 1.8,
  },
  previewSection: {
    padding: "20px clamp(16px, 4vw, 24px) clamp(32px, 6vw, 60px)",
    maxWidth: "680px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
    textAlign: "center",
  },
  previewLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "11px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: "24px",
  },
  previewCaption: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "11px",
    color: "var(--muted)",
    marginTop: "20px",
    letterSpacing: "0.04em",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
    padding: "60px clamp(16px, 5vw, 40px)",
    maxWidth: "1100px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
    borderTop: "1px solid var(--border)",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "32px 28px",
  },
  cardIcon:  { fontSize: "28px", display: "block", marginBottom: "16px" },
  cardTitle: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "14px",
    fontWeight: 700,
    margin: "0 0 10px",
    letterSpacing: "0.02em",
  },
  cardDesc: {
    fontSize: "14px",
    color: "var(--muted)",
    lineHeight: 1.65,
    margin: 0,
  },
  schoolsSection: {
    textAlign: "center",
    padding: "40px clamp(16px, 4vw, 24px) 60px",
    borderTop: "1px solid var(--border)",
  },
  schoolsLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "11px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: "20px",
  },
  schoolsList: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
    maxWidth: "700px",
    margin: "0 auto",
  },
  schoolBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 18px",
  },
  schoolName:   { fontSize: "14px", fontWeight: 500 },
  schoolStatus: {
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "4px",
    fontFamily: "'Space Mono', monospace",
    letterSpacing: "0.04em",
  },
  ctaBanner: {
    textAlign: "center",
    padding: "clamp(48px, 8vw, 80px) clamp(16px, 4vw, 24px)",
    borderTop: "1px solid var(--border)",
    background: "var(--surface)",
  },
  ctaBannerTitle: {
    fontSize: "clamp(22px, 4vw, 38px)",
    fontWeight: 700,
    margin: "0 0 12px",
    letterSpacing: "-0.02em",
  },
  ctaBannerSub: {
    color: "var(--muted)",
    fontSize: "clamp(14px, 2vw, 16px)",
    margin: "0 0 32px",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px clamp(16px, 5vw, 40px)",
    borderTop: "1px solid var(--border)",
    flexWrap: "wrap",
    gap: "12px",
  },
  footerLogo: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "13px",
    color: "var(--accent)",
    fontWeight: 700,
  },
  footerLinks: { display: "flex", gap: "24px", flexWrap: "wrap" },
  footerLink:  { color: "var(--muted)", textDecoration: "none", fontSize: "13px" },
  footerCopy: {
    color: "var(--muted)",
    fontSize: "12px",
    fontFamily: "'Space Mono', monospace",
  },
};