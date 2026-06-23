import React from 'react';

/**
 * SkeletonBlock — SchulHub UI primitive
 * 
 * Props:
 *   width:   string | number (e.g. '100%', 120)       default: '100%'
 *   height:  string | number (e.g. '14px', 36)        default: '14px'
 *   borderRadius: string                               default: '4px'
 *   style:   object (extra inline styles)
 * 
 * Pre-built variants (convenience wrappers):
 *   <SkeletonBlock.Text />        — single line of text
 *   <SkeletonBlock.Title />       — heading line
 *   <SkeletonBlock.Avatar />      — circular avatar
 *   <SkeletonBlock.Button />      — button shape
 *   <SkeletonBlock.Input />       — input field shape
 *   <SkeletonBlock.TimetableCell /> — timetable grid cell
 * 
 * Usage:
 *   import SkeletonBlock from '../components/ui/SkeletonBlock';
 * 
 *   // Custom
 *   <SkeletonBlock width="60%" height={16} />
 * 
 *   // Variant
 *   <SkeletonBlock.Title />
 *   <SkeletonBlock.Text width="80%" />
 */

const shimmerCSS = `
@keyframes schulhub-shimmer {
  to { transform: translateX(200%); }
}
.schulhub-skeleton {
  background: var(--color-background-secondary);
  position: relative;
  overflow: hidden;
}
.schulhub-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(128, 128, 128, 0.08) 50%,
    transparent 100%
  );
  animation: schulhub-shimmer 1.6s ease-in-out infinite;
  transform: translateX(-100%);
}
`;

function SkeletonBlock({
  width = '100%',
  height = '14px',
  borderRadius = '4px',
  style = {},
}) {
  const w = typeof width === 'number' ? `${width}px` : width;
  const h = typeof height === 'number' ? `${height}px` : height;

  return (
    <>
      <style>{shimmerCSS}</style>
      <div
        className="schulhub-skeleton"
        style={{ width: w, height: h, borderRadius, ...style }}
        aria-hidden="true"
      />
    </>
  );
}

// --- Variants ---

SkeletonBlock.Text = function SkeletonText({ width = '100%', style = {} }) {
  return <SkeletonBlock width={width} height="13px" borderRadius="4px" style={style} />;
};

SkeletonBlock.Title = function SkeletonTitle({ width = '40%', style = {} }) {
  return <SkeletonBlock width={width} height="18px" borderRadius="4px" style={style} />;
};

SkeletonBlock.Avatar = function SkeletonAvatar({ size = 36, style = {} }) {
  return (
    <SkeletonBlock
      width={size}
      height={size}
      borderRadius="50%"
      style={style}
    />
  );
};

SkeletonBlock.Button = function SkeletonButton({ width = 120, style = {} }) {
  return (
    <SkeletonBlock
      width={width}
      height="38px"
      borderRadius="var(--border-radius-md)"
      style={style}
    />
  );
};

SkeletonBlock.Input = function SkeletonInput({ style = {} }) {
  return (
    <SkeletonBlock
      width="100%"
      height="38px"
      borderRadius="var(--border-radius-md)"
      style={style}
    />
  );
};

SkeletonBlock.TimetableCell = function SkeletonTimetableCell({ style = {} }) {
  return (
    <SkeletonBlock
      width="100%"
      height="36px"
      borderRadius="4px"
      style={style}
    />
  );
};

export default SkeletonBlock;