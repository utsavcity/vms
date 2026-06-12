import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Icon from '../../components/shared/Icon';

export default function LogDeliveryPage() {
  const navigate = useNavigate();
  const [flats, setFlats] = useState([]);
  const [flatSearch, setFlatSearch] = useState('');
  const [flatId, setFlatId] = useState(null);
  const [flatLabel, setFlatLabel] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/flats').then(r => setFlats(r.data.data || [])).catch(() => {});
  }, []);

  const filtered = flats.filter(f => f.flat_number.toLowerCase().includes(flatSearch.toLowerCase()));

  async function submit() {
    if (!flatId) { setError('Please select a flat.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/api/delivery', { flat_id: flatId, note });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to log delivery.');
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div style={styles.success}>
        <Icon name="check" size={64} color="var(--color-approved)" />
        <h2 style={{ fontSize: 24, color: '#15803D' }}>Resident Notified</h2>
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>Flat {flatLabel} has been notified about the delivery.</p>
        <button onClick={() => navigate('/guard')} style={styles.primaryBtn}>Back to Home</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Log Delivery</h2>

      <label style={styles.label}>Flat Number</label>
      <input value={flatSearch} onChange={e => { setFlatSearch(e.target.value); setFlatId(null); }} placeholder="Search flat..." autoFocus />
      {flatSearch && !flatId && (
        <div style={styles.dropdown}>
          {filtered.slice(0, 8).map(f => (
            <div key={f.id} style={styles.dropdownItem} onClick={() => { setFlatId(f.id); setFlatLabel(f.flat_number); setFlatSearch(f.flat_number); }}>
              {f.flat_number}
            </div>
          ))}
        </div>
      )}

      <label style={styles.label}>Note (optional)</label>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Package type, courier name, etc." rows={3} />

      {error && <p style={{ color: 'var(--color-rejected)', fontSize: 14 }}>{error}</p>}

      <button onClick={submit} disabled={loading} style={{ ...styles.primaryBtn, height: 64, marginTop: 8 }}>
        {loading ? 'Notifying...' : 'Notify Resident'}
      </button>
    </div>
  );
}

const styles = {
  page: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  title: { fontSize: 20, fontWeight: 700 },
  label: { fontSize: 13, color: 'var(--color-text-secondary)' },
  dropdown: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' },
  dropdownItem: { padding: '12px 16px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', fontFamily: 'var(--font-mono)' },
  primaryBtn: { background: 'var(--color-primary)', color: '#fff', height: 52 },
  success: { minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
};
