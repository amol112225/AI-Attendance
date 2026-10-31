/**
 * AttendAI Teacher Dashboard Component
 * Milestone 9.3: Teacher Dashboard
 *
 * Implements the Faculty Portal dashboard using the shared dashboard architecture.
 * Adheres to AttendAI security, authorization, and data integrity principles:
 * - Access strictly limited to authenticated, administratively approved Teachers
 * - Queries data exclusively scoped to the authenticated teacher's ID
 * - Renders dynamic profile information from AuthContext and public.profiles
 * - Displays authentic classroom and session metrics when available
 * - Renders informative, meaningful empty states when backend tables/records do not exist
 * - Strictly avoids fabricated metrics, dummy courses, or invented activities
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Clock,
  ClipboardList,
  User,
  BookOpen,
  Users,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';
import {
  getTeacherOverview,
  getTeacherClasses,
  getTeacherSessions,
  getTeacherRecentActivity,
} from '../../services/teacherService';
import { formatAuthError } from '../../services/authService';
import { ROUTES } from '../../routes/routes';

export function TeacherDashboard({ previewMode = false, onExitPreview = null }) {
  const { user, profile, isApproved, profileLoading, profileError, refreshProfile } = useAuth();

  // State for academic classes and session records
  const [overviewMetrics, setOverviewMetrics] = useState({
    totalClasses: 0,
    totalStudents: 0,
    activeSessions: 0,
    completedSessions: 0,
    isAvailable: false,
  });
  const [classesData, setClassesData] = useState({
    classes: [],
    isAvailable: false,
  });
  const [sessionsData, setSessionsData] = useState({
    sessions: [],
    isAvailable: false,
  });
  const [activitiesData, setActivitiesData] = useState({
    activities: [],
    isAvailable: false,
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Fetch real classes, sessions, and overview metrics for the authenticated teacher
  useEffect(() => {
    let isMounted = true;

    async function loadTeacherAcademicData() {
      // In preview mode, the authenticated user is an administrator previewing the UI;
      // Do not attempt to query faculty class tables with admin credentials.
      if (previewMode) {
        if (isMounted) {
          setOverviewMetrics({
            totalClasses: 0,
            totalStudents: 0,
            activeSessions: 0,
            completedSessions: 0,
            isAvailable: true,
          });
          setClassesData({ classes: [], isAvailable: true });
          setSessionsData({ sessions: [], isAvailable: true });
          setActivitiesData({ activities: [], isAvailable: true });
          setDataLoading(false);
        }
        return;
      }

      if (!user?.id) {
        if (isMounted) setDataLoading(false);
        return;
      }

      setDataLoading(true);
      setDataError(null);

      try {
        const [overviewRes, classesRes, sessionsRes, activityRes] = await Promise.all([
          getTeacherOverview(user.id),
          getTeacherClasses(user.id),
          getTeacherSessions(user.id),
          getTeacherRecentActivity(user.id),
        ]);

        if (isMounted) {
          setOverviewMetrics(overviewRes);
          setClassesData(classesRes);
          setSessionsData(sessionsRes);
          setActivitiesData(activityRes);
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

    loadTeacherAcademicData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, previewMode]);

  // Dynamic teacher display name
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Faculty Member');

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

  const hasClasses = classesData.classes && classesData.classes.length > 0;
  const hasSessions = sessionsData.sessions && sessionsData.sessions.length > 0;
  const hasActivities = activitiesData.activities && activitiesData.activities.length > 0;
  const hasOverviewData = overviewMetrics.isAvailable && overviewMetrics.totalClasses > 0;

  return (
    <DashboardLayout breadcrumb="Faculty Portal">
      {/* Preview Mode Banner */}
      {previewMode && (
        <aside
          className="dashboard-preview-banner dashboard-preview-banner--teacher"
          role="region"
          aria-label="Preview Mode Notice"
        >
          <div className="dashboard-preview-banner__content">
            <span className="dashboard-preview-banner__badge dashboard-preview-banner__badge--teacher">
              PREVIEW MODE
            </span>
            <div className="dashboard-preview-banner__text">
              <strong>Viewing as Teacher (UI Preview)</strong>
              <span>
                You are previewing the Faculty Portal with administrator privileges. No faculty session is active, and no teacher records have been altered.
              </span>
            </div>
          </div>
          {onExitPreview && (
            <button
              type="button"
              className="dashboard-preview-banner__exit-btn"
              onClick={onExitPreview}
            >
              Exit Preview Mode
            </button>
          )}
        </aside>
      )}

      {/* 1. Personalized Welcome Header */}
      <DashboardPageHeader
        badge={
          <span className="dashboard-role-badge dashboard-role-badge--teacher">
            Approved Faculty
          </span>
        }
        title={`Welcome back, ${displayName}`}
        subtitle="Manage assigned academic classes, supervise live attendance sessions, and review student attendance compliance."
        actions={
          <div className="dashboard-header__badge-row">
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              Faculty Status: Verified & Approved
            </span>
          </div>
        }
      />

      {/* Profile Error Notice (if profile query fails) */}
      {profileError && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <ErrorMessage
            title="Profile loading notice"
            message={formatAuthError(profileError)}
          />
        </div>
      )}

      {/* Academic Data Error Notice (if database query encounters error) */}
      {dataError && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <ErrorMessage
            title="Academic data loading notice"
            message={dataError}
          />
        </div>
      )}

      {/* 2. Dashboard Overview Section */}
      <section aria-labelledby="section-faculty-overview" style={{ marginBottom: 'var(--space-8)' }}>
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
              id="section-faculty-overview"
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              Academic Overview
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                margin: '2px 0 0',
              }}
            >
              Summary of assigned academic course sections, students, and attendance sessions.
            </p>
          </div>
        </div>

        {dataLoading ? (
          <div className="dashboard-card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <LoadingIndicator message="Retrieving faculty overview..." />
          </div>
        ) : hasOverviewData ? (
          /* Actual Statistics Display (when real records exist) */
          <div className="dashboard-stats-grid">
            {/* Total Classes */}
            <div className="dashboard-stat-card">
              <div
                className="dashboard-stat-card__icon-box dashboard-stat-card__icon-box--cyan"
                aria-hidden="true"
              >
                <BookOpen size={22} />
              </div>
              <div className="dashboard-stat-card__content">
                <span className="dashboard-stat-card__label">Assigned Classes</span>
                <span className="dashboard-stat-card__value">{overviewMetrics.totalClasses}</span>
                <span className="dashboard-stat-card__helper">Current term courses</span>
              </div>
            </div>

            {/* Enrolled Students */}
            <div className="dashboard-stat-card">
              <div
                className="dashboard-stat-card__icon-box dashboard-stat-card__icon-box--violet"
                aria-hidden="true"
              >
                <Users size={22} />
              </div>
              <div className="dashboard-stat-card__content">
                <span className="dashboard-stat-card__label">Total Students</span>
                <span className="dashboard-stat-card__value">{overviewMetrics.totalStudents}</span>
                <span className="dashboard-stat-card__helper">Enrolled roster size</span>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="dashboard-stat-card">
              <div
                className="dashboard-stat-card__icon-box dashboard-stat-card__icon-box--green"
                aria-hidden="true"
              >
                <Clock size={22} />
              </div>
              <div className="dashboard-stat-card__content">
                <span className="dashboard-stat-card__label">Active Sessions</span>
                <span className="dashboard-stat-card__value">{overviewMetrics.activeSessions}</span>
                <span className="dashboard-stat-card__helper">In-progress roll calls</span>
              </div>
            </div>

            {/* Completed Sessions */}
            <div className="dashboard-stat-card">
              <div
                className="dashboard-stat-card__icon-box dashboard-stat-card__icon-box--amber"
                aria-hidden="true"
              >
                <ClipboardList size={22} />
              </div>
              <div className="dashboard-stat-card__content">
                <span className="dashboard-stat-card__label">Completed Sessions</span>
                <span className="dashboard-stat-card__value">{overviewMetrics.completedSessions}</span>
                <span className="dashboard-stat-card__helper">Finalized logs</span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State: Classroom metrics inactive (No fabricated statistics) */
          <div className="dashboard-card" style={{ padding: 'var(--space-6)' }}>
            <EmptyState
              icon={<GraduationCap size={36} />}
              title="Classroom Metrics Inactive"
              description="Academic course allocations and classroom metrics will appear here once your lecture courses and student rosters are provisioned by the academic administration."
            />
          </div>
        )}
      </section>

      {/* Grid: My Classes, Attendance Sessions & Teacher Profile */}
      <div className="dashboard-grid">
        {/* 3. My Classes Section */}
        <section className="dashboard-card" aria-labelledby="card-teacher-classes-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div
                className="dashboard-card__icon"
                style={{ backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}
                aria-hidden="true"
              >
                <BookOpen size={18} />
              </div>
              <h3 id="card-teacher-classes-title" className="dashboard-card__title">
                My Classes
              </h3>
            </div>
            <Link
              to={ROUTES.TEACHER_CLASSES}
              style={{
                fontSize: 'var(--font-size-xs)',
                color: '#c084fc',
                textDecoration: 'none',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              View All &rarr;
            </Link>
          </header>
          <div className="dashboard-card__body">
            {dataLoading ? (
              <LoadingIndicator message="Checking assigned courses..." />
            ) : hasClasses ? (
              <div className="dashboard-activity-list">
                {classesData.classes.map((cls) => (
                  <div key={cls.id || cls.course_code} className="dashboard-activity-item">
                    <div className="dashboard-activity-info">
                      <span className="dashboard-activity-subject">{cls.name || cls.subject_name}</span>
                      <span className="dashboard-activity-date">
                        {cls.course_code} {cls.room ? `• Room ${cls.room}` : ''} {cls.schedule ? `• ${cls.schedule}` : ''}
                      </span>
                    </div>
                    <span className="dashboard-card__badge">
                      {cls.enrolled_count !== undefined ? `${cls.enrolled_count} Students` : 'Enrolled'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<BookOpen size={32} />}
                title="No Courses Assigned"
                description="You have not been assigned to any academic lecture courses or lab sections for this term yet. Course allocations will appear once synchronized by the department administration."
              />
            )}
          </div>
        </section>

        {/* 4. Attendance Sessions Overview */}
        <section className="dashboard-card" aria-labelledby="card-teacher-sessions-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div
                className="dashboard-card__icon"
                style={{ backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}
                aria-hidden="true"
              >
                <Clock size={18} />
              </div>
              <h3 id="card-teacher-sessions-title" className="dashboard-card__title">
                Attendance Sessions
              </h3>
            </div>
            <Link
              to={ROUTES.TEACHER_SESSIONS}
              style={{
                fontSize: 'var(--font-size-xs)',
                color: '#c084fc',
                textDecoration: 'none',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Session Manager &rarr;
            </Link>
          </header>
          <div className="dashboard-card__body">
            {dataLoading ? (
              <LoadingIndicator message="Loading attendance sessions..." />
            ) : hasSessions ? (
              <div className="dashboard-activity-list">
                {sessionsData.sessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="dashboard-activity-item">
                    <div className="dashboard-activity-info">
                      <span className="dashboard-activity-subject">
                        {session.class_name || 'Classroom Session'}
                      </span>
                      <span className="dashboard-activity-date">
                        {session.session_date
                          ? new Date(session.session_date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Scheduled'}
                        {session.present_count !== undefined && session.total_count
                          ? ` • ${session.present_count}/${session.total_count} Present`
                          : ''}
                      </span>
                    </div>
                    <span
                      className={`dashboard-status-pill dashboard-status-pill--${
                        session.status?.toLowerCase() === 'active'
                          ? 'active'
                          : session.status?.toLowerCase() === 'completed'
                          ? 'completed'
                          : 'pending'
                      }`}
                    >
                      {session.status || 'Scheduled'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Clock size={32} />}
                title="No Attendance Sessions"
                description="Live classroom attendance sessions and scheduled roll calls will be listed here once initiated through the Session Manager."
              />
            )}
          </div>
        </section>

        {/* 7. Teacher Profile Integration */}
        <section className="dashboard-card" aria-labelledby="card-teacher-profile-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div
                className="dashboard-card__icon"
                style={{ backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}
                aria-hidden="true"
              >
                <User size={18} />
              </div>
              <h3 id="card-teacher-profile-title" className="dashboard-card__title">
                Faculty Profile
              </h3>
            </div>
            <span className="dashboard-card__badge" style={{ color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.4)' }}>
              Faculty Tier
            </span>
          </header>
          <div className="dashboard-card__body">
            {profileLoading ? (
              <LoadingIndicator message="Loading faculty profile..." />
            ) : (
              <div className="dashboard-profile-list">
                <div className="dashboard-profile-item">
                  <span className="dashboard-profile-label">Faculty Member</span>
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
                    style={{ color: '#c084fc', textTransform: 'capitalize' }}
                  >
                    Teacher / Faculty
                  </span>
                </div>
                <div className="dashboard-profile-item">
                  <span className="dashboard-profile-label">Administrative Status</span>
                  <span
                    className="dashboard-profile-value"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: isApproved ? 'var(--color-success)' : 'var(--color-warning)',
                    }}
                  >
                    <CheckCircle2 size={14} /> {isApproved ? 'Approved Faculty Member' : 'Pending Verification'}
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

      {/* 5. Recent Activity Section */}
      <section aria-labelledby="section-recent-activity" style={{ marginTop: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h2
            id="section-recent-activity"
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Recent Activity
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              margin: '2px 0 0',
            }}
          >
            Chronological log of finalized classroom attendance sessions and course updates.
          </p>
        </div>

        <div className="dashboard-card" style={{ padding: 'var(--space-6)' }}>
          {dataLoading ? (
            <LoadingIndicator message="Checking recent activity logs..." />
          ) : hasActivities ? (
            <div className="dashboard-activity-list">
              {activitiesData.activities.map((act) => (
                <div key={act.id} className="dashboard-activity-item">
                  <div className="dashboard-activity-info">
                    <span className="dashboard-activity-subject">{act.class_name || 'Class Session'}</span>
                    <span className="dashboard-activity-date">
                      {act.created_at
                        ? new Date(act.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recently'}
                    </span>
                  </div>
                  <span
                    className={`dashboard-status-pill dashboard-status-pill--${
                      act.status?.toLowerCase() === 'completed' ? 'completed' : 'active'
                    }`}
                  >
                    {act.status || 'Logged'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ClipboardList size={32} />}
              title="No Recent Activity"
              description="Chronological attendance records, session completions, and compliance logs will be recorded here as sessions take place."
            />
          )}
        </div>
      </section>

      {/* 6. Quick Actions Section */}
      <section aria-labelledby="section-teacher-quick-actions" style={{ marginTop: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h2
            id="section-teacher-quick-actions"
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
            Direct navigation to primary faculty teaching and attendance management modules.
          </p>
        </div>

        <div className="dashboard-actions-grid">
          {/* Action 1: My Classes */}
          <Link
            to={ROUTES.TEACHER_CLASSES}
            className="dashboard-action-card dashboard-action-card--teacher"
            aria-label="Navigate to My Classes"
          >
            <div className="dashboard-action-card__icon dashboard-action-card__icon--teacher" aria-hidden="true">
              <BookOpen size={20} />
            </div>
            <div className="dashboard-action-card__content">
              <h3 className="dashboard-action-card__title">My Classes</h3>
              <p className="dashboard-action-card__desc">
                View assigned course sections, student rosters, and schedules.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-action-card__arrow" aria-hidden="true" />
          </Link>

          {/* Action 2: Attendance Sessions */}
          <Link
            to={ROUTES.TEACHER_SESSIONS}
            className="dashboard-action-card dashboard-action-card--teacher"
            aria-label="Navigate to Attendance Sessions"
          >
            <div className="dashboard-action-card__icon dashboard-action-card__icon--teacher" aria-hidden="true">
              <Clock size={20} />
            </div>
            <div className="dashboard-action-card__content">
              <h3 className="dashboard-action-card__title">Attendance Sessions</h3>
              <p className="dashboard-action-card__desc">
                Supervise active classroom roll calls and review live attendance feeds.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-action-card__arrow" aria-hidden="true" />
          </Link>

          {/* Action 3: Attendance Records */}
          <Link
            to={ROUTES.TEACHER_RECORDS}
            className="dashboard-action-card dashboard-action-card--teacher"
            aria-label="Navigate to Attendance Records"
          >
            <div className="dashboard-action-card__icon dashboard-action-card__icon--teacher" aria-hidden="true">
              <ClipboardList size={20} />
            </div>
            <div className="dashboard-action-card__content">
              <h3 className="dashboard-action-card__title">Attendance Records</h3>
              <p className="dashboard-action-card__desc">
                Inspect historical attendance records, compliance logs, and export reports.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-action-card__arrow" aria-hidden="true" />
          </Link>

          {/* Action 4: My Profile */}
          <Link
            to={ROUTES.TEACHER_PROFILE}
            className="dashboard-action-card dashboard-action-card--teacher"
            aria-label="Navigate to Faculty Profile"
          >
            <div className="dashboard-action-card__icon dashboard-action-card__icon--teacher" aria-hidden="true">
              <User size={20} />
            </div>
            <div className="dashboard-action-card__content">
              <h3 className="dashboard-action-card__title">My Profile</h3>
              <p className="dashboard-action-card__desc">
                Review verified faculty credentials, institutional email, and status.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-action-card__arrow" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default TeacherDashboard;
