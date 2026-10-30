/**
 * AttendAI AuthContext Instance Definition
 * Milestone 8.4: AttendAI Login, AuthContext & Session Management
 */

import { createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  logout: async () => {},
  setAuthSession: () => {},
});

export default AuthContext;
