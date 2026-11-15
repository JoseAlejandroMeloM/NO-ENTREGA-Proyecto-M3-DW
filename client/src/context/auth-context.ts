import { createContext } from 'react';
import type { Session } from '../types/auth';

export interface AuthState {
  session: Session | null;
  /** True while a stored token is being checked on page load. */
  loading: boolean;
  login: (email: string, password: string) => Promise<Session>;
  register: (kind: 'store' | 'distributor', data: unknown) => Promise<Session>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);
