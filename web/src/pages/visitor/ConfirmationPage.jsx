import React from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../../components/shared/Icon';

export default function ConfirmationPage() {
  const { state } = useLocation();
  const { visitor_name, flat_number, expected_date } = state || {};

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.checkmark}><Icon name="check" size={64} color="var(--color-approved)" /></div>
        <h1 style={styles.title}>You're All Set!</h1>
        <p style={styles.message}>
          Your details have been submitted. Please show this confirmation to the guard when you arrive at Utsav City.
        </p>

        {visitor_name && (
          <div style={styles.detailsBox}>
            <DetailRow label="Name" value={visitor_name} />
            {flat_number && <DetailRow label="Flat" value={flat_number} />}
            {expected_date && <DetailRow label="Expected Date" value={expected_date} />}
          </div>
        )}

        <p style={styles.footer}>
          Utsav City Visitor Management System
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--color-bg)' },
  card: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 40, maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' },
  checkmark: { fontSize: 64, marginBottom: 16 },
  title: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 },
  message: { color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.6 },
  detailsBox: { background: 'var(--color-surface-elevated)', borderRadius: 8, padding: '0 16px', marginBottom: 24, textAlign: 'left' },
  footer: { color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 24 },
};
