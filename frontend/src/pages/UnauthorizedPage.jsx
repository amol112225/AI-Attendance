/**
 * AttendAI Unauthorized / Access Denied Page Component
 * Milestone 8.6: Protected Routes & Role-Based Access Control
 *
 * Communicates contextual authorization denials:
 * - 'pending_approval': Account waiting for administrator approval (e.g. Teacher)
 * - 'forbidden': Account role lacks permission for the requested route
 * - 'no_profile' / 'error': Profile row missing or query temporary failure
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, Clock, AlertCircle, Home, LogOut, RefreshCw } from 'lucide-react';
import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../routes/routes';
import './UnauthorizedPage.css';

export function UnauthorizedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, isApproved, logout, refreshProfile } = useAuth();

  const state = location.state || {};
  const reason = state.reason || 'forbidden';

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
    title = 'Account Approval Pending';
    description =
      'Your account role requires administrative approval before you can access this area. Please contact an administrator to activate your privileges.';
  } else if (reason === 'no_profile' || reason === 'error') {
    icon = <AlertCircle size={32} />;
    iconTheme = 'unauthorized-icon-wrapper--info';
    badgeTheme = 'unauthorized-badge--info';
    badgeText = 'PROFILE SYNC';
    title = 'Profile Verification Needed';
    description =
      'We could not load your user profile record. Please try refreshing or re-authenticating your session.';
  }

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.ROOT);
  };

  const handleRefresh = async () => {
    await refreshProfile();
    if (state.from?.pathname) {
      navigate(state.from.pathname, { replace: true });
    } else {
      navigate(ROUTES.ROOT);
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
              <span className="unauthorized-meta-value">{role || 'Unassigned'}</span>
            </div>
            <div className="unauthorized-meta-row">
              <span className="unauthorized-meta-label">Approval Status:</span>
              <span className="unauthorized-meta-value">
                {isApproved ? 'Approved' : 'Pending Approval'}
              </span>
            </div>
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

            {reason === 'pending_approval' || reason === 'error' ? (
              <Button
                variant="outline"
                size="md"
                type="button"
                icon={<RefreshCw size={16} />}
                onClick={handleRefresh}
              >
                Check Status Again
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
