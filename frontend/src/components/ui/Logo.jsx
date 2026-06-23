const sizeMap = {
  sm: { icon: 24, font: 16, gap: 8 },
  md: { icon: 32, font: 20, gap: 10 },
  lg: { icon: 44, font: 28, gap: 13 },
}

const HUB   = '#7F77DD'
const NODE  = '#666672'          // gray satellite nodes
const SELF  = '#ffffff'          // white "you" node — bottom right, slightly bigger
const SPOKE = 'rgba(255,255,255,0.12)'  // very subtle lines

export default function Logo({ size = 'md', className = '' }) {
  const s = sizeMap[size]

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        textDecoration: 'none',
      }}
    >
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <line x1="20" y1="20" x2="18" y2="5"  stroke={SPOKE} strokeWidth="1.2"/>
        <line x1="20" y1="20" x2="35" y2="14" stroke={SPOKE} strokeWidth="1.2"/>
        <line x1="20" y1="20" x2="34" y2="32" stroke={SPOKE} strokeWidth="1.2"/>
        <line x1="20" y1="20" x2="10" y2="34" stroke={SPOKE} strokeWidth="1.2"/>
        <line x1="20" y1="20" x2="5"  y2="18" stroke={SPOKE} strokeWidth="1.2"/>
        <circle cx="18" cy="5"  r="3"   fill={NODE}/>
        <circle cx="35" cy="14" r="3"   fill={NODE}/>
        <circle cx="34" cy="32" r="4"   fill={SELF}/>
        <circle cx="10" cy="34" r="3"   fill={NODE}/>
        <circle cx="5"  cy="18" r="3"   fill={NODE}/>
        <circle cx="20" cy="20" r="7.5" fill={HUB}/>
      </svg>

      <span style={{ display: 'flex', alignItems: 'baseline' }}>
        <span
          style={{
            fontSize: s.font,
            fontWeight: 400,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            color: 'var(--text)',
            letterSpacing: '-0.3px',
            lineHeight: 1,
          }}
        >
          Schul
        </span>
        <span
          style={{
            fontSize: s.font,
            fontWeight: 700,
            fontFamily: "'Space Mono', 'Courier New', monospace",
            color: HUB,
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}
        >
          Hub
        </span>
      </span>
    </div>
  )
}