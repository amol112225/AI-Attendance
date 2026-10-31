/**
 * AttendAI RoleDashboardRedirect Component
 * Milestone 9.5: Dashboard Navigation and Role-Based Integration
 *
 * Dynamically evaluates the authenticated user's verified role and approval status,
 * redirecting them to their dedicated dashboard:
 * - Admin -> /admin/dashboard
 * - Approved Teacher -> /teacher/dashboard
 * - Pending / Rejected Teacher -> /teacher/status
 * - Student -> /student/dashboard
 * - Unauthenticated -> /login (with state.from)
 * - Profile Error / Missing -> /unauthorized
 * - Invalid / Unknown Role -> /unauthorized (forbidden)
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { ROLES, getRoleDashboardPath } from './accessRules';
import { ROUTES } from './routes';

export function RoleDashboardRedirect() {
  const {
    isAuthenticated,
    loading,
    profile,
    role,
    isApproved,
    profileLoading,
    profileError,
  } = useAuth();
  const location = useLocation();

  // 1. Loading state during session restoration or profile fetch
  if (loading || profileLoading) {
    return (
      <LoadingIndicator
        centered
        size="lg"
        message="Directing to your dashboard..."
      />
    );
  }

  // 2. Unauthenticated user -> Login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 3. Profile query failure -> Unauthorized error state
  if (profileError && !profile) {
    return (
      <Navigate
        to={ROUTES.UNAUTHORIZED}
        state={{ reason: 'error', from: location }}
        replace
      />
    );
  }

  // 4. Missing profile row -> Unauthorized
  if (!profile) {
    return (
      <Navigate
        to={ROUTES.UNAUTHORIZED}
        state={{ reason: 'no_profile', from: location }}
        replace
      />
    );
  }

  // 5. Unsupported / invalid role -> Unauthorized (forbidden)
  if (!role || ![ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN].includes(role)) {
    return (
      <Navigate
        to={ROUTES.UNAUTHORIZED}
        state={{
          reason: 'forbidden',
          userRole: role,
          from: location,
        }}
        replace
      />
    );
  }

  // 6. Safe role-specific redirection
  const targetPath = getRoleDashboardPath({ role, isApproved });
  return <Navigate to={targetPath} replace />;
}

export default RoleDashboardRedirect;

