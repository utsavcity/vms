import React, { useState } from 'react';
import api from '../../services/api';

// Family head only (router doesn't restrict, backend enforces).
// Members added in this session appear in the list; the API has no
// list-members endpoint (same behavior as the mobile app).
export default function FamilyManagementPage() {
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  async function addMember(e) {
    e.preventDefault();
    if (!/^\+91[6-9]\d{9}$/.test(form.phone)) { setError('Phone format: +91XXXXXXXXXX'); return; }
    setError('');
    setAdding(true);
    try {
      const res = await api.post('/api/residents/family', { name: form.name, phone: form.phone });
      setMembers(prev => [...prev, res.data.data]);
      setForm({ name: '', phone: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add member.');
    }
    setAdding(false);
  }

  async function removeMember(member) {
    if (!window.confirm(`Remove ${member.name} from the family?`)) return;
    try {
      await api.delete(`/api/residents/family/${member.id}`);
      setMembers(prev => prev.filter(m => m.id !== member.id));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to remove.');
    }
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Manage Family</h2>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
        New members get a WhatsApp invite and can log in with their phone number.
      </p>

      {members.map(m => (
        <div key={m.id} className="card" style={styles.memberRow}>
          <div>
            <div style={{ fontWeight: 600 }}>{m.name}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{m.phone}</div>
          </div>
          <button className="btn-inline" onClick={() => removeMember(m)} style={styles.removeBtn}>Remove</button>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={addMember} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" required autoFocus />
          <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" required />
          {error && <p style={{ color: 'var(--color-rejected)', fontSize: 14 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-inline" onClick={() => setShowForm(false)} style={{ flex: 1, background: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button type="submit" className="btn-inline" disabled={adding} style={{ flex: 1, background: 'var(--color-primary)', color: '#fff' }}>
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} style={styles.primaryBtn}>+ Add Member</button>
      )}
    </div>
  );
}

const styles = {
  page: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  title: { fontSize: 20, fontWeight: 700 },
  memberRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  removeBtn: { background: 'rgba(239,68,68,0.1)', color: 'var(--color-rejected)', fontSize: 13, padding: '6px 14px' },
  primaryBtn: { background: 'var(--color-primary)', color: '#fff', height: 52 },
};
