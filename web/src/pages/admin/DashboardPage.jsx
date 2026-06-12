import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import StatsCard from '../../components/admin/StatsCard';
import api from '../../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/dashboard')
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h1 style={styles.pageTitle}>Dashboard</h1>
      <p style={styles.pageSubtitle}>Visitor activity overview. Counts only, no personal data.</p>

      {loading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading stats...</p>
      ) : (
        <div style={styles.grid}>
          <StatsCard label="Visitors Today" value={stats?.visitors_today} accent="var(--color-primary)" />
          <StatsCard label="Visitors This Week" value={stats?.visitors_this_week} />
          <StatsCard label="Visitors This Month" value={stats?.visitors_this_month} />
          <StatsCard label="Currently Inside" value={stats?.visitors_inside_now} accent="var(--color-approved)" />
          <StatsCard label="Deliveries Today" value={stats?.deliveries_today} accent="var(--color-pending)" />
          <StatsCard label="Active Guards" value={stats?.active_guards} />
        </div>
      )}
    </AdminLayout>
  );
}

const styles = {
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 4 },
  pageSubtitle: { color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 32 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 },
};
