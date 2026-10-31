/**
 * AttendAI Admin Dashboard Component
 * Milestone 9.4: Admin Dashboard
 *
 * Implements the Administrative Console using the shared dashboard architecture.
 * Adheres to AttendAI security, authorization, and data integrity principles:
 * - Access strictly limited to authenticated, approved Administrators
 * - Respects Supabase Row Level Security (RLS) policies without bypass or elevation
 * - Displays authentic system metrics when permitted by database authorization
 * - Safely handles RLS restrictions without assuming zero users or inventing dummy statistics
 * - Links to existing Admin modules (User Management, Teacher Approvals, System Overview, Profile)
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  SlidersHorizontal,
  User,
  GraduationCap,
  Clock,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  Lock,
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';
import {
  getAdminSystemMetrics,
  getPendingTeacherApprovalsSummary,
} from '../../services/adminService';
import { formatAuthError } from '../../services/authService';
import { ROUTES } from '../../routes/routes';

export function AdminDashboard() {
  const { user, profile, isApproved, profileLoading, profileError, refreshProfile } = useAuth();

  // State for platform system metrics and approval counts
  const [metrics, setMetrics] = useState({
    studentsCount: null,
    teachersCount: null,
    approvedTeachersCount: null,
    pendingRequestsCount: null,
    totalUsersCount: null,
    isRestrictedByRls: false,
    isAvailable: false,
    error: null,
  });
  const [approvalsSummary, setApprovalsSummary] = useState({
    pendingCount: null,
    isRestricted: false,
    error: null,
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Fetch real system metrics for authenticated administrator
  useEffect(() => {
    let isMounted = true;

    async function loadAdminPlatformData() {
      if (!user?.id) {
        if (isMounted) setDataLoading(false);
        return;
      }

      setDataLoading(true);
      setDataError(null);

      try {
        const [metricsRes, approvalsRes] = await Promise.all([
          getAdminSystemMetrics(user.id),
          getPendingTeacherApprovalsSummary(user.id),
        ]);

        if (isMounted) {
          setMetrics(metricsRes);
          setApprovalsSummary(approvalsRes);
        }
      } catch (err) {
        if (isMounted) {
          setDataError(formatAuthError(err));
        }
      } finally {
        if (isMounted) {
          setDataLoading(false);
        }
      }
    }

    loadAdminPlatformData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Dynamic admin display name
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Administrator');

  // Format account registration date
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
      })
    : user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
      })
    : 'Active Term';

  const hasMetrics = metrics.isAvailable && metrics.totalUsersCount !== null;

  return (
    <DashboardLayout breadcrumb="Admin Console">
      {/* A. Personalized Welcome Section */}
      <DashboardPageHeader
        badge={
          <span className="dashboard-role-badge dashboard-role-badge--admin">
            System Administrator
          </span>
        }
        title={`Welcome back, ${displayName}`}
        subtitle="AttendAI Administrative Console. Monitor platform metrics, oversee user directories, and review faculty credential requests."
        actions={
          <div className="dashboard-header__badge-row">
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: '#fbbf24',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              Security Clearance: Tier 1 (Admin)
            </span>
          </div>
        }
      />

      {/* Profile Error Notice */}
      {profileError && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <ErrorMessage
            title="Profile loading notice"
            message={formatAuthError(profileError)}
          />
        </div>
      )}

      {/* Data Query Error Notice */}
      {dataError && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <ErrorMessage
            title="Platform telemetry notice"
            message={dataError}
          />
        </div>
      )}

      {/* RLS Policy Notice (if aggregate query is restricted by user-level RLS) */}
      {metrics.isRestrictedByRls && (
        <aside className="dashboard-security-notice" role="note" aria-label="Database Security Notice">
          <div className="dashboard-security-notice__icon" aria-hidden="true">
            <Lock size={20} />
          </div>
          <div className="dashboard-security-notice__content">
            <h3 className="dashboard-security-notice__title">
              Database Policy Notice: Global Metrics Restricted by RLS
            </h3>
            <p className="dashboard-security-notice__desc">
              Institution-wide user counts and platform statistics are currently restricted by the active
              Row Level Security policy (<code>auth.uid() = id</code>). In strict adherence to security rules,
              AttendAI does not fabricate dummy statistics. Real aggregate counts will appear when an administrative
              RLS policy or secure database function is deployed.
            </p>
          </div>
        </aside>
      )}

      {/* B. System Overview Section */}
      <section aria-labelledby="section-system-overview" style={{ marginBottom: 'var(--space-8)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div>
            <h2
              id="section-system-overview"
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              System Overview
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                margin: '2px 0 0',
              }}
            >
              Platform user statistics and credential request status computed from database records.
            </p>
          </div>
        </div>

        {dataLoading ? (
          <div className="dashboard-card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <LoadingIndicator message="Retrieving administrative telemetry..." />
          </div>
        ) : hasMetrics ? (
          /* Actual Statistics Display (when authorized records are available) */
          <div className="dashboard-stats-grid">
            {/* Total Registered Users */}
            <div className="dashboard-stat-card">
              <div
                className="dashboard-stat-card__icon-box dashboard-stat-card__icon-box--violet"
                aria-hidden="true"
              >
                <Users size={22} />
              </div>
              <div className="dashboard-stat-card__content">
                <span className="dashboard-stat-card__label">Total Registered Users</span>
                <span className="dashboard-stat-card__value">{metrics.totalUsersCount}</span>
                <span className="dashboard-stat-card__helper">All account profiles</span>
              </div>
            </div>

            {/* Total Students */}
            <div className="dashboard-stat-card">
              <div
                className="dashboard-stat-card__icon-box dashboard-stat-card__icon-box--cyan"
                aria-hidden="true"
              >
                <GraduationCap size={22} />
              </div>
              <div className="dashboard-stat-card__content">
                <span className="dashboard-stat-card__label">Registered Students</span>
                <span className="dashboard-stat-card__value">{metrics.studentsCount}</span>
                <span className="dashboard-stat-card__helper">Student accounts</span>
              </div>
            </div>

            {/* Total Teachers */}
            <div className="dashboard-stat-card">
              <div
                className="dashboard-stat-card__icon-box dashboard-stat-card__icon-box--amber"
                aria-hidden="true"
              >
                <ShieldCheck size={22} />
              </div>
              <div className="dashboard-stat-card__content">
                <span className="dashboard-stat-card__label">Registered Teachers</span>
                <span className="dashboard-stat-card__value">{metrics.teachersCount}</span>
                <span className="dashboard-stat-card__helper">Faculty accounts</span>
              </div>
            </div>

            {/* Approved Teachers */}
            <div className="dashboard-stat-card">
              <div
                className="dashboard-stat-card__icon-box dashboard-stat-card__icon-box--green"
                aria-hidden="true"
              >
                <CheckCircle2 size={22} />
              </div>
              <div className="dashboard-stat-card__content">
                <span className="dashboard-stat-card__label">Approved Teachers</span>
                <span className="dashboard-stat-card__value">{metrics.approvedTeachersCount}</span>
                <span className="dashboard-stat-card__helper">Active faculty</span>
              </div>
            </div>

            {/* Pending Teacher Requests */}
            <div className="dashboard-stat-card">
              <div
                className="dashboard-stat-card__icon-box dashboard-stat-card__icon-box--red"
                aria-hidden="true"
              >
                <Clock size={22} />
              </div>
              <div className="dashboard-stat-card__content">
                <span className="dashboard-stat-card__label">Pending Approvals</span>
                <span className="dashboard-stat-card__value">{metrics.pendingRequestsCount}</span>
                <span className="dashboard-stat-card__helper">Awaiting verification</span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Restricted State (No fabricated statistics) */
          <div className="dashboard-card" style={{ padding: 'var(--space-6)' }}>
            <EmptyState
              icon={<SlidersHorizontal size={36} />}
              title="System-Wide Statistics Restricted"
              description="Platform aggregate metrics require an administrative Row Level Security policy or dedicated RPC function to view records across all accounts. No dummy or fabricated statistics are displayed."
            />
          </div>
        )}
      </section>

      {/* Grid: User Management, Teacher Approvals & Admin Profile */}
      <div className="dashboard-grid">
        {/* C. Teacher Approvals Overview */}
        <section className="dashboard-card" aria-labelledby="card-teacher-approvals-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div
                className="dashboard-card__icon"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}
                aria-hidden="true"
              >
                <ShieldCheck size={18} />
              </div>
              <h3 id="card-teacher-approvals-title" className="dashboard-card__title">
                Teacher Approvals
              </h3>
            </div>
            <Link
              to={ROUTES.ADMIN_TEACHER_APPROVALS}
              style={{
                fontSize: 'var(--font-size-xs)',
                color: '#fbbf24',
                textDecoration: 'none',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Review Queue &rarr;
            </Link>
          </header>
          <div className="dashboard-card__body">
            {approvalsSummary.pendingCount !== null && approvalsSummary.pendingCount > 0 ? (
              <div className="dashboard-activity-list">
                <div className="dashboard-activity-item">
                  <div className="dashboard-activity-info">
                    <span className="dashboard-activity-subject">Faculty Applications Pending</span>
                    <span className="dashboard-activity-date">
                      {approvalsSummary.pendingCount} teacher {approvalsSummary.pendingCount === 1 ? 'request' : 'requests'} awaiting administrator verification
                    </span>
                  </div>
                  <span className="dashboard-status-pill dashboard-status-pill--pending">
                    Pending Review
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<ShieldCheck size={32} />}
                title="Teacher Approval Queue"
                description="Review pending teacher applications, inspect submitted institutional credentials, and assign verified faculty privileges in the Teacher Approvals portal."
              />
            )}
          </div>
        </section>

        {/* D. User Management Overview */}
        <section className="dashboard-card" aria-labelledby="card-user-management-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div
                className="dashboard-card__icon"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}
                aria-hidden="true"
              >
                <Users size={18} />
              </div>
              <h3 id="card-user-management-title" className="dashboard-card__title">
                User Management
              </h3>
            </div>
            <Link
              to={ROUTES.ADMIN_USERS}
              style={{
                fontSize: 'var(--font-size-xs)',
                color: '#fbbf24',
                textDecoration: 'none',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Directory Portal &rarr;
            </Link>
          </header>
          <div className="dashboard-card__body">
            <div className="dashboard-profile-list">
              <div className="dashboard-profile-item">
                <span className="dashboard-profile-label">Student Directory</span>
                <span className="dashboard-profile-value">
                  {metrics.studentsCount !== null ? `${metrics.studentsCount} Students` : 'Protected Directory'}
                </span>
              </div>
              <div className="dashboard-profile-item">
                <span className="dashboard-profile-label">Faculty Directory</span>
                <span className="dashboard-profile-value">
                  {metrics.teachersCount !== null ? `${metrics.teachersCount} Teachers` : 'Protected Directory'}
                </span>
              </div>
              <div className="dashboard-profile-item">
                <span className="dashboard-profile-label">Administrator Accounts</span>
                <span className="dashboard-profile-value">Governance Tier</span>
              </div>
            </div>
          </div>
        </section>

        {/* Admin Profile Overview */}
        <section className="dashboard-card" aria-labelledby="card-admin-profile-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div
                className="dashboard-card__icon"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}
                aria-hidden="true"
              >
                <User size={18} />
              </div>
              <h3 id="card-admin-profile-title" className="dashboard-card__title">
                Admin Profile
              </h3>
            </div>
            <span
              className="dashboard-card__badge"
              style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}
            >
              Root Tier
            </span>
          </header>
          <div className="dashboard-card__body">
            {profileLoading ? (
              <LoadingIndicator message="Loading administrator profile..." />
            ) : (
              <div className="dashboard-profile-list">
                <div className="dashboard-profile-item">
                  <span className="dashboard-profile-label">Administrator</span>
                  <span className="dashboard-profile-value">{displayName}</span>
                </div>
                <div className="dashboard-profile-item">
                  <span className="dashboard-profile-label">Institutional Email</span>
                  <span className="dashboard-profile-value">{user?.email || 'N/A'}</span>
                </div>
                <div className="dashboard-profile-item">
                  <span className="dashboard-profile-label">Portal Role</span>
                  <span
                    className="dashboard-profile-value"
                    style={{ color: '#fbbf24', textTransform: 'capitalize' }}
                  >
                    System Administrator (Active)
                  </span>
                </div>
                <div className="dashboard-profile-item">
                  <span className="dashboard-profile-label">Security Clearance</span>
                  <span
                    className="dashboard-profile-value"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: isApproved ? 'var(--color-success)' : 'var(--color-warning)',
                    }}
                  >
                    <CheckCircle2 size={14} /> Tier 1 Full Governance
                  </span>
                </div>
                <div className="dashboard-profile-item">
                  <span className="dashboard-profile-label">Member Since</span>
                  <span className="dashboard-profile-value">{memberSince}</span>
                </div>
              </div>
            )}

            {/* Non-intrusive refresh action if profile error occurs */}
            {profileError && (
              <button
                type="button"
                onClick={refreshProfile}
                style={{
                  marginTop: 'var(--space-3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 12px',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-xs)',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} /> Retry Profile Sync
              </button>
            )}
          </div>
        </section>
      </div>

      {/* E. Quick Actions Section */}
      <section aria-labelledby="section-admin-quick-actions" style={{ marginTop: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h2
            id="section-admin-quick-actions"
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Quick Actions
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              margin: '2px 0 0',
            }}
          >
            Direct navigation to administrative governance and review modules.
          </p>
        </div>

        <div className="dashboard-actions-grid">
          {/* Action 1: User Management */}
          <Link
            to={ROUTES.ADMIN_USERS}
            className="dashboard-action-card dashboard-action-card--admin"
            aria-label="Navigate to User Management"
          >
            <div className="dashboard-action-card__icon dashboard-action-card__icon--admin" aria-hidden="true">
              <Users size={20} />
            </div>
            <div className="dashboard-action-card__content">
              <h3 className="dashboard-action-card__title">User Management</h3>
              <p className="dashboard-action-card__desc">
                Inspect institutional directories, student accounts, and faculty roles.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-action-card__arrow" aria-hidden="true" />
          </Link>

          {/* Action 2: Teacher Approvals */}
          <Link
            to={ROUTES.ADMIN_TEACHER_APPROVALS}
            className="dashboard-action-card dashboard-action-card--admin"
            aria-label="Navigate to Teacher Approvals"
          >
            <div className="dashboard-action-card__icon dashboard-action-card__icon--admin" aria-hidden="true">
              <ShieldCheck size={20} />
            </div>
            <div className="dashboard-action-card__content">
              <h3 className="dashboard-action-card__title">Teacher Approvals</h3>
              <p className="dashboard-action-card__desc">
                Review submitted teacher applications and credential approval queue.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-action-card__arrow" aria-hidden="true" />
          </Link>

          {/* Action 3: System Overview */}
          <Link
            to={ROUTES.ADMIN_SYSTEM}
            className="dashboard-action-card dashboard-action-card--admin"
            aria-label="Navigate to System Overview"
          >
            <div className="dashboard-action-card__icon dashboard-action-card__icon--admin" aria-hidden="true">
              <BarChart3 size={20} />
            </div>
            <div className="dashboard-action-card__content">
              <h3 className="dashboard-action-card__title">System Overview</h3>
              <p className="dashboard-action-card__desc">
                Inspect database diagnostics, system health, and audit logs.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-action-card__arrow" aria-hidden="true" />
          </Link>

          {/* Action 4: My Profile */}
          <Link
            to={ROUTES.ADMIN_PROFILE}
            className="dashboard-action-card dashboard-action-card--admin"
            aria-label="Navigate to Admin Profile"
          >
            <div className="dashboard-action-card__icon dashboard-action-card__icon--admin" aria-hidden="true">
              <User size={20} />
            </div>
            <div className="dashboard-action-card__content">
              <h3 className="dashboard-action-card__title">My Profile</h3>
              <p className="dashboard-action-card__desc">
                View administrator credentials, clearance tier, and audit settings.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-action-card__arrow" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default AdminDashboard;
