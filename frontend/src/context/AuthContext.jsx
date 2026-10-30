/**
 * AttendAI Centralized Authentication Context
 * Milestone 8.4: AttendAI Login, AuthContext & Session Management
 *
 * Provides reactive authentication state across the application:
 * - user, session, loading, isAuthenticated, logout
 * - Session restoration on app start
 * - Subscription to Supabase auth state events
 * - Graceful handling of unconfigured or offline scenarios
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSession, onAuthStateChange, logoutUser } from '../services/authService';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Restore initial session on application mount
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const { session: initialSession, error } = await getSession();
        if (isMounted) {
          if (!error && initialSession) {
            setSession(initialSession);
            setUser(initialSession.user ?? null);
          } else {
            setSession(null);
            setUser(null);
          }
        }
      } catch {
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen to Supabase auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED)
    const { unsubscribe } = onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user ?? null);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Update session directly (e.g., immediately after login or registration)
  const setAuthSession = useCallback((newSession) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);
    setLoading(false);
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutUser();
      setSession(null);
      setUser(null);
    } catch {
      // Clear local state even if network call fails
      setSession(null);
      setUser(null);
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: Boolean(session && user),
      logout,
      setAuthSession,
    }),
    [user, session, loading, logout, setAuthSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
