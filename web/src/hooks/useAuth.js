import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

// Session + role from Supabase Auth. Role lives in user_metadata (same as mobile).
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const role = session?.user?.user_metadata?.role || null;
  const name = session?.user?.user_metadata?.name || '';

  return { session, role, name, loading };
}

// Accepts a phone number or an email — phone sign-in needs an SMS provider
// configured in Supabase, so email works as the fallback during setup.
export async function signIn(identifier, password) {
  const creds = identifier.includes('@') ? { email: identifier } : { phone: identifier };
  const { data, error } = await supabase.auth.signInWithPassword({ ...creds, password });
  if (error) throw error;
  return { user: data.user, role: data.user.user_metadata?.role || null };
}

export async function signOut() {
  await supabase.auth.signOut();
}

// Where each role lands after login
export function homeForRole(role) {
  if (role === 'guard') return '/guard';
  if (role === 'family_head' || role === 'member') return '/resident';
  if (role === 'admin' || role === 'chairman') return '/admin';
  return '/login';
}
