import { Link } from "react-router-dom";

// Place this file at: frontend/src/components/ui/NavStrip.jsx

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "noten", label: "Noten", href: "/noten" },
  // { id: "ki", label: "KI-Coaching", href: "/ki" }      ← add when Layer 4 ships
  // { id: "klasse", label: "Klasse", href: "/klasse" }   ← add when Layer 5 ships
];

export default function NavStrip({ activeId }) {
  return (
    <nav
      style={{
        display: "flex",
        gap: "24px",
        borderBottom: "1px solid var(--border)",
        marginBottom: "28px",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === activeId;
        return (
          <Link
            key={item.id}
            to={item.href}
            style={{
              paddingBottom: "10px",
              marginBottom: "-1px",
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 500,
              fontSize: "0.95rem",
              textDecoration: "none",
              border: "none",
              background: "none",
              cursor: "pointer",
              color: isActive ? "var(--text)" : "var(--muted)",
              borderBottom: isActive
                ? "2px solid var(--accent)"
                : "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
