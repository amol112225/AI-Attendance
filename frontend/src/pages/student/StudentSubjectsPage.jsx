/**
 * AttendAI – My Subjects Page
 * Student Portal: Enrolled subjects, course codes, instructors, and attendance rates.
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  User,
  Hash,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { useAuth } from '../../hooks/useAuth';
import {
  getStudentSubjects,
  getStudentAttendance,
  calculateAttendancePercentage,
} from '../../services/studentService';
import './StudentPortal.css';

export function StudentSubjectsPage() {
  const { user } = useAuth();
  const [subjectsData, setSubjectsData] = useState({ subjects: [], isAvailable: false });
  const [subjectAttendance, setSubjectAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user?.id) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const [sub, att] = await Promise.all([
          getStudentSubjects(user.id),
          getStudentAttendance(user.id),
        ]);
        if (isMounted) {
          setSubjectsData(sub);

          // Map attendance statistics per subject name
          const attMap = {};
          (att.records || []).forEach((r) => {
            const name = r.subject_name || '';
            if (!attMap[name]) attMap[name] = { attended: 0, total: 0 };
            attMap[name].total += 1;
            if (r.status && r.status.toLowerCase() === 'present') {
              attMap[name].attended += 1;
            }
          });
          setSubjectAttendance(attMap);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, refreshKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
  };

  const hasSubjects = subjectsData.subjects && subjectsData.subjects.length > 0;

  return (
    <DashboardLayout breadcrumb="My Subjects">
      <DashboardPageHeader
        badge={
          <span className="dashboard-role-badge dashboard-role-badge--student">
            Academic Roster
          </span>
        }
        title="My Subjects"
        subtitle="Review your enrolled courses, faculty instructors, and subject-wise attendance percentages."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {hasSubjects && (
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
                {subjectsData.subjects.length} Enrolled Course
                {subjectsData.subjects.length === 1 ? '' : 's'}
              </span>
            )}
            <button
              type="button"
              className="sp-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh subjects data"
            >
              <RefreshCw size={14} className={refreshing ? 'sp-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        }
      />

      {loading ? (
        <div
          className="dashboard-card"
          style={{ padding: 'var(--space-10)', textAlign: 'center' }}
        >
          <LoadingIndicator message="Loading your enrolled subjects…" />
        </div>
      ) : !hasSubjects ? (
        <div className="dashboard-card" style={{ padding: 'var(--space-8)' }}>
          <EmptyState
            icon={<BookOpen size={40} />}
            title="No Enrolled Subjects Found"
            description="Your academic subjects, course codes, and faculty instructors will be listed here after academic roster synchronization by your institution. If you believe this is an error, please contact your department coordinator."
          />
        </div>
      ) : (
        <div className="sp-subjects-grid">
          {subjectsData.subjects.map((subject) => {
            const attInfo = subjectAttendance[subject.subject_name] || null;
            const hasAttendance = attInfo && attInfo.total > 0;
            const rate = hasAttendance
              ? calculateAttendancePercentage(attInfo.attended, attInfo.total)
              : null;
            const isGood = rate !== null && rate >= 75;

            return (
              <article
                key={subject.id || subject.subject_code || subject.subject_name}
                className="sp-subject-card"
                aria-label={`Subject card for ${subject.subject_name}`}
              >
                {/* Header */}
                <div className="sp-subject-card__header">
                  <div className="sp-subject-card__icon" aria-hidden="true">
                    <BookOpen size={20} />
                  </div>
                  <div className="sp-subject-card__title-wrap">
                    <h3 className="sp-subject-card__name">{subject.subject_name}</h3>
                    {subject.subject_code && (
                      <span className="sp-subject-card__code">
                        <Hash size={12} aria-hidden="true" /> {subject.subject_code}
                      </span>
                    )}
                  </div>
                </div>

                {/* Instructor & Timetable Details */}
                <div className="sp-subject-card__details">
                  <div className="sp-subject-detail-item">
                    <User size={14} aria-hidden="true" style={{ color: 'var(--color-brand-cyan)' }} />
                    <span>
                      {subject.professor_name
                        ? `Prof. ${subject.professor_name}`
                        : 'Instructor: Faculty Coordinator'}
                    </span>
                  </div>

                  {subject.schedule && (
                    <div className="sp-subject-detail-item">
                      <Clock size={14} aria-hidden="true" style={{ color: 'var(--color-brand-violet)' }} />
                      <span>{subject.schedule}</span>
                    </div>
                  )}
                </div>

                {/* Attendance Rate */}
                <div className="sp-subject-card__attendance-box">
                  <div className="sp-subject-att-header">
                    <span>Course Attendance</span>
                    {hasAttendance ? (
                      <span
                        className={`sp-subject-att-rate ${
                          isGood
                            ? 'sp-subject-att-rate--good'
                            : 'sp-subject-att-rate--low'
                        }`}
                      >
                        {rate}% {isGood ? '• On Track' : '• Shortage'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        Pending sessions
                      </span>
                    )}
                  </div>

                  {hasAttendance ? (
                    <>
                      <div className="sp-progress-bar-wrap">
                        <div
                          className={`sp-progress-fill ${
                            isGood
                              ? 'sp-progress-fill--good'
                              : 'sp-progress-fill--low'
                          }`}
                          style={{ width: `${rate}%` }}
                          role="progressbar"
                          aria-valuenow={rate}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${subject.subject_name} attendance: ${rate}%`}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {attInfo.attended} of {attInfo.total} sessions attended
                      </span>
                    </>
                  ) : (
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)',
                        fontStyle: 'italic',
                      }}
                    >
                      No attendance sessions conducted yet for this course.
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

export default StudentSubjectsPage;
