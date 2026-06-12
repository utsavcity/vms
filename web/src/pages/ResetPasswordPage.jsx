import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

// Landing page for the Supabase recovery link. The link signs the user in
// with a temporary recovery session; we just set the new password.
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message.includes('session') ? 'Reset link expired. Request a new one.' : err.message);
      setLoading(false);
      return;
    }
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell" style={styles.container}>
      <h1 style={styles.logo}>Set New Password</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" required autoFocus />
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password" required />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Saving...' : 'Save Password'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  logo: { fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)' },
  form: { width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 },
  error: { color: 'var(--color-rejected)', fontSize: 14 },
  button: { background: 'var(--color-primary)', color: '#fff', height: 52 },
};
