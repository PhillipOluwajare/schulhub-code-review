// frontend/src/components/ui/Loadingscreen.jsx
import { useState, useLayoutEffect } from 'react';

const NODES = [
  { id: 1, tx: 28,  ty: -24, delay: 0.00 },
  { id: 2, tx: -30, ty: -18, delay: 0.10 },
  { id: 3, tx: -32, ty: 14,  delay: 0.19 },
  { id: 4, tx: 6,   ty: 34,  delay: 0.28 },
  { id: 5, tx: 34,  ty: 10,  delay: 0.37 },
];

const CX = 50;
const CY = 50;
const HUB_R = 11;
const NODE_R = 6.5;

export default function Loadingscreen({ visible }) {
  const [display, setDisplay]     = useState(visible);
  const [animating, setAnimating] = useState(visible);
  const [fadingOut, setFadingOut] = useState(false);

  useLayoutEffect(() => {
    if (visible) {
      setFadingOut(false);
      setDisplay(true);
      setAnimating(true);
    } else {
      setAnimating(false);
      setFadingOut(true);
      const t = setTimeout(() => {
        setDisplay(false);
        setFadingOut(false);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!display) return null;

  return (
    <>
      <style>{`
        .ls-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          opacity: 1;
          pointer-events: all;
        }
        .ls-overlay.ls-fading {
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .ls-spoke {
          stroke: rgba(255,255,255,0.20);
          stroke-width: 1.8;
          stroke-linecap: round;
          opacity: 0;
        }

        .ls-node {
          fill: #666672;
          opacity: 0;
          transform: translate(0px, 0px) scale(0);
          transform-box: fill-box;
          transform-origin: center center;
        }

        ${NODES.map(n => `
        .ls-animate .ls-spoke-${n.id} {
          animation: spokeIn 0.7s ease ${n.delay + 0.08}s forwards;
        }
        .ls-animate .ls-node-${n.id} {
          animation: nodeOut_${n.id} 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) ${n.delay}s forwards;
        }
        @keyframes nodeOut_${n.id} {
          0%   { transform: translate(0px, 0px) scale(0);               opacity: 0; }
          12%  { opacity: 1; }
          65%  { transform: translate(${n.tx * 1.22}px, ${n.ty * 1.22}px) scale(1.2); opacity: 1; }
          100% { transform: translate(${n.tx}px, ${n.ty}px) scale(1);   opacity: 1; }
        }
        `).join('')}

        @keyframes spokeIn {
          from { opacity: 0; }
          to   { opacity: 0.5; }
        }

        .ls-hub {
          fill: #7F77DD;
          transform-box: fill-box;
          transform-origin: center center;
        }
        .ls-animate .ls-hub {
          animation: hubPulse 1.4s ease 0.2s infinite;
        }
        @keyframes hubPulse {
          0%, 100% { r: 11;  opacity: 1; }
          50%       { r: 13; opacity: 0.8; }
        }

        .ls-wordmark {
          opacity: 0;
          transition: opacity 0.5s ease 0.9s;
          margin-top: 28px;
          font-family: 'DM Sans', sans-serif;
          font-size: 22px;
          letter-spacing: 0.05em;
          color: var(--muted);
        }
        .ls-animate .ls-wordmark {
          opacity: 1;
        }
        .ls-wordmark span {
          font-family: 'Space Mono', monospace;
          color: #7F77DD;
        }
      `}</style>

      <div className={`ls-overlay${fadingOut ? ' ls-fading' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg
            viewBox="0 0 100 100"
            width="140"
            height="140"
            xmlns="http://www.w3.org/2000/svg"
            className={animating ? 'ls-animate' : ''}
            style={{ overflow: 'visible' }}
          >
            {NODES.map(n => (
              <line
                key={n.id}
                className={`ls-spoke ls-spoke-${n.id}`}
                x1={CX} y1={CY}
                x2={CX + n.tx} y2={CY + n.ty}
              />
            ))}
            <circle className="ls-hub" cx={CX} cy={CY} r={HUB_R} />
            {NODES.map(n => (
              <circle
                key={n.id}
                className={`ls-node ls-node-${n.id}`}
                cx={CX} cy={CY}
                r={NODE_R}
              />
            ))}
          </svg>

          <div className={`ls-wordmark${animating ? ' ls-animate' : ''}`}>
            Schul<span>Hub</span>
          </div>
        </div>
      </div>
    </>
  );
}