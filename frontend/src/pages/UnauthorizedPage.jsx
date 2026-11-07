/**
 * AttendAI Unauthorized / Access Denied Page Component
 * Milestone 8.6: Protected Routes & Role-Based Access Control
 *
 * Communicates contextual authorization denials with actionable diagnostics:
 * - 'pending_approval': Account waiting for administrator approval (e.g. Teacher)
 * - 'forbidden': Account role lacks permission for the requested route
 * - 'no_profile': Profile row missing in public.profiles
 * - 'error': Database, network, or schema error (with specific errorType diagnostics)
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, Clock, AlertCircle, Home, LogOut, RefreshCw, Database } from 'lucide-react';
import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { getRoleDashboardPath } from '../routes/accessRules';
import { ROUTES } from '../routes/routes';
import './UnauthorizedPage.css';

export function UnauthorizedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, isApproved, logout, refreshProfile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const state = location.state || {};
  const reason = state.reason || 'forbidden';
  const errorType = state.errorType || null;

  let icon = <ShieldAlert size={32} />;
  let iconTheme = 'unauthorized-icon-wrapper--danger';
  let badgeTheme = 'unauthorized-badge--danger';
  let badgeText = 'HTTP 403 • FORBIDDEN';
  let title = 'Access Denied';
  let description =
    'You do not have the required permissions or role privileges to view this section of AttendAI.';

  if (reason === 'pending_approval') {
    icon = <Clock size={32} />;
    iconTheme = 'unauthorized-icon-wrapper--warning';
    badgeTheme = 'unauthorized-badge--warning';
    badgeText = 'APPROVAL PENDING';
    title = 'Teacher Application Under Review';
    description =
      'Your request to access AttendAI with Faculty privileges is currently under review by an administrator. Please check your request status or sign in again once approved.';
  } else if (reason === 'error') {
    if (errorType === 'TABLE_NOT_FOUND') {
      icon = <Database size={32} />;
      iconTheme = 'unauthorized-icon-wrapper--warning';
      badgeTheme = 'unauthorized-badge--warning';
      badgeText = 'DATABASE SETUP REQUIRED';
      title = 'Database Tables Not Found (HTTP 404)';
      description =
        'The required database tables (public.profiles / public.teacher_registration_requests) were not found in your Supabase project (HTTP 404). Please apply the AttendAI database migration in your Supabase SQL Editor.';
    } else if (errorType === 'PERMISSION_DENIED') {
      icon = <ShieldAlert size={32} />;
      iconTheme = 'unauthorized-icon-wrapper--danger';
      badgeTheme = 'unauthorized-badge--danger';
      badgeText = 'DATABASE PERMISSION DENIED';
      title = 'Profile Access Denied';
      description =
        'Access to your database profile record was blocked by Row Level Security (RLS) policies. Please verify that database RLS policies are applied correctly.';
    } else if (errorType === 'NETWORK_ERROR') {
      icon = <AlertCircle size={32} />;
      iconTheme = 'unauthorized-icon-wrapper--warning';
      badgeTheme = 'unauthorized-badge--warning';
      badgeText = 'NETWORK ERROR';
      title = 'Connection Failure';
      description =
        'Unable to communicate with the Supabase authentication database. Please check your internet connection and verify Supabase project status.';
    } else {
      icon = <AlertCircle size={32} />;
      iconTheme = 'unauthorized-icon-wrapper--info';
      badgeTheme = 'unauthorized-badge--info';
      badgeText = 'PROFILE SYNC ERROR';
      title = 'Profile Verification Needed';
      description =
        'A database error occurred while loading your user profile record. Please try refreshing or re-authenticating your session.';
    }
  } else if (reason === 'no_profile') {
    icon = <AlertCircle size={32} />;
    iconTheme = 'unauthorized-icon-wrapper--info';
    badgeTheme = 'unauthorized-badge--info';
    badgeText = 'PROFILE MISSING';
    title = 'User Profile Not Found';
    description =
      'Your authentication session is active, but no matching profile record was found in the database for this user ID. An administrator may need to provision your profile.';
  }

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.ROOT);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const refreshedProfile = await refreshProfile();
      if (refreshedProfile) {
        const destination =
          state.from?.pathname &&
          state.from.pathname !== ROUTES.UNAUTHORIZED &&
          state.from.pathname !== ROUTES.LOGIN &&
          state.from.pathname !== ROUTES.ROOT
            ? state.from.pathname
            : getRoleDashboardPath({
                role: refreshedProfile.role,
                isApproved: Boolean(refreshedProfile.is_approved),
              });
        navigate(destination, { replace: true });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="unauthorized-page">
      <Container size="sm">
        <div className="unauthorized-card" role="region" aria-label="Access Denied Notice">
          <div className={`unauthorized-icon-wrapper ${iconTheme}`} aria-hidden="true">
            {icon}
          </div>

          <span className={`unauthorized-badge ${badgeTheme}`}>{badgeText}</span>

          <h1 className="unauthorized-title">{title}</h1>

          <p className="unauthorized-desc">{description}</p>

          <div className="unauthorized-meta-box">
            <div className="unauthorized-meta-row">
              <span className="unauthorized-meta-label">Your Current Role:</span>
              <span className="unauthorized-meta-value">{role ? role.toUpperCase() : 'Unassigned'}</span>
            </div>
            <div className="unauthorized-meta-row">
              <span className="unauthorized-meta-label">Approval Status:</span>
              <span className="unauthorized-meta-value">
                {isApproved ? 'Approved' : 'Pending Approval'}
              </span>
            </div>
            {errorType && (
              <div className="unauthorized-meta-row">
                <span className="unauthorized-meta-label">Diagnostic Code:</span>
                <span
                  className="unauthorized-meta-value"
                  style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}
                >
                  {errorType}
                </span>
              </div>
            )}
          </div>

          <div className="unauthorized-actions">
            <Button
              variant="primary"
              size="md"
              type="button"
              icon={<Home size={16} />}
              onClick={() => navigate(ROUTES.ROOT)}
            >
              Return to Homepage
            </Button>

            {reason === 'pending_approval' ? (
              <Button
                variant="outline"
                size="md"
                type="button"
                icon={<Clock size={16} />}
                onClick={() => navigate(ROUTES.TEACHER_STATUS)}
              >
                View Request Details
              </Button>
            ) : null}

            {reason === 'pending_approval' || reason === 'error' || reason === 'no_profile' ? (
              <Button
                variant="outline"
                size="md"
                type="button"
                icon={<RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Checking...' : 'Check Status Again'}
              </Button>
            ) : null}

            <Button
              variant="ghost"
              size="md"
              type="button"
              icon={<LogOut size={16} />}
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default UnauthorizedPage;
