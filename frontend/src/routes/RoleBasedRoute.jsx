/**
 * AttendAI RoleBasedRoute Component
 * Milestone 8.6: Protected Routes & Role-Based Access Control
 *
 * Enforces role-based permissions and administrative approval verification:
 * 1. Checks loading state (both session and profile query).
 * 2. If unauthenticated, delegates to /login via ProtectedRoute or redirect.
 * 3. If profile loading encountered a network error, redirects to /unauthorized with reason 'error'.
 * 4. If profile is missing, redirects to /unauthorized with reason 'no_profile'.
 * 5. If role is not allowed, redirects to /unauthorized with reason 'forbidden'.
 * 6. If route requires administrative approval and user is unapproved, redirects to /unauthorized with reason 'pending_approval'.
 */

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { ROUTES } from './routes';

export function RoleBasedRoute({
  allowedRoles = [],
  requireApproval = false,
  children,
}) {
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

  // 1. Initial auth restoration or active profile fetch in flight
  if (loading || profileLoading) {
    return (
      <LoadingIndicator
        centered
        size="lg"
        message="Verifying user authorization..."
      />
    );
  }

  // 2. Unauthenticated user
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 3. Temporary network/query failure retrieving profile
  if (profileError && !profile) {
    return (
      <Navigate
        to={ROUTES.UNAUTHORIZED}
        state={{ reason: 'error', from: location }}
        replace
      />
    );
  }

  // 4. Missing profile row in public.profiles
  if (!profile) {
    return (
      <Navigate
        to={ROUTES.UNAUTHORIZED}
        state={{ reason: 'no_profile', from: location }}
        replace
      />
    );
  }

  // 5. Role mismatch (user role is not in allowedRoles list)
  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    return (
      <Navigate
        to={ROUTES.UNAUTHORIZED}
        state={{
          reason: 'forbidden',
          requiredRoles: allowedRoles,
          userRole: role,
          from: location,
        }}
        replace
      />
    );
  }

  // 6. Approval check (e.g. for Teachers who must be approved before accessing Teacher routes)
  if (requireApproval && role === 'teacher' && !isApproved) {
    return (
      <Navigate
        to={ROUTES.UNAUTHORIZED}
        state={{
          reason: 'pending_approval',
          userRole: role,
          from: location,
        }}
        replace
      />
    );
  }

  return children ? children : <Outlet />;
}

export default RoleBasedRoute;
