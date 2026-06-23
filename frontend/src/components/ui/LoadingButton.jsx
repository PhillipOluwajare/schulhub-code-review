import React from 'react';

/**
 * LoadingButton — SchulHub UI primitive
 * 
 * Props:
 *   status:   'idle' | 'loading' | 'success' | 'error'
 *   onClick:  function
 *   children: button label (idle state)
 *   loadingText:  string (default: 'Laden...')
 *   successText:  string (default: 'Gespeichert')
 *   errorText:    string (default: 'Fehler — nochmal')
 *   disabled: boolean
 *   type:     'button' | 'submit' (default: 'button')
 *   style:    object (extra inline styles)
 *   className: string
 * 
 * Usage:
 *   const [status, setStatus] = useState('idle');
 *   <LoadingButton status={status} onClick={handleSave}>Speichern</LoadingButton>
 */

const styles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '38px',
    padding: '0 20px',
    borderRadius: 'var(--border-radius-md)',
    border: '0.5px solid var(--color-border-primary)',
    background: 'var(--color-background-secondary)',
    color: 'var(--color-text-primary)',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    transition: 'opacity 0.15s, border-color 0.15s, color 0.15s',
    outline: 'none',
    whiteSpace: 'nowrap',
  },
  loading: {
    opacity: 0.6,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  success: {
    borderColor: '#1D9E75',
    color: '#1D9E75',
  },
  error: {
    borderColor: '#E24B4A',
    color: '#E24B4A',
  },
  disabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
};

function Spinner() {
  return (
    <span
      style={{
        width: '13px',
        height: '13px',
        borderRadius: '50%',
        border: '1.5px solid currentColor',
        borderTopColor: 'transparent',
        display: 'inline-block',
        animation: 'schulhub-spin 0.6s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 5V7.5M7 9.5V10M1.5 12.5L7 2L12.5 12.5H1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LoadingButton({
  status = 'idle',
  onClick,
  children,
  loadingText = 'Laden...',
  successText = 'Gespeichert',
  errorText = 'Fehler — nochmal',
  disabled = false,
  type = 'button',
  style = {},
  className = '',
}) {
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const computedStyle = {
    ...styles.base,
    ...(isLoading ? styles.loading : {}),
    ...(isSuccess ? styles.success : {}),
    ...(isError ? styles.error : {}),
    ...(disabled && !isLoading ? styles.disabled : {}),
    ...style,
  };

  const label = isLoading
    ? loadingText
    : isSuccess
    ? successText
    : isError
    ? errorText
    : children;

  return (
    <>
      <style>{`@keyframes schulhub-spin { to { transform: rotate(360deg); } }`}</style>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || isLoading}
        style={computedStyle}
        className={className}
        aria-busy={isLoading}
      >
        {isLoading && <Spinner />}
        {isSuccess && <CheckIcon />}
        {isError && <AlertIcon />}
        {label}
      </button>
    </>
  );
}