/**
 * AttendAI Authentication Service
 * Milestone 8.2: Supabase Client and Authentication Service Infrastructure
 *
 * Centralized service layer encapsulating all authentication operations.
 * Enforces role security policies:
 * - Every new user receives the 'student' role by default.
 * - Teacher privileges are never self-assigned; they require administrative approval.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

/**
 * Maps Supabase auth error codes and messages to clean, user-friendly text.
 * @param {Error|{message: string, status?: number}} error
 * @returns {string} User-facing error message
 */
export function formatAuthError(error) {
  if (!error) return '';
  const message = error.message || '';

  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Your email address has not been confirmed yet. Please check your inbox for the confirmation link.';
  }
  if (message.includes('User already registered') || message.includes('already exists')) {
    return 'An account with this email address already exists. Please log in instead.';
  }
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('rate limit') || error.status === 429) {
    return 'Too many login attempts. Please wait a few moments and try again.';
  }
  if (message.includes('Network') || message.includes('Failed to fetch')) {
    return 'Unable to connect to the authentication server. Please check your internet connection.';
  }

  return message || 'An unexpected authentication error occurred. Please try again.';
}

/**
 * Register a new user with default 'student' role.
 * User-side self-assignment of 'teacher' is strictly prevented.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.fullName
 * @returns {Promise<{data: Object|null, error: Error|null, isConfirmationRequired: boolean}>}
 */
export async function registerUser({ email, password, fullName }) {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: new Error('Authentication service is currently unconfigured.'),
      isConfirmationRequired: false,
    };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (fullName || '').trim();

  // Enforce Option B: All new registrations are assigned 'student'.
  // Teacher privileges cannot be requested or self-elevated from the client.
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: cleanName,
        role: 'student',
      },
    },
  });

  if (error) {
    return {
      data: null,
      error,
      isConfirmationRequired: false,
    };
  }

  // Compatible with both email-confirmation enabled and disabled
  // If confirmation is enabled, Supabase returns a user but no active session.
  const isConfirmationRequired = Boolean(data?.user && !data?.session);

  return {
    data,
    error: null,
    isConfirmationRequired,
  };
}

/**
 * Register a new user requesting the Teacher role.
 * Milestone 8.7: Teacher Registration & Approval Request
 *
 * CRITICAL SECURITY RULE:
 * A user NEVER receives the 'teacher' role simply by registering through this page.
 * The profile role is strictly initialized to 'student' with is_approved = FALSE.
 * The requested_role metadata triggers a pending teacher_registration_requests record.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.fullName
 * @returns {Promise<{data: Object|null, error: Error|null, isConfirmationRequired: boolean}>}
 */
export async function registerTeacher({ email, password, fullName }) {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: new Error('Authentication service is currently unconfigured.'),
      isConfirmationRequired: false,
    };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (fullName || '').trim();

  // Enforce Option B & Milestone 8.7:
  // Role defaults to 'student' in public.profiles.
  // requested_role: 'teacher' signals application intent to create a pending request.
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: cleanName,
        role: 'student',
        requested_role: 'teacher',
      },
    },
  });

  if (error) {
    return {
      data: null,
      error,
      isConfirmationRequired: false,
    };
  }

  const isConfirmationRequired = Boolean(data?.user && !data?.session);

  // If signup immediately creates a session (email confirmation disabled),
  // ensure the teacher approval request is submitted safely
  if (data?.session && data?.user?.id) {
    try {
      await submitTeacherRegistrationRequest(data.user.id);
    } catch {
      // Non-blocking: trigger already created or can be submitted on status check
    }
  }

  return {
    data,
    error: null,
    isConfirmationRequired,
  };
}

/**
 * Submit a teacher registration approval request for an authenticated user.
 * Milestone 8.7: Teacher Registration and Approval Request
 *
 * @param {string} userId - UUID of the authenticated user
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function submitTeacherRegistrationRequest(userId) {
  if (!isSupabaseConfigured() || !userId) {
    return { data: null, error: new Error('User session or Supabase is unconfigured.') };
  }

  // Check if a pending request already exists to prevent duplicate pending submissions
  const { data: existing } = await supabase
    .from('teacher_registration_requests')
    .select('id, status, created_at')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return { data: existing, error: null };
  }

  const { data, error } = await supabase
    .from('teacher_registration_requests')
    .insert([
      {
        user_id: userId,
        status: 'pending',
      },
    ])
    .select()
    .single();

  return { data, error };
}

/**
 * Query the latest teacher registration request status for an authenticated user.
 * Milestone 8.7: Teacher Registration Status
 *
 * @param {string} userId - UUID of the authenticated user
 * @returns {Promise<{request: Object|null, error: Error|null}>}
 */
export async function getTeacherRegistrationRequest(userId) {
  if (!isSupabaseConfigured() || !userId) {
    return { request: null, error: null };
  }

  const { data, error } = await supabase
    .from('teacher_registration_requests')
    .select('id, user_id, status, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { request: data || null, error };
}

/**
 * Sign in an existing user with email and password.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function loginUser({ email, password }) {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: new Error('Authentication service is currently unconfigured.'),
    };
  }

  const cleanEmail = (email || '').trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  return { data, error };
}

/**
 * Sign out the currently authenticated user.
 *
 * @returns {Promise<{error: Error|null}>}
 */
export async function logoutUser() {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current active session from storage.
 *
 * @returns {Promise<{session: Object|null, error: Error|null}>}
 */
export async function getSession() {
  if (!isSupabaseConfigured()) {
    return { session: null, error: null };
  }

  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session || null, error };
}

/**
 * Get the currently authenticated user.
 *
 * @returns {Promise<{user: Object|null, error: Error|null}>}
 */
export async function getUser() {
  if (!isSupabaseConfigured()) {
    return { user: null, error: null };
  }

  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
}

/**
 * Fetch the authenticated user's profile from public.profiles.
 * Relies strictly on Supabase RLS policies (auth.uid() = id).
 *
 * @param {string} userId - UUID of the authenticated user
 * @returns {Promise<{profile: Object|null, error: Error|null}>}
 */
export async function getUserProfile(userId) {
  if (!isSupabaseConfigured() || !userId) {
    return { profile: null, error: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_approved, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();

  return { profile: data || null, error };
}

/**
 * Subscribe to authentication state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.).
 *
 * @param {Function} callback (event, session) => void
 * @returns {{unsubscribe: Function}}
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return {
    unsubscribe: () => {
      subscription?.unsubscribe();
    },
  };
}

export const authService = {
  formatAuthError,
  registerUser,
  registerTeacher,
  submitTeacherRegistrationRequest,
  getTeacherRegistrationRequest,
  loginUser,
  logoutUser,
  getSession,
  getUser,
  getUserProfile,
  onAuthStateChange,
};

export default authService;
