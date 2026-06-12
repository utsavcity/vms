import React, { useState } from 'react';
import api from '../../services/api';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const CHANNELS = [
  { key: 'whatsapp', label: 'WhatsApp', description: 'Get notified via WhatsApp message' },
  { key: 'sms', label: 'SMS', description: 'Get notified via SMS text message' },
  { key: 'in_app', label: 'In-App', description: 'Push notification in this app (recommended)' },
];

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState({ whatsapp: false, sms: false, in_app: true });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { supported, status, subscribe } = usePushNotifications();

  function toggle(key) { setPrefs(prev => ({ ...prev, [key]: !prev[key] })); }

  async function save() {
    const selected = Object.entries(prefs).filter(([, v]) => v).map(([k]) => k);
    if (!selected.length) { setMessage('Enable at least one channel.'); return; }
    setSaving(true);
    setMessage('');
    try {
      await api.put('/api/residents/notifications', { preferences: selected });
      // In-app on the web means Web Push — make sure the browser is subscribed
      if (prefs.in_app && supported && status !== 'subscribed') await subscribe();
      setMessage('Preferences saved.');
    } catch (err) {
      setMessage(err.response?.data?.error?.message || 'Failed to save.');
    }
    setSaving(false);
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Notification Settings</h2>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
        Choose how you want to be notified when a visitor arrives at the gate.
      </p>

      {CHANNELS.map(ch => (
        <label key={ch.key} className="card" style={styles.row}>
          <div>
            <div style={{ fontWeight: 600 }}>{ch.label}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{ch.description}</div>
          </div>
          <input
            type="checkbox"
            checked={prefs[ch.key]}
            onChange={() => toggle(ch.key)}
            style={{ width: 22, height: 22, accentColor: 'var(--color-primary)', flexShrink: 0 }}
          />
        </label>
      ))}

      {status === 'denied' && (
        <p style={{ fontSize: 13, color: 'var(--color-pending)' }}>
          Browser notifications are blocked. Enable them in your browser settings for in-app alerts.
        </p>
      )}
      {message && <p style={{ fontSize: 14, color: message.includes('saved') ? '#15803D' : 'var(--color-rejected)' }}>{message}</p>}

      <button onClick={save} disabled={saving} style={styles.primaryBtn}>
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
}

const styles = {
  page: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  title: { fontSize: 20, fontWeight: 700 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, cursor: 'pointer' },
  primaryBtn: { background: 'var(--color-primary)', color: '#fff', height: 52, marginTop: 8 },
};
