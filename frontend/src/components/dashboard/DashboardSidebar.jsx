/**
 * AttendAI DashboardSidebar Component
 * Milestone 9.1: Dashboard Architecture and Shared Layout
 *
 * Implements persistent desktop sidebar and off-canvas mobile drawer.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, X, LogOut } from 'lucide-react';
import { DashboardNavigation } from './DashboardNavigation';
import { ROUTES } from '../../routes/routes';
import { ROLES } from '../../routes/accessRules';

export function DashboardSidebar({
  isOpen = false,
  onClose,
  role = 'student',
  user = null,
  profile = null,
  onLogout,
}) {
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'User');

  const initial = (displayName.charAt(0) || 'U').toUpperCase();

  const getDashboardHome = () => {
    if (role === ROLES.TEACHER) return ROUTES.TEACHER_DASHBOARD;
    if (role === ROLES.ADMIN) return ROUTES.ADMIN_DASHBOARD;
    return ROUTES.STUDENT_DASHBOARD;
  };

  const getRoleLabel = () => {
    if (role === ROLES.TEACHER) return 'Faculty';
    if (role === ROLES.ADMIN) return 'Administrator';
    return 'Student';
  };

  return (
    <aside
      className={`dashboard-sidebar ${isOpen ? 'dashboard-sidebar--open' : ''}`.trim()}
      aria-label="Dashboard Sidebar Navigation"
    >
      {/* Brand Header */}
      <div className="dashboard-sidebar__header">
        <Link
          to={getDashboardHome()}
          className="dashboard-sidebar__brand"
          onClick={onClose}
          aria-label="AttendAI Dashboard Home"
        >
          <div className="dashboard-sidebar__brand-icon" aria-hidden="true">
            <Cpu size={18} />
          </div>
          <span className="dashboard-sidebar__brand-text">AttendAI</span>
        </Link>

        {/* Mobile Close Button */}
        <button
          type="button"
          className="dashboard-sidebar__close-btn"
          onClick={onClose}
          aria-label="Close navigation sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Links Area */}
      <div className="dashboard-sidebar__nav-container">
        <div>
          <div className="dashboard-sidebar__section-title">
            {getRoleLabel()} Portal
          </div>
          <DashboardNavigation role={role} onItemClick={onClose} />
        </div>
      </div>

      {/* User Profile & Logout Footer */}
      <div className="dashboard-sidebar__footer">
        <div className="dashboard-user-profile" title={user?.email || 'User Profile'}>
          <div className="dashboard-user-avatar" aria-hidden="true">
            {initial}
          </div>
          <div className="dashboard-user-info">
            <span className="dashboard-user-name">{displayName}</span>
            <span className="dashboard-user-role">{getRoleLabel()}</span>
          </div>
        </div>

        <button
          type="button"
          className="dashboard-sidebar__logout-btn"
          onClick={onLogout}
        >
          <LogOut size={14} aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;

