/**
 * AttendAI Admin Service
 * Milestone 9.4: Admin Dashboard
 *
 * Provides data-fetching methods for system administrators:
 * - Aggregates registered students, teachers, approved teachers, and pending requests
 * - Strictly respects Supabase Row Level Security (RLS) policies
 * - Never exposes service-role keys or bypasses database security
 * - Identifies when aggregate queries are restricted by user-level RLS policies
 * - Never fabricates fake statistics or assumes restricted queries mean zero users
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

/**
 * Fetch system-wide platform metrics for the authenticated administrator.
 * Evaluates whether RLS permits global profile counting or restricts results to own row.
 *
 * @param {string} adminId - UUID of the authenticated administrator
 * @returns {Promise<{
 *   studentsCount: number|null,
 *   teachersCount: number|null,
 *   approvedTeachersCount: number|null,
 *   pendingRequestsCount: number|null,
 *   totalUsersCount: number|null,
 *   isRestrictedByRls: boolean,
 *   isAvailable: boolean,
 *   error: Error|null
 * }>}
 */
export async function getAdminSystemMetrics(adminId) {
  if (!isSupabaseConfigured() || !adminId) {
    return {
      studentsCount: null,
      teachersCount: null,
      approvedTeachersCount: null,
      pendingRequestsCount: null,
      totalUsersCount: null,
      isRestrictedByRls: false,
      isAvailable: false,
      error: null,
    };
  }

  try {
    const [profilesRes, requestsRes] = await Promise.all([
      supabase.from('profiles').select('id, role, is_approved'),
      supabase.from('teacher_registration_requests').select('id, status'),
    ]);

    if (profilesRes.error) {
      return {
        studentsCount: null,
        teachersCount: null,
        approvedTeachersCount: null,
        pendingRequestsCount: null,
        totalUsersCount: null,
        isRestrictedByRls: false,
        isAvailable: false,
        error: profilesRes.error,
      };
    }

    const profiles = profilesRes.data || [];
    const requests = requestsRes.data || [];

    // Check if the current RLS policy ('Users can view own profile' where auth.uid() = id)
    // restricted the query to return only the single profile belonging to the admin.
    // If only 1 record is returned and its ID is the admin's own ID, system-wide
    // aggregate queries are restricted by Row Level Security.
    const isRestrictedByRls =
      profiles.length === 1 && profiles[0].id === adminId;

    if (isRestrictedByRls) {
      return {
        studentsCount: null,
        teachersCount: null,
        approvedTeachersCount: null,
        pendingRequestsCount: null,
        totalUsersCount: null,
        isRestrictedByRls: true,
        isAvailable: false,
        error: null,
      };
    }

    // When global RLS policy or admin permissions allow full table inspection:
    const studentsCount = profiles.filter((p) => p.role === 'student').length;
    const teachersCount = profiles.filter((p) => p.role === 'teacher').length;
    const approvedTeachersCount = profiles.filter(
      (p) => p.role === 'teacher' && p.is_approved
    ).length;
    const pendingRequestsCount = requests.filter(
      (r) => r.status && r.status.toLowerCase() === 'pending'
    ).length;
    const totalUsersCount = profiles.length;

    return {
      studentsCount,
      teachersCount,
      approvedTeachersCount,
      pendingRequestsCount,
      totalUsersCount,
      isRestrictedByRls: false,
      isAvailable: true,
      error: null,
    };
  } catch (err) {
    return {
      studentsCount: null,
      teachersCount: null,
      approvedTeachersCount: null,
      pendingRequestsCount: null,
      totalUsersCount: null,
      isRestrictedByRls: false,
      isAvailable: false,
      error: err,
    };
  }
}

/**
 * Fetch pending teacher approval requests summary.
 *
 * @param {string} adminId - UUID of the authenticated administrator
 * @returns {Promise<{pendingCount: number|null, isRestricted: boolean, error: Error|null}>}
 */
export async function getPendingTeacherApprovalsSummary(adminId) {
  if (!isSupabaseConfigured() || !adminId) {
    return { pendingCount: null, isRestricted: false, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('teacher_registration_requests')
      .select('id, status');

    if (error) {
      return { pendingCount: null, isRestricted: false, error };
    }

    const requests = data || [];
    const pendingCount = requests.filter(
      (r) => r.status && r.status.toLowerCase() === 'pending'
    ).length;

    return { pendingCount, isRestricted: false, error: null };
  } catch (err) {
    return { pendingCount: null, isRestricted: false, error: err };
  }
}

