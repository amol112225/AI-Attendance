/**
 * AttendAI ProtectedRoute Component
 * Milestone 8.6: Protected Routes & Role-Based Access Control
 *
 * Guarantees that only authenticated users can access child routes:
 * 1. Shows accessible loading indicator while initial session restoration is running.
 * 2. Redirects unauthenticated users to /login, preserving location.pathname in state.from.
 * 3. Renders children or <Outlet /> when authentication is verified.
 */

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { ROUTES } from './routes';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <LoadingIndicator
        centered
        size="lg"
        message="Verifying AttendAI session..."
      />
    );
  }

  if (!isAuthenticated) {
    // Preserve requested destination so login can redirect back after sign-in
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
