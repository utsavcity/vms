import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw authErr;

      const role = data.user.user_metadata?.role;
      if (!['admin', 'chairman'].includes(role)) {
        await supabase.auth.signOut();
        throw new Error('Access restricted to administrators only.');
      }

      localStorage.setItem('utsav_admin_token', data.session.access_token);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }

    setLoading(false);
  }

  return (
    <div style={styles.container}>
      <div className="card" style={{ width: 380 }}>
        <h1 style={styles.title}>Utsav City</h1>
        <p style={styles.subtitle}>Admin Dashboard</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
          <div>
            <label style={styles.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <label style={styles.label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={{ background: 'var(--color-primary)', color: '#fff', height: 48, marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' },
  title: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, textAlign: 'center', color: 'var(--color-text-primary)' },
  subtitle: { textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 4 },
  label: { display: 'block', color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 6 },
  error: { color: 'var(--color-rejected)', fontSize: 14, padding: '10px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 },
};
