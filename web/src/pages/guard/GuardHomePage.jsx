import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRealtime } from '../../hooks/useRealtime';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { supabase } from '../../services/supabase';
import { signOut } from '../../hooks/useAuth';
import api from '../../services/api';
import Icon from '../../components/shared/Icon';

export default function GuardHomePage() {
  const navigate = useNavigate();
  const { name } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [expected, setExpected] = useState([]);
  const { status: pushStatus, subscribe } = usePushNotifications();

  // Initial pending count via RLS (guards can read visitors directly)
  const refreshCount = useCallback(async () => {
    const { count } = await supabase
      .from('visitors')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingCount(count || 0);
  }, []);

  // Visitors a resident has invited but who haven't arrived yet
  const refreshExpected = useCallback(async () => {
    try {
      const res = await api.get('/api/guards/expected-visitors');
      setExpected(res.data.data || []);
    } catch {}
  }, []);

  useEffect(() => { refreshCount(); refreshExpected(); }, [refreshCount, refreshExpected]);

  // Live updates: visitor changes refresh the count; new invites refresh the expected list
  useRealtime('visitors', '*', refreshCount);
  useRealtime('pre_registrations', '*', refreshExpected);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.building}>Utsav City</h1>
          <p style={styles.guardName}>Guard{name ? `: ${name}` : ''}</p>
          <p style={styles.onDuty}><span style={styles.dutyDot} />On Duty</p>
        </div>
        <button className="btn-inline" onClick={() => signOut().then(() => navigate('/login'))} style={styles.signOut}>Sign out</button>
      </header>

      {pendingCount > 0 && (
        <div className="pulse" style={styles.pendingBanner} onClick={() => navigate('/guard/new-visitor')}>
          <Icon name="alert" size={20} color="#B45309" />
          <span>{pendingCount} Awaiting Action</span>
        </div>
      )}

      {pushStatus !== 'subscribed' && pushStatus !== 'unsupported' && (
        <button onClick={subscribe} style={styles.enablePush}>
          <Icon name="bell" size={16} /> Enable notifications
        </button>
      )}

      <button style={styles.primaryBtn} onClick={() => navigate('/guard/new-visitor')}>
        <Icon name="plus" size={22} color="#fff" /> New Visitor
      </button>

      <div style={styles.grid}>
        <Tile icon="package" label="Log Delivery" onClick={() => navigate('/guard/delivery')} />
        <Tile icon="exit" label="Mark Exit" onClick={() => navigate('/guard/exit')} />
        <Tile icon="user" label="Residents" onClick={() => navigate('/guard/residents')} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHead}>
          <Icon name="users" size={16} color="var(--color-text-secondary)" />
          <h3 style={styles.sectionTitle}>Expected Visitors</h3>
        </div>
        {expected.length === 0 ? (
          <div style={styles.emptyState}>No expected visitors right now.</div>
        ) : (
          expected.map(e => (
            <div key={e.id} className="card" style={styles.expectedCard} onClick={() => navigate('/guard/new-visitor')}>
              <div style={styles.expectedAvatar}><Icon name="user" size={20} color="var(--color-primary)" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.expectedName}>{e.visitor_name}</div>
                <div style={styles.expectedMeta}>Flat {e.flats?.flat_number || '?'} · {whenLabel(e)}</div>
              </div>
              <div style={styles.expectedPhone}>{e.visitor_phone}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// "Today, 6:30 PM" / "Today" / "12 Jun" depending on what the resident set
function whenLabel(e) {
  const istToday = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  const dayPart = e.expected_date === istToday
    ? 'Today'
    : new Date(e.expected_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (!e.expected_time) return dayPart;
  const [h, m] = e.expected_time.split(':');
  const hr = ((+h + 11) % 12) + 1;
  const ampm = +h < 12 ? 'AM' : 'PM';
  return `${dayPart}, ${hr}:${m} ${ampm}`;
}

function Tile({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={styles.tile}>
      <span style={styles.tileIcon}><Icon name={icon} size={24} color="var(--color-primary)" /></span>
      <span style={styles.tileLabel}>{label}</span>
    </button>
  );
}

const styles = {
  page: { padding: 16, display: 'flex', flexDirection: 'column', gap: 14 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 12, borderBottom: '1px solid var(--color-border)' },
  building: { fontSize: 24, fontWeight: 700 },
  guardName: { fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 },
  onDuty: { fontSize: 13, color: 'var(--color-approved)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 },
  dutyDot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--color-approved)', display: 'inline-block' },
  signOut: { background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 13, padding: '6px 10px', border: '1px solid var(--color-border)' },
  pendingBanner: {
    background: 'rgba(245,158,11,0.14)', borderLeft: '4px solid var(--color-pending)',
    borderRadius: 8, padding: 14, fontSize: 16, fontWeight: 600, color: '#B45309', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  enablePush: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 14, maxWidth: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtn: {
    height: 64, borderRadius: 12, fontSize: 17, fontWeight: 600, maxWidth: '100%',
    background: 'var(--color-primary)', color: '#fff', border: 'none', boxShadow: 'var(--shadow-card)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  tile: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12,
    boxShadow: 'var(--shadow-card)', padding: '18px 12px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 96, maxWidth: '100%',
  },
  tileIcon: { width: 44, height: 44, borderRadius: 10, background: 'rgba(79,142,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' },
  section: { marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 },
  sectionHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' },
  expectedCard: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 12 },
  expectedAvatar: { width: 40, height: 40, borderRadius: '50%', background: 'rgba(79,142,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  expectedName: { fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  expectedMeta: { fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 },
  expectedPhone: { fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', flexShrink: 0 },
  emptyState: { padding: '18px 16px', textAlign: 'center', fontSize: 14, color: 'var(--color-text-secondary)', background: 'var(--color-surface)', border: '1px dashed var(--color-border)', borderRadius: 12 },
};
