/**
 * AttendAI Route Access Rules & Roles Configuration
 * Milestone 8.6: Protected Routes & Role-Based Access Control
 *
 * Centralizes the application roles and permission matrices.
 */

export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

/**
 * Access rules configuration table.
 * Specifies requirements for future routes as dashboards and modules are introduced.
 */
export const ROUTE_ACCESS = {
  // Public Routes (Accessible to all users without authentication)
  PUBLIC: ['/', '/login', '/register', '/register/teacher', '/login/teacher'],

  // Authenticated Base (Any valid logged-in user)
  AUTHENTICATED: ['/unauthorized', '/teacher/status'],

  // Role-Specific Routes
  STUDENT_ONLY: {
    roles: [ROLES.STUDENT, ROLES.ADMIN],
    requireApproval: false, // Students do not require manual administrative approval
  },
  TEACHER_ONLY: {
    roles: [ROLES.TEACHER, ROLES.ADMIN],
    requireApproval: true, // Teachers must be administratively approved (is_approved: true)
  },
  ADMIN_ONLY: {
    roles: [ROLES.ADMIN],
    requireApproval: true,
  },
};

/**
 * Pure evaluation helper for role and approval access decisions.
 * Useful for guards, UI conditional rendering, and unit testing.
 *
 * @param {Object} params
 * @param {string[]} [params.allowedRoles] - List of permitted roles
 * @param {boolean} [params.requireApproval] - Whether is_approved must be true
 * @param {boolean} [params.isAuthenticated] - Whether user has a valid session
 * @param {Object|null} [params.profile] - Profile object from public.profiles
 * @param {string|null} [params.role] - User's active role
 * @param {boolean} [params.isApproved] - Whether the user profile has is_approved true
 * @returns {{ allowed: boolean, reason?: 'not_authenticated' | 'no_profile' | 'forbidden' | 'pending_approval' }}
 */
export function evaluateAccess({
  allowedRoles = [],
  requireApproval = false,
  isAuthenticated = false,
  profile = null,
  role = null,
  isApproved = false,
} = {}) {
  if (!isAuthenticated) {
    return { allowed: false, reason: 'not_authenticated' };
  }

  if (!profile) {
    return { allowed: false, reason: 'no_profile' };
  }

  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    return { allowed: false, reason: 'forbidden' };
  }

  if (requireApproval && !isApproved) {
    return { allowed: false, reason: 'pending_approval' };
  }

  return { allowed: true };
}

export default ROUTE_ACCESS;
