/**
 * AttendAI Supabase Client Configuration
 * Milestone 8.2: Supabase Client and Authentication Service Infrastructure
 *
 * Configures the official Supabase JavaScript client with safe public credentials.
 *
 * SECURITY ARCHITECTURE GUIDELINES:
 * 1. Only the public anon/publishable key is used in the browser.
 * 2. Supabase Row Level Security (RLS) MUST be enabled on all database tables.
 * 3. Never expose or use the Supabase Service Role key in frontend code.
 * 4. User roles (student, teacher) are strictly managed and verified on the database.
 */

import { createClient } from '@supabase/supabase-js';
import { config, validateSupabaseConfig } from '../utils/config.js';

const validation = validateSupabaseConfig();

export const isSupabaseConfigured = () => validation.isValid;

let clientInstance = null;

if (validation.isValid) {
  clientInstance = createClient(config.supabase.url, config.supabase.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'attendai_auth_token',
    },
  });
} else {
  // Graceful fallback for unconfigured environments (e.g. CI without env secrets)
  // Prevents the application from crashing while warning developers in dev mode.
  if (config.isDev) {
    console.warn('[AttendAI Supabase Client]', validation.error || 'Supabase is not configured.');
  }

  // Stub client proxy that returns graceful errors instead of throwing runtime exceptions
  const unconfiguredError = () =>
    Promise.resolve({
      data: null,
      error: new Error(
        validation.error || 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
      ),
    });

  clientInstance = {
    auth: {
      signUp: unconfiguredError,
      signInWithPassword: unconfiguredError,
      signOut: unconfiguredError,
      getSession: unconfiguredError,
      getUser: unconfiguredError,
      resetPasswordForEmail: unconfiguredError,
      updateUser: unconfiguredError,
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => ({
      select: unconfiguredError,
      insert: unconfiguredError,
      update: unconfiguredError,
      delete: unconfiguredError,
    }),
  };
}

export const supabase = clientInstance;
export default supabase;
