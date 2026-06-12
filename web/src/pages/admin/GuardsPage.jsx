import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import PhoneInput from '../../components/shared/PhoneInput';

export default function GuardsPage() {
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadGuards(); }, []);

  async function loadGuards() {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/guards');
      setGuards(r.data.data || []);
    } catch {}
    setLoading(false);
  }

  async function addGuard(e) {
    e.preventDefault();
    if (!newName.trim()) { setError('Name is required.'); return; }
    if (!/^\+91[6-9]\d{9}$/.test(newPhone)) { setError('Enter a valid 10-digit mobile number.'); return; }
    setAdding(true);
    setError('');
    try {
      await api.post('/api/admin/guards', { name: newName, phone: newPhone });
      setShowModal(false);
      setNewName('');
      setNewPhone('');
      loadGuards();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add guard.');
    }
    setAdding(false);
  }

  async function deactivateGuard(id, name) {
    if (!window.confirm(`Deactivate guard ${name}? This will revoke their access.`)) return;
    try {
      await api.put(`/api/admin/guards/${id}/deactivate`);
      loadGuards();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to deactivate.');
    }
  }

  return (
    <AdminLayout>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Guards</h1>
        <button onClick={() => setShowModal(true)} style={{ background: 'var(--color-primary)', color: '#fff' }}>
          + Add Guard
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {guards.map(g => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{g.phone}</td>
                  <td>
                    <span className={`badge badge-${g.is_active ? 'approved' : 'rejected'}`}>
                      {g.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(g.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    {g.is_active && (
                      <button onClick={() => deactivateGuard(g.id, g.name)} style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-rejected)', fontSize: 13, padding: '6px 12px' }}>
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {guards.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 32 }}>No guards registered yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={styles.overlay}>
          <div className="card" style={{ width: 380 }}>
            <h2 style={{ marginBottom: 24, fontSize: 20 }}>Add New Guard</h2>
            <form onSubmit={addGuard} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={styles.label}>Full Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Guard name" required autoFocus />
              </div>
              <div>
                <label style={styles.label}>Phone</label>
                <PhoneInput value={newPhone} onChange={setNewPhone} required />
              </div>
              {error && <p style={{ color: 'var(--color-rejected)', fontSize: 13 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, background: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' }}>Cancel</button>
                <button type="submit" disabled={adding} style={{ flex: 1, background: 'var(--color-primary)', color: '#fff' }}>
                  {adding ? 'Adding...' : 'Add Guard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 },
  label: { display: 'block', color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 6 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
};
