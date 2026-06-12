import React from 'react';

export default function StatsCard({ label, value, accent }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      padding: '20px 24px',
      borderTop: `3px solid ${accent || 'var(--color-primary)'}`,
    }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: accent || 'var(--color-text-primary)' }}>
        {value ?? '0'}
      </p>
    </div>
  );
}
