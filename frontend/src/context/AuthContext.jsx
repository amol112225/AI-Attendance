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
import {
  getSession,
  onAuthStateChange,
  logoutUser,
  getUserProfile,
  getTeacherRegistrationRequest,
} from '../services/authService';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [teacherRequest, setTeacherRequest] = useState(null);
  const [teacherRequestLoading, setTeacherRequestLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Helper to safely load profile for an authenticated user ID without throwing
  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return null;
    }
    setProfileLoading(true);
    setProfileError(null);
    try {
      const { profile: loadedProfile, error } = await getUserProfile(userId);
      if (!error && loadedProfile) {
        setProfile(loadedProfile);
        setProfileError(null);
        return loadedProfile;
      }
      // If query fails or profile row not found yet, keep profile null
      // while preserving session and user authentication
      setProfile(null);
      if (error) {
        setProfileError(error);
      }
      return null;
    } catch (err) {
      setProfile(null);
      setProfileError(err);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Helper to safely load teacher registration request status without throwing
  const loadTeacherRequest = useCallback(async (userId) => {
    if (!userId) {
      setTeacherRequest(null);
      setTeacherRequestLoading(false);
      return null;
    }
    setTeacherRequestLoading(true);
    try {
      const { request } = await getTeacherRegistrationRequest(userId);
      setTeacherRequest(request || null);
      return request || null;
    } catch {
      setTeacherRequest(null);
      return null;
    } finally {
      setTeacherRequestLoading(false);
    }
  }, []);

  // Restore initial session on application mount
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const { session: initialSession, error } = await getSession();
        if (isMounted) {
          if (!error && initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            await Promise.all([
              loadProfile(initialSession.user.id),
              loadTeacherRequest(initialSession.user.id),
            ]);
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
            setTeacherRequest(null);
          }
        }
      } catch {
        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setTeacherRequest(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen to Supabase auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED)
    const { unsubscribe } = onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        await Promise.all([
          loadProfile(currentSession.user.id),
          loadTeacherRequest(currentSession.user.id),
        ]);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setTeacherRequest(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [loadProfile, loadTeacherRequest]);

  // Update session directly (e.g., immediately after login or registration)
  const setAuthSession = useCallback(async (newSession) => {
    setSession(newSession);
    const currentUser = newSession?.user ?? null;
    setUser(currentUser);
    if (currentUser?.id) {
      await Promise.all([
        loadProfile(currentUser.id),
        loadTeacherRequest(currentUser.id),
      ]);
    } else {
      setProfile(null);
      setTeacherRequest(null);
    }
    setLoading(false);
  }, [loadProfile, loadTeacherRequest]);

  // Manual trigger to refresh profile data (e.g. after administrative role changes)
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      return await loadProfile(user.id);
    }
    return null;
  }, [user, loadProfile]);

  // Manual trigger to refresh teacher request data
  const refreshTeacherRequest = useCallback(async () => {
    if (user?.id) {
      return await loadTeacherRequest(user.id);
    }
    return null;
  }, [user, loadTeacherRequest]);

  // Logout handler
  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutUser();
      setSession(null);
      setUser(null);
      setProfile(null);
      setTeacherRequest(null);
    } catch {
      // Clear local state even if network call fails
      setSession(null);
      setUser(null);
      setProfile(null);
      setTeacherRequest(null);
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      role: profile?.role || null,
      isApproved: Boolean(profile?.is_approved),
      loading,
      profileLoading,
      profileError,
      teacherRequest,
      teacherRequestLoading,
      isAuthenticated: Boolean(session && user),
      logout,
      setAuthSession,
      refreshProfile,
      refreshTeacherRequest,
    }),
    [
      user,
      session,
      profile,
      loading,
      profileLoading,
      profileError,
      teacherRequest,
      teacherRequestLoading,
      logout,
      setAuthSession,
      refreshProfile,
      refreshTeacherRequest,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
