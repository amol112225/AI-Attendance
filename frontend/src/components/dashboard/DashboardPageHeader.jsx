/**
 * AttendAI DashboardPageHeader Component
 * Milestone 9.1: Dashboard Architecture and Shared Layout
 *
 * Reusable page header for all role-specific dashboard views.
 */

import React from 'react';

export function DashboardPageHeader({
  title,
  subtitle,
  badge = null,
  actions = null,
  className = '',
}) {
  return (
    <header className={`dashboard-page-header ${className}`.trim()}>
      <div className="dashboard-page-header__content">
        {badge && <div className="dashboard-page-header__badge-row">{badge}</div>}
        <h1 className="dashboard-page-header__title">{title}</h1>
        {subtitle && <p className="dashboard-page-header__subtitle">{subtitle}</p>}
      </div>

      {actions && (
        <div className="dashboard-page-header__actions">
          {actions}
        </div>
      )}
    </header>
  );
}

export default DashboardPageHeader;

