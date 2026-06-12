import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';

export default function RemovalLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/removal-logs')
      .then(r => setLogs(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h1 style={styles.pageTitle}>Tenant Removal Logs</h1>
      <p style={styles.subtitle}>Audit trail of all tenant removals. Read-only.</p>

      {loading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Tenant Name</th>
                <th>Flat</th>
                <th>Removed By</th>
                <th>Reason</th>
                <th>Date & Time</th>
                <th>Admin Notified</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td>{l.removed_user_name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{l.flats?.flat_number || 'N/A'}</td>
                  <td>{l.guards?.name || 'N/A'}</td>
                  <td style={{ color: 'var(--color-text-secondary)', maxWidth: 200 }}>{l.removal_reason || 'N/A'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    {new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td>
                    <span className={`badge badge-${l.admin_notified ? 'approved' : 'pending'}`}>
                      {l.admin_notified ? 'Yes' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 32 }}>No removals recorded.</td></tr>
              )}
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
};
