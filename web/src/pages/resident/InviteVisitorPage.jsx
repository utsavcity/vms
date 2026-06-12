import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Icon from '../../components/shared/Icon';
import PhoneInput from '../../components/shared/PhoneInput';

export default function InviteVisitorPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '' });
  const [known, setKnown] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function set(key, value) { setForm(prev => ({ ...prev, [key]: value })); }

  // Visitors who have come to this flat before — tap one to skip re-typing
  useEffect(() => {
    api.get('/api/residents/known-visitors').then(r => setKnown(r.data.data || [])).catch(() => {});
  }, []);

  async function sendInvite(e) {
    e.preventDefault();
    if (!/^\+91[6-9]\d{9}$/.test(form.phone)) { setError('Enter a valid 10-digit mobile number.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/api/preregistrations', {
        visitor_name: form.name,
        visitor_phone: form.phone,
        expected_date: form.date,
        expected_time: form.time || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to send invite.');
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div style={styles.success}>
        <Icon name="mail" size={64} color="var(--color-approved)" />
        <h2 style={{ fontSize: 24, color: '#15803D' }}>Invite Sent</h2>
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
          A WhatsApp link has been sent to {form.phone}.<br />
          Your visitor should fill in their details before arriving.
        </p>
        <button onClick={() => navigate('/resident')} style={styles.primaryBtn}>Done</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Invite Visitor</h2>

      {known.length > 0 && (
        <div style={styles.knownWrap}>
          <p style={styles.knownLabel}>Tap a previous visitor to auto-fill</p>
          <div style={styles.knownList}>
            {known.map(v => {
              const active = form.phone === v.phone;
              return (
                <button
                  key={v.phone}
                  type="button"
                  className="btn-inline"
                  onClick={() => setForm(p => ({ ...p, name: v.name, phone: v.phone }))}
                  style={{ ...styles.knownChip, ...(active ? styles.knownChipActive : {}) }}
                >
                  <Icon name="user" size={14} color={active ? '#fff' : 'var(--color-primary)'} />
                  <span>{v.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={sendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={styles.label}>Visitor Name</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" required autoFocus />

        <label style={styles.label}>Visitor Phone</label>
        <PhoneInput value={form.phone} onChange={v => set('phone', v)} required />

        <label style={styles.label}>Expected Date</label>
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />

        <label style={styles.label}>Expected Time (optional)</label>
        <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />

        {error && <p style={{ color: 'var(--color-rejected)', fontSize: 14 }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ ...styles.primaryBtn, height: 56, marginTop: 8 }}>
          {loading ? 'Sending...' : 'Send Invite'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  title: { fontSize: 20, fontWeight: 700 },
  label: { fontSize: 13, color: 'var(--color-text-secondary)' },
  primaryBtn: { background: 'var(--color-primary)', color: '#fff' },
  success: { minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  knownWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
  knownLabel: { fontSize: 13, color: 'var(--color-text-secondary)' },
  knownList: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  knownChip: { display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', padding: '8px 14px', borderRadius: 9999, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: 14 },
  knownChipActive: { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#fff' },
};
