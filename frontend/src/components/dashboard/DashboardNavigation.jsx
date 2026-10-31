/**
 * AttendAI DashboardNavigation Component
 * Milestone 9.1: Dashboard Architecture and Shared Layout
 *
 * Implements role-specific navigation configurations and active route matching.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_CONFIG } from './navigationConfig';

export function DashboardNavigation({ role, onItemClick }) {
  const items = role && NAVIGATION_CONFIG[role] ? NAVIGATION_CONFIG[role] : [];

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="dashboard-navigation" aria-label="Dashboard Navigation">
      <ul className="dashboard-nav-list">
        {items.map((item) => (
          <li key={item.to} className="dashboard-nav-item">
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onItemClick}
              className={({ isActive }) =>
                `dashboard-nav-item__link ${
                  isActive ? 'dashboard-nav-item__link--active' : ''
                }`.trim()
              }
            >
              <span className="dashboard-nav-item__icon">{item.icon}</span>
              <span className="dashboard-nav-item__label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default DashboardNavigation;
