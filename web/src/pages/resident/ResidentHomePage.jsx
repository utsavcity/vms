import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, signOut } from '../../hooks/useAuth';
import { useRealtime } from '../../hooks/useRealtime';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import api from '../../services/api';
import Icon from '../../components/shared/Icon';

export default function ResidentHomePage() {
  const navigate = useNavigate();
  const { name, role } = useAuth();
  const [pending, setPending] = useState([]);
  const { status: pushStatus, subscribe } = usePushNotifications();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const fetchPending = useCallback(async () => {
    try {
      const res = await api.get('/api/residents/pending');
      setPending(res.data.data || []);
    } catch {}
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  // Same as mobile: refresh when a new in-app notification lands
  useRealtime('notifications', 'INSERT', fetchPending);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.greeting}>{greeting}, {name || 'Resident'}</h1>
        <button className="btn-inline" onClick={() => signOut().then(() => navigate('/login'))} style={styles.signOut}>Sign out</button>
      </header>

      {pending.length > 0 && (
        <div className="pulse" style={styles.pendingBadge} onClick={() => navigate(`/resident/approval/${pending[0].id}`)}>
          <Icon name="bell" size={18} color="#B91C1C" />
          <span>{pending.length} visitor{pending.length > 1 ? 's' : ''} waiting for approval. Tap to review.</span>
        </div>
      )}

      {pushStatus !== 'subscribed' && pushStatus !== 'unsupported' && (
        <button onClick={subscribe} style={styles.enablePush}>
          <Icon name="bell" size={16} /> Enable notifications so you never miss a visitor
        </button>
      )}

      <div style={styles.actions}>
        <ActionCard icon="mail" label="Invite Visitor" onClick={() => navigate('/resident/invite')} />
        {role === 'family_head' && <ActionCard icon="users" label="Manage Family" onClick={() => navigate('/resident/family')} />}
        <ActionCard icon="bell" label="Notification Settings" onClick={() => navigate('/resident/settings')} />
      </div>

      {pending.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h3 style={styles.sectionTitle}>Waiting at the gate</h3>
          {pending.map(v => (
            <div key={v.id} className="card" style={styles.pendingCard} onClick={() => navigate(`/resident/approval/${v.id}`)}>
              {v.photo_url && <img src={v.photo_url} alt="" style={styles.thumb} />}
              <div>
                <div style={{ fontWeight: 600 }}>{v.name}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{v.purpose}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionCard({ icon, label, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', minHeight: 64 }}>
      <span style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(79,142,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={22} color="var(--color-primary)" />
      </span>
      <span style={{ fontSize: 17, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

const styles = {
  page: { padding: 16, display: 'flex', flexDirection: 'column', gap: 16 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 12, borderBottom: '1px solid var(--color-border)' },
  greeting: { fontSize: 22, fontWeight: 700 },
  signOut: { background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 13, padding: '6px 10px', border: '1px solid var(--color-border)' },
  pendingBadge: {
    background: 'rgba(239,68,68,0.08)', borderLeft: '4px solid var(--color-rejected)',
    borderRadius: 8, padding: 16, fontSize: 15, fontWeight: 600, color: '#B91C1C', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  enablePush: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 14, maxWidth: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actions: { display: 'flex', flexDirection: 'column', gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 },
  pendingCard: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 8 },
  thumb: { width: 48, height: 48, borderRadius: 8, objectFit: 'cover' },
};
