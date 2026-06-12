import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRealtime } from '../../hooks/useRealtime';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { supabase } from '../../services/supabase';
import { signOut } from '../../hooks/useAuth';
import Icon from '../../components/shared/Icon';

export default function GuardHomePage() {
  const navigate = useNavigate();
  const { name } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const { status: pushStatus, subscribe } = usePushNotifications();

  // Initial pending count via RLS (guards can read visitors directly)
  const refreshCount = useCallback(async () => {
    const { count } = await supabase
      .from('visitors')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingCount(count || 0);
  }, []);

  useEffect(() => { refreshCount(); }, [refreshCount]);

  // Live updates: any visitor insert/update can change the pending count
  useRealtime('visitors', '*', refreshCount);

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
    </div>
  );
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
};
