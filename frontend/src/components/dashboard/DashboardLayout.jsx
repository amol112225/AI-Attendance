/**
 * AttendAI DashboardLayout Component
 * Milestone 9.1: Dashboard Architecture and Shared Layout
 *
 * Master shell providing shared sidebar, header, responsive drawer,
 * profile display, and logout integration across all role dashboards.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { ErrorMessage } from '../common/ErrorMessage';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { ROUTES } from '../../routes/routes';
import '../../styles/dashboard.css';

export function DashboardLayout({ children, breadcrumb = null }) {
  const navigate = useNavigate();
  const { user, profile, role, loading, profileLoading, profileError, logout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

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

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen]);

  const handleLogout = async () => {
    closeMobileSidebar();
    await logout();
    navigate(ROUTES.ROOT);
  };

  // Guard against flash during initial auth or active profile query
  if (loading || profileLoading) {
    return (
      <div className="dashboard-layout" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingIndicator centered size="lg" message="Loading dashboard environment..." />
      </div>
    );
  }

  // Safe error display if profile retrieval failed without guessing student/admin
  if (profileError && !profile) {
    return (
      <div className="dashboard-layout" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <ErrorMessage
          message="Could not load your user profile record. Please check your connection or sign in again."
          actionLabel="Sign Out"
          onAction={handleLogout}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
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
      />

      {/* Content Wrapper */}
      <div className="dashboard-content-wrapper">
        <DashboardHeader
          onMenuToggle={toggleMobileSidebar}
          role={role}
          user={user}
          profile={profile}
          onLogout={handleLogout}
          breadcrumb={breadcrumb}
        />

        <main className="dashboard-main" id="dashboard-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

