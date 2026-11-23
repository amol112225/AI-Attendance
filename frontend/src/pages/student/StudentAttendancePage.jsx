/**
 * AttendAI – My Attendance Page
 * Student Portal: Overall attendance spotlight, subject-wise breakdown, and session history.
 */

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  BookOpen,
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { useAuth } from '../../hooks/useAuth';
import {
  getStudentAttendance,
  getStudentSubjects,
  calculateAttendancePercentage,
} from '../../services/studentService';
import './StudentPortal.css';

export function StudentAttendancePage() {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState({
    records: [],
    total: 0,
    attended: 0,
    missed: 0,
    rate: 0,
    isAvailable: false,
  });
  const [subjectsData, setSubjectsData] = useState({ subjects: [], isAvailable: false });
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
        const [att, sub] = await Promise.all([
          getStudentAttendance(user.id),
          getStudentSubjects(user.id),
        ]);
        if (isMounted) {
          setAttendanceData(att);
          setSubjectsData(sub);
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

  // Build subject-wise breakdown aggregating attendance records per subject
  const subjectStats = {};

  // First seed with enrolled subjects if available
  if (subjectsData.subjects && subjectsData.subjects.length > 0) {
    subjectsData.subjects.forEach((sub) => {
      subjectStats[sub.subject_name] = {
        code: sub.subject_code || '',
        attended: 0,
        total: 0,
      };
    });
  }

  // Accumulate recorded sessions
  (attendanceData.records || []).forEach((r) => {
    const name = r.subject_name || 'General Academic Session';
    if (!subjectStats[name]) {
      subjectStats[name] = { code: '', attended: 0, total: 0 };
    }
    subjectStats[name].total += 1;
    if (r.status && r.status.toLowerCase() === 'present') {
      subjectStats[name].attended += 1;
    }
  });

  const subjectList = Object.entries(subjectStats).map(([name, s]) => ({
    name,
    code: s.code,
    attended: s.attended,
    total: s.total,
    rate: calculateAttendancePercentage(s.attended, s.total),
  }));

  const hasRecords = attendanceData.records && attendanceData.records.length > 0;
  const isAboveThreshold = attendanceData.rate >= 75;

  return (
    <DashboardLayout breadcrumb="My Attendance">
      <DashboardPageHeader
        badge={
          <span className="dashboard-role-badge dashboard-role-badge--student">
            My Attendance
          </span>
        }
        title="My Attendance"
        subtitle="Monitor your overall attendance rate, subject-wise breakdown, and verified attendance history."
        actions={
          <button
            type="button"
            className="sp-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh attendance data"
          >
            <RefreshCw size={14} className={refreshing ? 'sp-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh Data'}
          </button>
        }
      />

      {loading ? (
        <div
          className="dashboard-card"
          style={{ padding: 'var(--space-10)', textAlign: 'center' }}
        >
          <LoadingIndicator message="Retrieving your attendance records…" />
        </div>
      ) : !hasRecords ? (
        /* Empty State: Attendance tracking not active yet */
        <div className="dashboard-card" style={{ padding: 'var(--space-8)' }}>
          <EmptyState
            icon={<CalendarCheck size={40} />}
            title="No Attendance Sessions Recorded Yet"
            description="Your verified attendance percentage, subject breakdown, and session history will appear here once faculty members begin conducting classes for your enrolled courses."
          />
        </div>
      ) : (
        <>
          {/* 1. Overall Attendance Hero Spotlight Card */}
          <section aria-labelledby="sp-attendance-spotlight-title">
            <h2 id="sp-attendance-spotlight-title" className="sr-only">
              Attendance Overview
            </h2>
            <div className="sp-attendance-hero">
              <div className="sp-attendance-hero__top">
                <div className="sp-attendance-hero__spotlight">
                  <div className="sp-hero-percentage-box">
                    <span className="sp-hero-percentage-label">
                      Overall Attendance Rate
                    </span>
                    <span
                      className={`sp-hero-percentage-value ${
                        attendanceData.total === 0
                          ? 'sp-hero-percentage-value--neutral'
                          : isAboveThreshold
                          ? 'sp-hero-percentage-value--good'
                          : 'sp-hero-percentage-value--low'
                      }`}
                    >
                      {attendanceData.rate}%
                    </span>

                    {/* Status Pill */}
                    {attendanceData.total === 0 ? (
                      <span className="sp-hero-status-pill sp-hero-status-pill--neutral">
                        <CalendarCheck size={14} /> Term in Progress
                      </span>
                    ) : isAboveThreshold ? (
                      <span className="sp-hero-status-pill sp-hero-status-pill--good">
                        <CheckCircle2 size={14} /> Eligible for Examinations (≥ 75%)
                      </span>
                    ) : (
                      <span className="sp-hero-status-pill sp-hero-status-pill--low">
                        <AlertCircle size={14} /> Attendance Shortage (&lt; 75% Requirement)
                      </span>
                    )}
                  </div>
                </div>

                {/* 3 Secondary Mini-Stats */}
                <div className="sp-attendance-hero__stats-row">
                  <div className="sp-mini-stat-card">
                    <span className="sp-mini-stat-label">Conducted</span>
                    <span className="sp-mini-stat-value sp-mini-stat-value--cyan">
                      {attendanceData.total}
                    </span>
                  </div>
                  <div className="sp-mini-stat-card">
                    <span className="sp-mini-stat-label">Attended</span>
                    <span className="sp-mini-stat-value sp-mini-stat-value--green">
                      {attendanceData.attended}
                    </span>
                  </div>
                  <div className="sp-mini-stat-card">
                    <span className="sp-mini-stat-label">Missed</span>
                    <span className="sp-mini-stat-value sp-mini-stat-value--red">
                      {attendanceData.missed}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar with 75% Institutional Threshold Marker */}
              <div className="sp-threshold-container">
                <div className="sp-threshold-header">
                  <span>Attendance Progress</span>
                  <span>Institutional Requirement: 75%</span>
                </div>
                <div className="sp-threshold-track">
                  <div
                    className={`sp-threshold-fill ${
                      isAboveThreshold
                        ? 'sp-threshold-fill--good'
                        : 'sp-threshold-fill--low'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, attendanceData.rate))}%` }}
                    role="progressbar"
                    aria-valuenow={attendanceData.rate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Overall attendance: ${attendanceData.rate}%`}
                  />
                  <div className="sp-threshold-marker" title="75% Attendance Benchmark" />
                  <span className="sp-threshold-marker-label">75% Target</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Subject-wise Attendance Breakdown */}
          {subjectList.length > 0 && (
            <section
              aria-labelledby="sp-subject-breakdown-title"
              className="sp-subject-breakdown-card"
            >
              <div className="sp-section-header">
                <div>
                  <h2 id="sp-subject-breakdown-title" className="sp-section-title">
                    <BookOpen size={18} aria-hidden="true" /> Subject-wise Attendance
                  </h2>
                  <p className="sp-section-subtitle">
                    Attendance breakdown per course to help you maintain eligibility.
                  </p>
                </div>
              </div>

              <div className="sp-subject-list">
                {subjectList.map((subject) => {
                  const subjectOnTrack = subject.rate >= 75;
                  return (
                    <div key={subject.name} className="sp-subject-row">
                      <div className="sp-subject-row__info">
                        <span className="sp-subject-row__title">{subject.name}</span>
                        <span className="sp-subject-row__meta">
                          {subject.code ? `${subject.code} • ` : ''}
                          {subject.total > 0
                            ? `${subject.attended} of ${subject.total} classes attended`
                            : 'No sessions conducted yet'}
                        </span>
                      </div>

                      <div className="sp-subject-row__progress-section">
                        <div className="sp-progress-bar-wrap">
                          <div
                            className={`sp-progress-fill ${
                              subjectOnTrack
                                ? 'sp-progress-fill--good'
                                : 'sp-progress-fill--low'
                            }`}
                            style={{ width: `${subject.rate}%` }}
                            role="progressbar"
                            aria-valuenow={subject.rate}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${subject.name}: ${subject.rate}%`}
                          />
                        </div>
                        <span
                          className={`sp-subject-badge ${
                            subjectOnTrack
                              ? 'sp-subject-badge--good'
                              : 'sp-subject-badge--low'
                          }`}
                        >
                          {subject.rate}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. Scannable Attendance History Table */}
          <section
            aria-labelledby="sp-attendance-history-title"
            className="sp-history-card"
          >
            <div className="sp-section-header">
              <div>
                <h2 id="sp-attendance-history-title" className="sp-section-title">
                  <Clock size={18} aria-hidden="true" /> Attendance History
                </h2>
                <p className="sp-section-subtitle">
                  Verified log of all classroom sessions and verification methods.
                </p>
              </div>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Showing {attendanceData.records.length} record
                {attendanceData.records.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="sp-table-container">
              <table className="sp-table" aria-label="Attendance history log">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Subject</th>
                    <th scope="col">Verification Method</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.records.map((record) => {
                    const isPresent =
                      record.status && record.status.toLowerCase() === 'present';
                    const formattedDate = record.created_at
                      ? new Date(record.created_at).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—';

                    return (
                      <tr key={record.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{formattedDate}</td>
                        <td style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          {record.subject_name || 'Academic Class'}
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>
                          {record.verification_method || 'Standard System'}
                        </td>
                        <td>
                          <span
                            className={`sp-status-badge ${
                              isPresent
                                ? 'sp-status-badge--present'
                                : 'sp-status-badge--absent'
                            }`}
                          >
                            {isPresent ? (
                              <CheckCircle2 size={12} aria-hidden="true" />
                            ) : (
                              <XCircle size={12} aria-hidden="true" />
                            )}
                            {record.status || (isPresent ? 'Present' : 'Absent')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default StudentAttendancePage;
