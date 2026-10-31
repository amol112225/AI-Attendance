/**
 * AttendAI Frontend Application Configuration
 *
 * Centralizes public environment variables.
 * SECURITY WARNING:
 * All variables prefixed with VITE_ are embedded into the client bundle at build time.
 * NEVER place private credentials, database passwords, or Supabase service-role keys here.
 */

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const envUrl = (metaEnv.VITE_SUPABASE_URL || '').trim();
const envPublishableKey = (metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const config = {
  // Backend FastAPI API Base URL (future integration)
  apiBaseUrl: (metaEnv.VITE_API_BASE_URL || 'http://localhost:8000/api').trim(),

  // Supabase Public Client Credentials
  supabase: {
    url: envUrl,
    publishableKey: envPublishableKey,
  },

  // Demo Admin Configuration (for testing/reference)
  demoAdminEmail: (metaEnv.VITE_DEMO_ADMIN_EMAIL || 'admin.amol@attendai.edu').trim(),

  // Environment mode
  isDev: Boolean(metaEnv.DEV),
  isProd: Boolean(metaEnv.PROD),
};

/**
 * Validates Supabase public client configuration and enforces security rules.
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateSupabaseConfig() {
  const url = config.supabase.url;
  const key = config.supabase.publishableKey;

  if (!url || !key) {
    return {
      isValid: false,
      error: 'Missing required Supabase environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY).',
    };
  }

  // Security Guard: Prohibit accidental exposure of the Supabase service-role key
  if (key.toLowerCase().includes('service_role')) {
    return {
      isValid: false,
      error: 'CRITICAL SECURITY VIOLATION: Service role key detected in client environment variables. Only the public publishable/anon key is permitted in frontend code.',
    };
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        isValid: false,
        error: 'Invalid Supabase URL protocol. Expected http: or https:.',
      };
    }
  } catch {
    return {
      isValid: false,
      error: 'Invalid Supabase URL format.',
    };
  }

  return { isValid: true };
}

export default config;
