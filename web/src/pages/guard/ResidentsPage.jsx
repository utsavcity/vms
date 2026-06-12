import React, { useState } from 'react';
import api from '../../services/api';

export default function ResidentsPage() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function doSearch(q) {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await api.get(`/api/guards/residents?q=${encodeURIComponent(q)}`);
      setResults(res.data.data || []);
    } catch {}
    setLoading(false);
  }

  async function removeTenant(user, flatNumber) {
    const reason = window.prompt(`Remove ${user.name} from Flat ${flatNumber}?\n\nEnter the reason for removal:`);
    if (reason === null) return; // cancelled
    if (!reason.trim()) { alert('A reason is required.'); return; }
    try {
      await api.delete(`/api/guards/tenants/${user.id}`, { data: { reason } });
      alert(`${user.name} has been removed. Admin has been notified.`);
      doSearch(search);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to remove tenant.');
    }
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Residents</h2>
      <input value={search} onChange={e => doSearch(e.target.value)} placeholder="Search by flat number..." autoFocus />
      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Searching...</p>}

      {results.map(flat => (
        <div key={flat.id} className="card">
          <div style={styles.flatHeader}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 16 }}>{flat.flat_number}</span>
            <span className={`badge badge-${flat.is_occupied ? 'approved' : 'pending'}`}>
              {flat.is_occupied ? 'Occupied' : 'Vacant'}
            </span>
          </div>
          {(flat.users || []).filter(u => u.is_active).map(user => (
            <div key={user.id} style={styles.userRow}>
              <div>
                <div style={{ fontWeight: 500 }}>{user.name}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {user.phone} • {user.role === 'family_head' ? 'Head' : 'Member'}
                </div>
              </div>
              <button className="btn-inline" onClick={() => removeTenant(user, flat.flat_number)} style={styles.removeBtn}>
                Remove
              </button>
            </div>
          ))}
        </div>
      ))}

      {!loading && search.length > 1 && !results.length && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 16 }}>No results</p>
      )}
    </div>
  );
}

const styles = {
  page: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  title: { fontSize: 20, fontWeight: 700 },
  flatHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  userRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--color-border)' },
  removeBtn: { background: 'rgba(239,68,68,0.1)', color: 'var(--color-rejected)', fontSize: 13, padding: '6px 14px' },
};
