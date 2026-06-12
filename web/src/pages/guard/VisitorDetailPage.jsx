import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { supabase } from '../../services/supabase';
import { useVisitorWatch } from '../../hooks/useRealtime';
import Icon from '../../components/shared/Icon';

const STATUS = {
  pending: { label: 'Waiting for resident approval', icon: 'alert', color: 'var(--color-pending)', bg: 'rgba(245,158,11,0.14)', text: '#B45309' },
  approved: { label: 'Approved. Let them in.', icon: 'check', color: 'var(--color-approved)', bg: 'rgba(34,197,94,0.12)', text: '#15803D' },
  rejected: { label: 'Resident denied. Turn away.', icon: 'x', color: 'var(--color-rejected)', bg: 'rgba(239,68,68,0.1)', text: '#B91C1C' },
  exited: { label: 'Visitor has exited', icon: 'exit', color: 'var(--color-border)', bg: 'var(--color-surface-elevated)', text: 'var(--color-text-secondary)' },
};

export default function VisitorDetailPage() {
  const { visitorId } = useParams();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Guards can read visitors directly via RLS — fetch full record with flat
    supabase
      .from('visitors')
      .select('id, name, phone, purpose, photo_url, status, flats(flat_number)')
      .eq('id', visitorId)
      .single()
      .then(({ data }) => { setVisitor(data); setLoading(false); });
  }, [visitorId]);

  // Real-time status updates (resident approving/denying)
  useVisitorWatch(visitorId, (updated) => setVisitor(prev => ({ ...prev, ...updated })));

  async function act(action) {
    const verb = action === 'approve' ? 'Approve entry for' : 'Reject';
    if (!window.confirm(`${verb} ${visitor?.name}?`)) return;
    setActing(true);
    setError('');
    try {
      await api.put(`/api/visitors/${visitorId}/${action}`);
      setVisitor(prev => ({ ...prev, status: action === 'approve' ? 'approved' : 'rejected' }));
    } catch (err) {
      setError(err.response?.data?.error?.message || `Failed to ${action}.`);
    }
    setActing(false);
  }

  if (loading) return <div style={styles.center}>Loading...</div>;
  if (!visitor) return <div style={styles.center}>Visitor not found.</div>;

  const s = STATUS[visitor.status] || STATUS.pending;

  return (
    <div style={styles.page}>
      {visitor.photo_url && <img src={visitor.photo_url} alt={visitor.name} style={styles.photo} />}
      <h2 style={styles.name}>{visitor.name}</h2>
      <p style={styles.meta}>Flat {visitor.flats?.flat_number} • {visitor.purpose}</p>
      <p style={styles.metaRow}><Icon name="phone" size={15} color="var(--color-text-secondary)" /> {visitor.phone}</p>

      <div className={visitor.status === 'pending' ? 'pulse' : ''} style={{ ...styles.statusBox, background: s.bg, borderColor: s.color, color: s.text }}>
        <Icon name={s.icon} size={20} color={s.text} />
        <span>{s.label}</span>
      </div>

      {error && <p style={{ color: 'var(--color-rejected)', fontSize: 14 }}>{error}</p>}

      {visitor.status === 'pending' && (
        <div style={styles.actions}>
          <button onClick={() => act('approve')} disabled={acting} style={{ ...styles.bigBtn, background: 'var(--color-approved)' }}>
            <Icon name="check" size={20} color="#fff" /> Approve Entry
          </button>
          <button onClick={() => act('reject')} disabled={acting} style={{ ...styles.bigBtn, background: 'var(--color-rejected)' }}>
            <Icon name="x" size={20} color="#fff" /> Reject
          </button>
        </div>
      )}

      <button onClick={() => navigate('/guard')} style={styles.backBtn}>Back to Home</button>
    </div>
  );
}

const styles = {
  page: { padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  center: { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' },
  photo: { width: 180, height: 180, objectFit: 'cover', borderRadius: 12, boxShadow: 'var(--shadow-card)' },
  name: { fontSize: 26, fontWeight: 700 },
  meta: { fontSize: 15, color: 'var(--color-text-secondary)' },
  metaRow: { fontSize: 15, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 },
  statusBox: { width: '100%', borderRadius: 8, border: '2px solid', padding: 16, textAlign: 'center', fontSize: 18, fontWeight: 600, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  actions: { width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 },
  bigBtn: { height: 64, color: '#fff', fontSize: 18, fontWeight: 600, maxWidth: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  backBtn: { background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', marginTop: 8 },
};
