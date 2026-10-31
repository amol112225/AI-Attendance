/**
 * AttendAI Student Dashboard Component
 * Milestone 9.2: Student Dashboard
 *
 * Implements the Student Dashboard using the shared dashboard architecture.
 * Adheres to AttendAI security and data integrity principles:
 * - Queries data exclusively for the authenticated user
 * - Renders dynamic profile information from AuthContext and public.profiles
 * - Displays authentic attendance calculations (formula: Attended / Total * 100)
 * - Renders meaningful empty states when backend tables/records do not exist
 * - Strictly avoids fabricated statistics or dummy records
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  BookOpen,
  User,
  Clock,
  ArrowRight,
  TrendingUp,
  XCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';
import { getStudentAttendance, getStudentSubjects } from '../../services/studentService';
import { formatAuthError } from '../../services/authService';
import { ROUTES } from '../../routes/routes';

export function StudentDashboard({ previewMode = false, onExitPreview = null }) {
  const { user, profile, profileLoading, profileError, refreshProfile } = useAuth();

  // State for academic attendance and subject records
  const [attendanceData, setAttendanceData] = useState({
    records: [],
    total: 0,
    attended: 0,
    missed: 0,
    rate: 0,
    isAvailable: false,
  });
  const [subjectsData, setSubjectsData] = useState({
    subjects: [],
    isAvailable: false,
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Fetch real attendance records and subjects for authenticated student
  useEffect(() => {
    let isMounted = true;

    async function loadStudentAcademicData() {
      // In preview mode, the authenticated user is an administrator previewing the UI;
      // Do not attempt to query student attendance tables with admin credentials.
      if (previewMode) {
        if (isMounted) {
          setAttendanceData({
            records: [],
            total: 0,
            attended: 0,
            missed: 0,
            rate: 0,
            isAvailable: true,
          });
          setSubjectsData({
            subjects: [],
            isAvailable: true,
          });
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
        const [attRes, subRes] = await Promise.all([
          getStudentAttendance(user.id),
          getStudentSubjects(user.id),
        ]);

        if (isMounted) {
          setAttendanceData(attRes);
          setSubjectsData(subRes);
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

    loadStudentAcademicData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, previewMode]);

  // Dynamic user display name
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Student');

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

  const hasAttendanceRecords = attendanceData.records && attendanceData.records.length > 0;
  const hasEnrolledSubjects = subjectsData.subjects && subjectsData.subjects.length > 0;

  return (
    <DashboardLayout breadcrumb="Student Portal">
      {/* Preview Mode Banner */}
      {previewMode && (
        <aside
          className="dashboard-preview-banner dashboard-preview-banner--student"
          role="region"
          aria-label="Preview Mode Notice"
        >
          <div className="dashboard-preview-banner__content">
            <span className="dashboard-preview-banner__badge">PREVIEW MODE</span>
            <div className="dashboard-preview-banner__text">
              <strong>Viewing as Student (UI Preview)</strong>
              <span>
                You are previewing the Student Dashboard with administrator privileges. No student session is active, and no student records have been altered.
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
          <span className="dashboard-role-badge dashboard-role-badge--student">
            Student Access
          </span>
        }
        title={`Welcome back, ${displayName}`}
        subtitle="Monitor your subject attendance, view recent activity records, and review your student profile."
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
              Academic Term 2026–27
            </span>
          </div>
        }
      />

      {/* Profile Error Banner (if database query encounters error) */}
      {profileError && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <ErrorMessage
            title="Profile loading notice"
            message={formatAuthError(profileError)}
          />
        </div>
      )}

      {/* Data Error Banner (if academic records query fails) */}
      {dataError && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <ErrorMessage
            title="Academic data loading notice"
            message={dataError}
          />
        </div>
      )}

      {/* 2. Attendance Overview Section */}
      <section aria-labelledby="section-attendance-overview" style={{ marginBottom: 'var(--space-8)' }}>
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
              id="section-attendance-overview"
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              Attendance Overview
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                margin: '2px 0 0',
              }}
            >
              Overall attendance metrics computed from verified academic sessions.
            </p>
          </div>
        </div>

        {dataLoading ? (
          <div className="dashboard-card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <LoadingIndicator message="Retrieving attendance records..." />
          </div>
        ) : hasAttendanceRecords ? (
          /* Actual Statistics Display (when real records exist) */
          <div className="dashboard-stats-grid">
            {/* Total Classes */}
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-card__icon-box dashboard-stat-card__icon-box--cyan" aria-hidden="true">
                <CalendarCheck size={22} />
              </div>
              <div className="dashboard-stat-card__content">
                <span className="dashboard-stat-card__label">Total Classes</span>
                <span className="dashboard-stat-card__value">{attendanceData.total}</span>
                <span className="dashboard-stat-card__helper">Conducted sessions</span>
              </div>
            </div>

            {/* Classes Attended */}
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-card__icon-box dashboard-stat-card__icon-box--green" aria-hidden="true">
                <CheckCircle2 size={22} />
              </div>
              <div className="dashboard-stat-card__content">
                <span className="dashboard-stat-card__label">Classes Attended</span>
                <span className="dashboard-stat-card__value">{attendanceData.attended}</span>
                <span className="dashboard-stat-card__helper">Verified present</span>
              </div>
            </div>

            {/* Classes Missed */}
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-card__icon-box dashboard-stat-card__icon-box--red" aria-hidden="true">
                <XCircle size={22} />
              </div>
              <div className="dashboard-stat-card__content">
                <span className="dashboard-stat-card__label">Classes Missed</span>
                <span className="dashboard-stat-card__value">{attendanceData.missed}</span>
                <span className="dashboard-stat-card__helper">Absent records</span>
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-card__icon-box dashboard-stat-card__icon-box--violet" aria-hidden="true">
                <TrendingUp size={22} />
              </div>
              <div className="dashboard-stat-card__content">
                <span className="dashboard-stat-card__label">Attendance Rate</span>
                <span className="dashboard-stat-card__value">{attendanceData.rate}%</span>
                <span className="dashboard-stat-card__helper">
                  {attendanceData.rate >= 75 ? 'Above 75% threshold' : 'Below recommended threshold'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State: Attendance tracking not active yet (No fabricated statistics) */
          <div className="dashboard-card" style={{ padding: 'var(--space-6)' }}>
            <EmptyState
              icon={<CalendarCheck size={36} />}
              title="Attendance Tracking Inactive"
              description="No attendance sessions have been logged for your account yet. Your attendance percentage, total classes attended, and missed sessions will be calculated here once faculty members initiate sessions."
            />
          </div>
        )}
      </section>

      {/* Grid: Recent Activity, My Subjects & Student Profile */}
      <div className="dashboard-grid">
        {/* 3. Recent Attendance Activity */}
        <section className="dashboard-card" aria-labelledby="card-activity-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div className="dashboard-card__icon" aria-hidden="true">
                <Clock size={18} />
              </div>
              <h3 id="card-activity-title" className="dashboard-card__title">
                Recent Attendance Activity
              </h3>
            </div>
            <span className="dashboard-card__badge">Live Feed</span>
          </header>
          <div className="dashboard-card__body">
            {dataLoading ? (
              <LoadingIndicator message="Loading recent activity..." />
            ) : hasAttendanceRecords ? (
              <div className="dashboard-activity-list">
                {attendanceData.records.slice(0, 5).map((record) => (
                  <div key={record.id} className="dashboard-activity-item">
                    <div className="dashboard-activity-info">
                      <span className="dashboard-activity-subject">{record.subject_name || 'Academic Class'}</span>
                      <span className="dashboard-activity-date">
                        {new Date(record.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {record.verification_method && ` • via ${record.verification_method}`}
                      </span>
                    </div>
                    <span
                      className={`dashboard-status-pill dashboard-status-pill--${
                        record.status?.toLowerCase() === 'present' ? 'present' : 'absent'
                      }`}
                    >
                      {record.status || 'Present'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Clock size={32} />}
                title="No Recent Activity"
                description="Verified session timestamps and attendance logs will appear here once you participate in classroom sessions."
              />
            )}
          </div>
        </section>

        {/* 4. My Subjects Section */}
        <section className="dashboard-card" aria-labelledby="card-subjects-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div className="dashboard-card__icon" aria-hidden="true">
                <BookOpen size={18} />
              </div>
              <h3 id="card-subjects-title" className="dashboard-card__title">
                My Subjects
              </h3>
            </div>
            <span className="dashboard-card__badge">Current Term</span>
          </header>
          <div className="dashboard-card__body">
            {dataLoading ? (
              <LoadingIndicator message="Checking enrolled subjects..." />
            ) : hasEnrolledSubjects ? (
              <div className="dashboard-activity-list">
                {subjectsData.subjects.map((sub) => (
                  <div key={sub.id || sub.subject_code} className="dashboard-activity-item">
                    <div className="dashboard-activity-info">
                      <span className="dashboard-activity-subject">{sub.subject_name}</span>
                      <span className="dashboard-activity-date">
                        {sub.subject_code} {sub.professor_name ? `• ${sub.professor_name}` : ''}
                      </span>
                    </div>
                    <span className="dashboard-card__badge">{sub.schedule || 'Enrolled'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<BookOpen size={32} />}
                title="No Enrolled Subjects Found"
                description="Your academic courses, subject codes, and faculty instructors will be listed here after academic roster synchronization."
              />
            )}
          </div>
        </section>

        {/* 6. Student Profile Integration */}
        <section className="dashboard-card" aria-labelledby="card-profile-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div className="dashboard-card__icon" aria-hidden="true">
                <User size={18} />
              </div>
              <h3 id="card-profile-title" className="dashboard-card__title">
                Student Profile
              </h3>
            </div>
            <span className="dashboard-card__badge">Verified</span>
          </header>
          <div className="dashboard-card__body">
            {profileLoading ? (
              <LoadingIndicator message="Loading profile information..." />
            ) : (
              <div className="dashboard-profile-list">
                <div className="dashboard-profile-item">
                  <span className="dashboard-profile-label">Student Name</span>
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
                    style={{ color: 'var(--color-brand-cyan)', textTransform: 'capitalize' }}
                  >
                    {profile?.role || 'Student'} (Active)
                  </span>
                </div>
                <div className="dashboard-profile-item">
                  <span className="dashboard-profile-label">Member Since</span>
                  <span className="dashboard-profile-value">{memberSince}</span>
                </div>
                <div className="dashboard-profile-item">
                  <span className="dashboard-profile-label">Account Verification</span>
                  <span
                    className="dashboard-profile-value"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--color-success)',
                    }}
                  >
                    <CheckCircle2 size={14} /> Verified Student
                  </span>
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

      {/* 5. Quick Actions Section */}
      <section aria-labelledby="section-quick-actions" style={{ marginTop: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h2
            id="section-quick-actions"
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
            Direct navigation to primary student academic modules.
          </p>
        </div>

        <div className="dashboard-actions-grid">
          {/* Action 1: My Attendance */}
          <Link
            to={ROUTES.STUDENT_ATTENDANCE}
            className="dashboard-action-card"
            aria-label="Navigate to My Attendance"
          >
            <div className="dashboard-action-card__icon" aria-hidden="true">
              <CalendarCheck size={20} />
            </div>
            <div className="dashboard-action-card__content">
              <h3 className="dashboard-action-card__title">My Attendance</h3>
              <p className="dashboard-action-card__desc">
                View attendance records, logs, and verification history.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-action-card__arrow" aria-hidden="true" />
          </Link>

          {/* Action 2: My Subjects */}
          <Link
            to={ROUTES.STUDENT_SUBJECTS}
            className="dashboard-action-card"
            aria-label="Navigate to My Subjects"
          >
            <div className="dashboard-action-card__icon" aria-hidden="true">
              <BookOpen size={20} />
            </div>
            <div className="dashboard-action-card__content">
              <h3 className="dashboard-action-card__title">My Subjects</h3>
              <p className="dashboard-action-card__desc">
                Review enrolled courses, instructors, and timetables.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-action-card__arrow" aria-hidden="true" />
          </Link>

          {/* Action 3: My Profile */}
          <Link
            to={ROUTES.STUDENT_PROFILE}
            className="dashboard-action-card"
            aria-label="Navigate to My Profile"
          >
            <div className="dashboard-action-card__icon" aria-hidden="true">
              <User size={20} />
            </div>
            <div className="dashboard-action-card__content">
              <h3 className="dashboard-action-card__title">My Profile</h3>
              <p className="dashboard-action-card__desc">
                Check personal details, account status, and credentials.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-action-card__arrow" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default StudentDashboard;
