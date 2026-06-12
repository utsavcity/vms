import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import Icon from '../shared/Icon';

const NAV = [
  { path: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
  { path: '/admin/guards', label: 'Guards', icon: 'shield' },
  { path: '/admin/flats', label: 'Flats', icon: 'building' },
  { path: '/admin/removal-logs', label: 'Removal Logs', icon: 'clipboard' },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    localStorage.removeItem('utsav_admin_token');
    navigate('/admin/login');
  }

  return (
    <div className="admin-layout" style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.brandName}>Utsav City</span>
          <span style={styles.brandRole}>Admin</span>
        </div>
        <nav style={styles.nav}>
          {NAV.map(n => {
            const active = n.exact ? location.pathname === n.path : location.pathname.startsWith(n.path);
            return (
              <Link
                key={n.path}
                to={n.path}
                style={{ ...styles.navLink, ...(active ? styles.navLinkActive : {}) }}
              >
                <Icon name={n.icon} size={18} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={handleSignOut} style={styles.signOutBtn}>Sign Out</button>
      </aside>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  shell: { display: 'flex', minHeight: '100vh' },
  sidebar: { width: 220, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', padding: '24px 0' },
  brand: { padding: '0 20px 24px', borderBottom: '1px solid var(--color-border)', marginBottom: 16 },
  brandName: { display: 'block', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' },
  brandRole: { fontSize: 12, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' },
  navLink: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--color-text-secondary)', fontSize: 14, textDecoration: 'none', transition: 'background 150ms' },
  navLinkActive: { background: 'rgba(79,142,247,0.15)', color: 'var(--color-primary)' },
  main: { flex: 1, padding: 32, overflow: 'auto' },
  signOutBtn: { margin: '0 12px', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 14, padding: '10px 12px', textAlign: 'left', borderRadius: 8, border: '1px solid var(--color-border)' },
};
