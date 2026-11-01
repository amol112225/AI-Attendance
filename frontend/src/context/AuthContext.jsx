/**
 * AttendAI Centralized Authentication Context
 * Milestone 8.4: AttendAI Login, AuthContext & Session Management
 *
 * Provides reactive authentication state across the application:
 * - user, session, loading, isAuthenticated, logout
 * - Session restoration on app start
 * - Subscription to Supabase auth state events
 * - Graceful handling of unconfigured or offline scenarios
 * - Strict Option B approval logic: Students NEVER require approval
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
  const loadProfile = useCallback(async (userId, userObj = null) => {
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
        // Authoritative database profile found
        // Ensure student approval is never required, even if database row has is_approved = false
        const normalizedProfile = {
          ...loadedProfile,
          is_approved: loadedProfile.role === 'student' ? true : Boolean(loadedProfile.is_approved),
        };
        setProfile(normalizedProfile);
        setProfileError(null);
        return normalizedProfile;
      }

      // If query fails or profile row not found yet (e.g. database trigger in progress),
      // perform a quick retry before falling back
      if (!loadedProfile) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const retryResult = await getUserProfile(userId);
        if (!retryResult.error && retryResult.profile) {
          const normalizedProfile = {
            ...retryResult.profile,
            is_approved: retryResult.profile.role === 'student' ? true : Boolean(retryResult.profile.is_approved),
          };
          setProfile(normalizedProfile);
          setProfileError(null);
          return normalizedProfile;
        }
      }

      // Resilient Student Fallback:
      // Option B mandates that all standard user accounts are registered as Student
      // and must never require administrative approval.
      const currentUser = userObj || user;
      const requestedRole =
        currentUser?.user_metadata?.requested_role ||
        currentUser?.user_metadata?.role;

      // Strictly verify that the account is NOT a Teacher or Admin before providing Student profile
      if (currentUser && requestedRole !== 'teacher' && requestedRole !== 'admin') {
        const studentFallbackProfile = {
          id: userId,
          full_name:
            currentUser?.user_metadata?.full_name ||
            currentUser?.email?.split('@')[0] ||
            'AttendAI Student',
          role: 'student',
          is_approved: true,
          created_at: currentUser?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(studentFallbackProfile);
        setProfileError(null);
        return studentFallbackProfile;
      }

      setProfile(null);
      if (error) {
        setProfileError(error);
      }
      return null;
    } catch (err) {
      const currentUser = userObj || user;
      const requestedRole =
        currentUser?.user_metadata?.requested_role ||
        currentUser?.user_metadata?.role;

      if (currentUser && requestedRole !== 'teacher' && requestedRole !== 'admin') {
        const studentFallbackProfile = {
          id: userId,
          full_name:
            currentUser?.user_metadata?.full_name ||
            currentUser?.email?.split('@')[0] ||
            'AttendAI Student',
          role: 'student',
          is_approved: true,
          created_at: currentUser?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(studentFallbackProfile);
        setProfileError(null);
        return studentFallbackProfile;
      }

      setProfile(null);
      setProfileError(err);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

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
              loadProfile(initialSession.user.id, initialSession.user),
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
          loadProfile(currentSession.user.id, currentSession.user),
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
    // Prevent stale profile from previous sessions while resolving new credentials
    setProfile(null);
    setTeacherRequest(null);
    let loadedProfile = null;
    let loadedTeacherRequest = null;
    if (currentUser?.id) {
      setProfileLoading(true);
      const [profileRes, requestRes] = await Promise.all([
        loadProfile(currentUser.id, currentUser),
        loadTeacherRequest(currentUser.id),
      ]);
      loadedProfile = profileRes;
      loadedTeacherRequest = requestRes;
    } else {
      setProfile(null);
      setTeacherRequest(null);
    }
    setLoading(false);
    return { profile: loadedProfile, teacherRequest: loadedTeacherRequest };
  }, [loadProfile, loadTeacherRequest]);

  // Manual trigger to refresh profile data (e.g. after administrative role changes)
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      return await loadProfile(user.id, user);
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
    () => {
      const isTeacherOrAdminMeta =
        user?.user_metadata?.requested_role === 'teacher' ||
        user?.user_metadata?.role === 'teacher' ||
        user?.user_metadata?.role === 'admin';

      const resolvedRole =
        profile?.role ||
        (user && !isTeacherOrAdminMeta ? 'student' : null);

      const resolvedIsApproved =
        profile?.role === 'student' || profile?.role === 'admin' || resolvedRole === 'student' || resolvedRole === 'admin'
          ? true
          : Boolean(profile?.is_approved);

      return {
        user,
        session,
        profile,
        role: resolvedRole,
        isApproved: resolvedIsApproved,
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
      };
    },
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
