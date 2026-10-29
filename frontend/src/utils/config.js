/**
 * AttendAI Frontend Application Configuration
 *
 * Centralizes public environment variables.
 * SECURITY WARNING:
 * All variables prefixed with VITE_ are embedded into the client bundle at build time.
 * NEVER place private credentials, database passwords, or Supabase service-role keys here.
 */

export const config = {
  // Backend FastAPI API Base URL (future integration)
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',

  // Supabase Public Client Credentials (future integration)
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  },

  // Environment mode
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

export default config;
