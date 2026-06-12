import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Icon from '../../components/shared/Icon';

export default function ApprovalPage() {
  const { visitorId } = useParams();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [done, setDone] = useState(null); // 'approved' | 'denied'
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/residents/pending')
      .then(res => setVisitor((res.data.data || []).find(v => v.id === visitorId) || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visitorId]);

  async function act(action) {
    if (action === 'deny' && !window.confirm('Deny entry to this visitor?')) return;
    setActing(true);
    setError('');
    try {
      await api.post(`/api/residents/${visitorId}/${action}`);
      setDone(action === 'approve' ? 'approved' : 'denied');
    } catch (err) {
      setError(err.response?.data?.error?.message || `Failed to ${action}.`);
    }
    setActing(false);
  }

  if (loading) return <Center>Loading...</Center>;

  if (done) {
    const approved = done === 'approved';
    return (
      <Center>
        <Icon name={approved ? 'check' : 'x'} size={64} color={approved ? 'var(--color-approved)' : 'var(--color-rejected)'} />
        <h2 style={{ fontSize: 24, color: approved ? '#15803D' : '#B91C1C' }}>
          {approved ? 'Entry Allowed' : 'Entry Denied'}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
          The guard has been notified{approved ? '.' : ' to turn away the visitor.'}
        </p>
        <button onClick={() => navigate('/resident')} style={styles.primaryBtn}>Done</button>
      </Center>
    );
  }

  if (!visitor) return <Center>Visitor not found or already processed.</Center>;

  const arrivedAt = visitor.created_at
    ? new Date(visitor.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Visitor at the Gate</h2>
      {visitor.photo_url && <img src={visitor.photo_url} alt={visitor.name} style={styles.photo} />}
      <h3 style={styles.name}>{visitor.name}</h3>
      <p style={styles.meta}>Purpose: {visitor.purpose}</p>
      <p style={styles.meta}>Arrived: {arrivedAt}</p>

      {error && <p style={{ color: 'var(--color-rejected)', fontSize: 14 }}>{error}</p>}

      <div style={styles.actions}>
        <button onClick={() => act('approve')} disabled={acting} style={{ ...styles.bigBtn, background: 'var(--color-approved)' }}>
          <Icon name="check" size={20} color="#fff" /> Allow
        </button>
        <button onClick={() => act('deny')} disabled={acting} style={{ ...styles.bigBtn, background: 'var(--color-rejected)' }}>
          <Icon name="x" size={20} color="#fff" /> Deny
        </button>
      </div>
    </div>
  );
}

function Center({ children }) {
  return <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, color: 'var(--color-text-secondary)' }}>{children}</div>;
}

const styles = {
  page: { padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  title: { fontSize: 20, fontWeight: 700 },
  photo: { width: 180, height: 180, objectFit: 'cover', borderRadius: 12, boxShadow: 'var(--shadow-card)' },
  name: { fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)' },
  meta: { fontSize: 15, color: 'var(--color-text-secondary)' },
  actions: { width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 },
  bigBtn: { height: 64, color: '#fff', fontSize: 18, fontWeight: 600, maxWidth: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtn: { background: 'var(--color-primary)', color: '#fff' },
};
