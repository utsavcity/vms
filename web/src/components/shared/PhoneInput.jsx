import React from 'react';

// Phone field with a fixed +91 prefix. The user types only the 10-digit number.
// `value` is the full E.164 string (+91XXXXXXXXXX); `onChange` receives the same.
// This keeps existing form state and the backend's /^\+91[6-9]\d{9}$/ validation intact.
export default function PhoneInput({ value, onChange, placeholder = '98765 43210', autoFocus, required }) {
  const local = (value || '').replace(/^\+91/, '').replace(/\D/g, '').slice(0, 10);

  function handle(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(digits ? '+91' + digits : '');
  }

  return (
    <div className="phone-input-wrap" style={styles.wrap}>
      <span style={styles.prefix}>+91</span>
      <input
        className="phone-input-field"
        type="tel"
        inputMode="numeric"
        value={local}
        onChange={handle}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
        maxLength={10}
        style={styles.input}
      />
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    alignItems: 'stretch',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-surface)',
    overflow: 'hidden',
  },
  prefix: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    background: 'var(--color-surface-elevated)',
    color: 'var(--color-text-secondary)',
    fontSize: 16,
    fontWeight: 500,
    borderRight: '1px solid var(--color-border)',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: 'none',
    borderRadius: 0,
    background: 'transparent',
    width: '100%',
  },
};
