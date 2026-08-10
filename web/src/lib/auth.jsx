import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, supabaseEnabled } from './supabase.js';
import { setToken, setDemoRole, getDemoRole } from './session.js';
import api from './api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const DEMO_NAMES = {
  admin: 'Anita Desai', principal: 'Dr. R. Kulkarni', teacher: 'Priya Sharma',
  accountant: 'Sanjay Mehta', librarian: 'Fatima Sheikh', parent: 'Rohan Gupta',
};

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState(null);
  const [role, setRoleState] = useState(getDemoRole());
  const [error, setError] = useState(null);

  const mode = supabaseEnabled ? 'supabase' : 'demo';

  // --- Supabase mode ---
  useEffect(() => {
    if (!supabaseEnabled) { setReady(true); return; }
    let sub;
    supabase.auth.getSession().then(async ({ data }) => {
      await applySession(data.session);
      setReady(true);
    });
    ({ data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      await applySession(session);
    }));
    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applySession(session) {
    setToken(session?.access_token || null);
    if (session?.user) {
      try {
        const me = await api.get('/auth/me');
        setProfile(me.profile);
        setRoleState(me.role || 'parent');
        setAuthenticated(true);
      } catch { setAuthenticated(false); }
    } else {
      setProfile(null);
      setAuthenticated(false);
    }
  }

  const signIn = useCallback(async (email, password) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); throw error; }
  }, []);

  const signUp = useCallback(async (email, password, fullName) => {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });
    if (error) { setError(error.message); throw error; }
  }, []);

  // --- Demo mode ---
  const [demoEntered, setDemoEntered] = useState(() => localStorage.getItem('wellspire.demoEntered') === '1');
  useEffect(() => { if (!supabaseEnabled) setReady(true); }, []);

  const enterDemo = useCallback((r) => {
    const chosen = r || 'admin';
    setDemoRole(chosen); setRoleState(chosen);
    setProfile({ role: chosen, full_name: DEMO_NAMES[chosen] || 'Demo User', email: 'demo@wellspire.school' });
    setDemoEntered(true); localStorage.setItem('wellspire.demoEntered', '1');
  }, []);

  const setRole = useCallback((r) => {
    setDemoRole(r); setRoleState(r);
    setProfile((p) => ({ ...(p || {}), role: r, full_name: DEMO_NAMES[r] || 'Demo User' }));
  }, []);

  const signOut = useCallback(async () => {
    if (supabaseEnabled) { await supabase.auth.signOut(); setToken(null); }
    else { setDemoEntered(false); localStorage.removeItem('wellspire.demoEntered'); }
    setAuthenticated(false); setProfile(null);
  }, []);

  const value = {
    ready, mode, error,
    authenticated: supabaseEnabled ? authenticated : demoEntered,
    profile, role,
    signIn, signUp, signOut, enterDemo, setRole,
    demoNames: DEMO_NAMES,
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
