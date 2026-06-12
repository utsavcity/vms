import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';

export default function FlatsPage() {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'occupied' | 'vacant'

  useEffect(() => {
    api.get('/api/admin/flats')
      .then(r => setFlats(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = flats.filter(f => {
    if (filter === 'occupied') return f.is_occupied;
    if (filter === 'vacant') return !f.is_occupied;
    return true;
  });

  const occupiedCount = flats.filter(f => f.is_occupied).length;

  return (
    <AdminLayout>
      <h1 style={styles.pageTitle}>Flats</h1>
      <p style={styles.subtitle}>{occupiedCount} / {flats.length} occupied</p>

      <div style={styles.filters}>
        {['all', 'occupied', 'vacant'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
              color: filter === f ? '#fff' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              fontSize: 14,
              padding: '8px 16px',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Floor</th>
                <th>Flat</th>
                <th>Status</th>
                <th>Residents</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td>Floor {f.floor_number}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{f.flat_number}</td>
                  <td>
                    <span className={`badge badge-${f.is_occupied ? 'approved' : 'pending'}`}>
                      {f.is_occupied ? 'Occupied' : 'Vacant'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>
                    {f.resident_count || 0} registered
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

const styles = {
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 4 },
  subtitle: { color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24 },
  filters: { display: 'flex', gap: 8, marginBottom: 20 },
};
