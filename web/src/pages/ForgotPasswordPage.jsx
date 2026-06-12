import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';

// Self-serve reset for accounts with an email (admins, and any resident
// created with one). Phone-only accounts need an admin reset in Supabase.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) setError(err.message);
    else setSent(true);
    setLoading(false);
  }

  return (
    <div className="app-shell" style={styles.container}>
      <h1 style={styles.logo}>Reset Password</h1>

      {sent ? (
        <div style={styles.form}>
          <p style={styles.info}>
            If an account exists for <strong>{email}</strong>, a reset link has been sent.
            Open the email and follow the link to set a new password.
          </p>
          <Link to="/login" style={styles.link}>Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <p style={styles.info}>
            Enter the email on your account and we will send you a reset link.
            If your account uses only a phone number, contact your building admin to reset it.
          </p>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required autoFocus />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <Link to="/login" style={styles.link}>Back to sign in</Link>
        </form>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  logo: { fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)' },
  form: { width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 },
  info: { fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 },
  error: { color: 'var(--color-rejected)', fontSize: 14 },
  button: { background: 'var(--color-primary)', color: '#fff', height: 52 },
  link: { fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center' },
};
