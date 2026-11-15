import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/auth';

interface Props {
  roles?: Role[];
  children: ReactNode;
}

/**
 * Hides pages the user cannot see. This is UX only: every API endpoint
 * enforces the same roles on the server.
 */
export default function ProtectedRoute({ roles, children }: Props) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="p-8 text-center text-slate-500">Loading…</p>;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(session.user.role)) return <Navigate to="/forbidden" replace />;
  return <>{children}</>;
}
