/**
 * AttendAI AuthContext Instance Definition
 * Milestone 8.4: AttendAI Login, AuthContext & Session Management
 */

import { createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  role: null,
  isApproved: false,
  loading: true,
  profileLoading: false,
  profileError: null,
  isAuthenticated: false,
  logout: async () => {},
  setAuthSession: () => {},
  refreshProfile: async () => {},
});

export default AuthContext;

