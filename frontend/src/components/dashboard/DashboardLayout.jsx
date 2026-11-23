/**
 * AttendAI DashboardLayout Component
 * Milestone 9.1: Dashboard Architecture and Shared Layout
 *
 * Master shell providing shared sidebar, header, responsive drawer,
 * profile display, and logout integration across all role dashboards.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { ErrorMessage } from '../common/ErrorMessage';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { NAVIGATION_CONFIG } from './navigationConfig';
import { ROLES } from '../../routes/accessRules';
import { ROUTES } from '../../routes/routes';
import '../../styles/dashboard.css';

export function DashboardLayout({ children, breadcrumb = null }) {
  const navigate = useNavigate();
  const { user, profile, role, loading, profileLoading, profileError, logout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 1023px)').matches
      : false
  );

  const sidebarRef = useRef(null);
  const sidebarCloseBtnRef = useRef(null);
  const menuToggleBtnRef = useRef(null);
  const contentWrapperRef = useRef(null);
  const wasSidebarOpenRef = useRef(false);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  // Track desktop/mobile drawer breakpoint so inert + focus only engage on mobile viewports
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mq = window.matchMedia('(max-width: 1023px)');
    const syncViewport = () => {
      setIsMobileViewport(mq.matches);
    };
    syncViewport();
    mq.addEventListener('change', syncViewport);
    return () => mq.removeEventListener('change', syncViewport);
  }, []);

  // Keep page title reflective of current portal section
  useEffect(() => {
    document.title = breadcrumb ? `${breadcrumb} — AttendAI` : 'AttendAI Portal';
    return () => {
      document.title = 'AttendAI — AI Attendance Management';
    };
  }, [breadcrumb]);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        closeMobileSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen, closeMobileSidebar]);

  // Auto-close mobile drawer when window resizes to desktop view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        closeMobileSidebar();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeMobileSidebar]);

  // Manage body scroll, inert outside/hidden regions, and focus return for mobile drawer
  useEffect(() => {
    const contentEl = contentWrapperRef.current;
    const sidebarEl = sidebarRef.current;

    if (contentEl) {
      contentEl.inert = isMobileViewport && isMobileSidebarOpen;
    }
    if (sidebarEl) {
      sidebarEl.inert = isMobileViewport && !isMobileSidebarOpen;
    }

    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
      if (!wasSidebarOpenRef.current) {
        requestAnimationFrame(() => {
          sidebarCloseBtnRef.current?.focus();
        });
      }
    } else {
      document.body.style.overflow = '';
      if (wasSidebarOpenRef.current && isMobileViewport) {
        requestAnimationFrame(() => {
          menuToggleBtnRef.current?.focus();
        });
      }
    }
    wasSidebarOpenRef.current = isMobileSidebarOpen;

    return () => {
      document.body.style.overflow = '';
      if (contentEl) contentEl.inert = false;
      if (sidebarEl) sidebarEl.inert = false;
    };
  }, [isMobileSidebarOpen, isMobileViewport]);

  const handleLogout = async () => {
    closeMobileSidebar();
    await logout();
    navigate(ROUTES.ROOT);
  };

  // Guard against flash during initial auth or active profile query
  if (loading || profileLoading) {
    return (
      <div className="dashboard-layout" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingIndicator centered size="lg" message="Loading dashboard environment..." />
      </div>
    );
  }

  // Safe error display if profile retrieval failed without guessing student/admin
  if (profileError && !profile) {
    return (
      <div className="dashboard-layout" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <ErrorMessage
          message="Could not load your user profile record. Please check your connection or sign in again."
          actionLabel="Sign Out"
          onAction={handleLogout}
        />
      </div>
    );
  }

  const studentMobileNavItems =
    role === ROLES.STUDENT ? NAVIGATION_CONFIG[ROLES.STUDENT] || [] : [];

  return (
    <div className="dashboard-layout">
      <a href="#dashboard-main-content" className="dashboard-skip-link">
        Skip to main content
      </a>

      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="dashboard-backdrop"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Persistent / Off-canvas Sidebar */}
      <DashboardSidebar
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
        role={role}
        user={user}
        profile={profile}
        onLogout={handleLogout}
        sidebarRef={sidebarRef}
        closeButtonRef={sidebarCloseBtnRef}
      />

      {/* Content Wrapper */}
      <div ref={contentWrapperRef} className="dashboard-content-wrapper">
        <DashboardHeader
          onMenuToggle={toggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
          menuToggleButtonRef={menuToggleBtnRef}
          role={role}
          user={user}
          profile={profile}
          onLogout={handleLogout}
          breadcrumb={breadcrumb}
        />

        {studentMobileNavItems.length > 0 && (
          <nav className="dashboard-mobile-nav" aria-label="Student Portal Sections">
            <ul className="dashboard-mobile-nav__list">
              {studentMobileNavItems.map((item) => (
                <li key={item.to} className="dashboard-mobile-nav__item">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `dashboard-mobile-nav__link ${
                        isActive ? 'dashboard-mobile-nav__link--active' : ''
                      }`.trim()
                    }
                  >
                    <span className="dashboard-mobile-nav__icon">{item.icon}</span>
                    <span className="dashboard-mobile-nav__label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <main className="dashboard-main" id="dashboard-main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

