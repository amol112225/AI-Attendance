/**
 * AttendAI Supabase Service Architecture Stub
 *
 * Prepared for future authentication and client-side database subscriptions.
 *
 * SECURITY ARCHITECTURE GUIDELINES:
 * 1. Only the public anon/publishable key is used in the browser.
 * 2. Supabase Row Level Security (RLS) MUST be enabled on all database tables.
 * 3. Never expose or use the Supabase Service Role key in frontend code.
 * 4. User roles (student, teacher, admin) must never be trusted from client state;
 *    authorization must be validated via Supabase Auth claims and FastAPI server verification.
 */

import { config } from '../utils/config';

export const isSupabaseConfigured = () => {
  return Boolean(config.supabase.url && config.supabase.publishableKey);
};

/**
 * Placeholder client descriptor. In future milestones, @supabase/supabase-js
 * can be initialized here using `createClient(config.supabase.url, config.supabase.publishableKey)`.
 */
export const supabasePlaceholder = {
  configured: isSupabaseConfigured(),
  url: config.supabase.url,
};

export default supabasePlaceholder;

