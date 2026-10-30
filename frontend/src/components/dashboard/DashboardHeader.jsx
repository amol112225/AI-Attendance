/**
 * AttendAI DashboardHeader Component
 * Milestone 9.1: Dashboard Architecture and Shared Layout
 *
 * Implements sticky top navigation bar with mobile drawer toggle and user status.
 */

import React from 'react';
import { Menu, LogOut, ChevronRight } from 'lucide-react';
import { ROLES } from '../../routes/accessRules';

export function DashboardHeader({
  onMenuToggle,
  role = 'student',
  user = null,
  profile = null,
  onLogout,
  breadcrumb = null,
}) {
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'User');

  const getRoleBadge = () => {
    if (role === ROLES.TEACHER) {
      return (
        <span className="dashboard-role-badge dashboard-role-badge--teacher">
          Faculty
        </span>
      );
    }
    if (role === ROLES.ADMIN) {
      return (
        <span className="dashboard-role-badge dashboard-role-badge--admin">
          Administrator
        </span>
      );
    }
    return (
      <span className="dashboard-role-badge dashboard-role-badge--student">
        Student
      </span>
    );
  };

  return (
    <header className="dashboard-header" role="banner">
      <div className="dashboard-header__left">
        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="dashboard-header__toggle-btn"
          onClick={onMenuToggle}
          aria-label="Toggle navigation drawer"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb / Section Header */}
        <div className="dashboard-header__breadcrumb" aria-label="Breadcrumb">
          <span>AttendAI</span>
          <ChevronRight size={14} aria-hidden="true" />
          <span className="dashboard-header__breadcrumb-active">
            {breadcrumb || (role === ROLES.TEACHER ? 'Faculty' : role === ROLES.ADMIN ? 'Admin' : 'Student')}
          </span>
        </div>
      </div>

      <div className="dashboard-header__right">
        {getRoleBadge()}

        <button
          type="button"
          className="dashboard-sidebar__logout-btn"
          style={{ width: 'auto', padding: 'var(--space-1) var(--space-3)' }}
          onClick={onLogout}
          title={`Signed in as ${displayName}. Click to sign out.`}
        >
          <LogOut size={14} aria-hidden="true" />
          <span style={{ display: 'none' }}>Sign Out</span>
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;

