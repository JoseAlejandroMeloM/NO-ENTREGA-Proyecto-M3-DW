import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, post, setUnauthorizedHandler, tokenStore } from '../api/client';
import type { AuthResponse, Session } from '../types/auth';
import { AuthContext, type AuthState } from './auth-context';


export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => tokenStore.get() !== null);

  const logout = useCallback(() => {
    tokenStore.clear();
    setSession(null);
  }, []);

  const start = useCallback((res: AuthResponse) => {
    tokenStore.set(res.accessToken);
    const next = { user: res.user, organization: res.organization };
    setSession(next);
    return next;
  }, []);

  // Restore the session after a reload; an expired token simply logs the user out.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    api<Session>('/auth/me')
      .then(setSession)
      .catch(logout)
      .finally(() => setLoading(false));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      loading,
      logout,
      login: (email, password) => post<AuthResponse>('/auth/login', { email, password }).then(start),
      register: (kind, data) => post<AuthResponse>(`/auth/register-${kind}`, data).then(start),
    }),
    [session, loading, logout, start],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
