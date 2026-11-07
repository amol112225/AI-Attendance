/**
 * AttendAI Centralized Authentication Context
 * Milestone 8.4: AttendAI Login, AuthContext & Session Management
 * Performance & Stability Optimization: Eliminated infinite re-subscription loops,
 * deduplicated startup queries, and stabilized callback dependencies.
 * Diagnostic Hardening: Structured errorType tracking (TABLE_NOT_FOUND, RECORD_NOT_FOUND, etc.)
 *
 * Provides reactive authentication state across the application:
 * - user, session, loading, isAuthenticated, logout
 * - Session restoration on app start
 * - Subscription to Supabase auth state events
 * - Graceful handling of unconfigured or offline scenarios
 * - Strict Option B approval logic: Students NEVER require approval
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getSession,
  onAuthStateChange,
  logoutUser,
  getUserProfile,
  getTeacherRegistrationRequest,
} from '../services/authService';
import { config } from '../utils/config';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileErrorType, setProfileErrorType] = useState(null);
  const [teacherRequest, setTeacherRequest] = useState(null);
  const [teacherRequestLoading, setTeacherRequestLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Mutable refs to prevent unnecessary re-creations of callbacks and effects
  const userRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Helper to safely load profile for an authenticated user ID without throwing
  // Uses userRef and explicit userObj to maintain zero dependencies []
  const loadProfile = useCallback(async (userId, _userObj = null) => {
    if (!userId) {
      setProfile(null);
      setProfileError(null);
      setProfileErrorType(null);
      setProfileLoading(false);
      return null;
    }
    setProfileLoading(true);
    setProfileError(null);
    setProfileErrorType(null);
    try {
      const { profile: loadedProfile, error, errorType } = await getUserProfile(userId);
      if (!error && loadedProfile) {
        // Authoritative database profile found
        // Ensure student approval is never required, even if database row has is_approved = false
        const normalizedProfile = {
          ...loadedProfile,
          is_approved: loadedProfile.role === 'student' ? true : Boolean(loadedProfile.is_approved),
        };
        setProfile(normalizedProfile);
        setProfileError(null);
        setProfileErrorType(null);
        return normalizedProfile;
      }

      // If record is temporarily not found right after registration (database trigger completing),
      // perform a quick retry after 300ms, but only if error is not TABLE_NOT_FOUND
      if (!loadedProfile && errorType !== 'TABLE_NOT_FOUND') {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const retryResult = await getUserProfile(userId);
        if (!retryResult.error && retryResult.profile) {
          const normalizedProfile = {
            ...retryResult.profile,
            is_approved: retryResult.profile.role === 'student' ? true : Boolean(retryResult.profile.is_approved),
          };
          setProfile(normalizedProfile);
          setProfileError(null);
          setProfileErrorType(null);
          return normalizedProfile;
        }
      }

      // Resilient Profile Resolution:
      // When public.profiles is unavailable or missing on Supabase, resolve role from verified session.
      // Option B mandates that all standard user accounts are registered as Student
      // and must never require administrative approval.
      const currentUser = _userObj || userRef.current;
      const isAdmin =
        currentUser?.user_metadata?.role === 'admin' ||
        (currentUser?.email && currentUser.email.toLowerCase() === config.demoAdminEmail.toLowerCase());
      // Approved teacher by email override (demo/dev teacher account)
      const isDemoApprovedTeacher =
        config.demoTeacherEmail &&
        currentUser?.email &&
        currentUser.email.toLowerCase() === config.demoTeacherEmail.toLowerCase();
      const isTeacherApplicant =
        isDemoApprovedTeacher ||
        currentUser?.user_metadata?.requested_role === 'teacher';

      if (isAdmin) {
        const adminProfile = {
          id: userId,
          full_name:
            currentUser?.user_metadata?.full_name ||
            currentUser?.email?.split('@')[0] ||
            'System Administrator',
          role: 'admin',
          is_approved: true,
          created_at: currentUser?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(adminProfile);
        setProfileError(null);
        setProfileErrorType(null);
        return adminProfile;
      }

      if (isTeacherApplicant) {
        const teacherPendingProfile = {
          id: userId,
          full_name:
            currentUser?.user_metadata?.full_name ||
            currentUser?.email?.split('@')[0] ||
            'AttendAI Faculty Applicant',
          role: 'teacher',
          // Demo approved teacher gets full access; other applicants remain pending
          is_approved: isDemoApprovedTeacher ? true : false,
          created_at: currentUser?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(teacherPendingProfile);
        setProfileError(null);
        setProfileErrorType(null);
        return teacherPendingProfile;
      }

      // Default: All standard accounts are active, verified Students (Option B)
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
      setProfileErrorType(null);
      return studentFallbackProfile;
    } catch {
      const currentUser = _userObj || userRef.current;
      const isAdmin =
        currentUser?.user_metadata?.role === 'admin' ||
        (currentUser?.email && currentUser.email.toLowerCase() === config.demoAdminEmail.toLowerCase());
      // Approved teacher by email override (demo/dev teacher account)
      const isDemoApprovedTeacher =
        config.demoTeacherEmail &&
        currentUser?.email &&
        currentUser.email.toLowerCase() === config.demoTeacherEmail.toLowerCase();
      const isTeacherApplicant =
        isDemoApprovedTeacher ||
        currentUser?.user_metadata?.requested_role === 'teacher';

      if (isAdmin) {
        const adminProfile = {
          id: userId,
          full_name:
            currentUser?.user_metadata?.full_name ||
            currentUser?.email?.split('@')[0] ||
            'System Administrator',
          role: 'admin',
          is_approved: true,
          created_at: currentUser?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(adminProfile);
        setProfileError(null);
        setProfileErrorType(null);
        return adminProfile;
      }

      if (isTeacherApplicant) {
        const teacherPendingProfile = {
          id: userId,
          full_name:
            currentUser?.user_metadata?.full_name ||
            currentUser?.email?.split('@')[0] ||
            'AttendAI Faculty Applicant',
          role: 'teacher',
          // Demo approved teacher gets full access; other applicants remain pending
          is_approved: isDemoApprovedTeacher ? true : false,
          created_at: currentUser?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(teacherPendingProfile);
        setProfileError(null);
        setProfileErrorType(null);
        return teacherPendingProfile;
      }

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
      setProfileErrorType(null);
      return studentFallbackProfile;
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
  // Stable dependency array [] eliminates infinite teardown/re-subscription loops
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const { session: initialSession, error } = await getSession();
        if (isMounted) {
          if (!error && initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            userRef.current = initialSession.user;
            await Promise.all([
              loadProfile(initialSession.user.id, initialSession.user),
              loadTeacherRequest(initialSession.user.id),
            ]);
          } else {
            setSession(null);
            setUser(null);
            userRef.current = null;
            setProfile(null);
            setTeacherRequest(null);
          }
        }
      } catch {
        if (isMounted) {
          setSession(null);
          setUser(null);
          userRef.current = null;
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
    const { unsubscribe } = onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      // Skip redundant initial event since initializeAuth() handles initial restore
      if (event === 'INITIAL_SESSION') {
        return;
      }

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        userRef.current = currentSession.user;
        await Promise.all([
          loadProfile(currentSession.user.id, currentSession.user),
          loadTeacherRequest(currentSession.user.id),
        ]);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        userRef.current = null;
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
  // Avoids premature setProfile(null) wipe to prevent flash of 'Unassigned' role
  const setAuthSession = useCallback(async (newSession) => {
    setSession(newSession);
    const currentUser = newSession?.user ?? null;
    setUser(currentUser);
    userRef.current = currentUser;

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
    const currentUser = userRef.current;
    if (currentUser?.id) {
      return await loadProfile(currentUser.id, currentUser);
    }
    return null;
  }, [loadProfile]);

  // Manual trigger to refresh teacher request data
  const refreshTeacherRequest = useCallback(async () => {
    const currentUser = userRef.current;
    if (currentUser?.id) {
      return await loadTeacherRequest(currentUser.id);
    }
    return null;
  }, [loadTeacherRequest]);

  // Logout handler
  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutUser();
      setSession(null);
      setUser(null);
      userRef.current = null;
      setProfile(null);
      setProfileError(null);
      setProfileErrorType(null);
      setTeacherRequest(null);
    } catch {
      // Clear local state even if network call fails
      setSession(null);
      setUser(null);
      userRef.current = null;
      setProfile(null);
      setProfileError(null);
      setProfileErrorType(null);
      setTeacherRequest(null);
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  const value = useMemo(
    () => {
      const resolvedRole = profile?.role || null;

      const resolvedIsApproved =
        profile?.role === 'student' || profile?.role === 'admin'
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
        profileErrorType,
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
      profileErrorType,
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
