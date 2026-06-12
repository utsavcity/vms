import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn, homeForRole } from '../hooks/useAuth';

// Guard + resident login (phone + password). Admins use /admin/login (email).
export default function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { role } = await signIn(phone, password);
      navigate(homeForRole(role), { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Check your phone number and password.');
    }
    setLoading(false);
  }

  return (
    <div className="app-shell" style={styles.container}>
      <h1 style={styles.logo}>Utsav City</h1>
      <p style={styles.subtitle}>Visitor Management System</p>

      <form onSubmit={handleLogin} style={styles.form}>
        <div>
          <label style={styles.label}>Phone or Email</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210 or you@email.com" autoComplete="username" required autoFocus />
        </div>
        <div>
          <label style={styles.label}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <Link to="/forgot-password" style={styles.adminLink}>Forgot password?</Link>
      <Link to="/admin/login" style={styles.adminLink}>Admin? Sign in here</Link>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 4 },
  logo: { fontSize: 32, fontWeight: 700, color: 'var(--color-text-primary)' },
  subtitle: { fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 32 },
  form: { width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 },
  label: { display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 },
  error: { color: 'var(--color-rejected)', fontSize: 14, padding: '10px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 },
  button: { background: 'var(--color-primary)', color: '#fff', height: 52, marginTop: 8 },
  adminLink: { marginTop: 24, fontSize: 13, color: 'var(--color-text-secondary)' },
};
