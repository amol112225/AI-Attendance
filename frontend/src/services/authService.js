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
  loginUser,
  logoutUser,
  getSession,
  getUser,
  onAuthStateChange,
};

export default authService;
