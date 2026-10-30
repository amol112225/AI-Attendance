/**
 * AttendAI StudentDashboard Component
 * Milestone 9.1: Dashboard Architecture and Shared Layout
 *
 * Implements the Student Dashboard placeholder using the shared DashboardLayout.
 */

import React from 'react';
import { CalendarCheck, BookOpen, User } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';

export function StudentDashboard() {
  const { user, profile } = useAuth();

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Student');

  return (
    <DashboardLayout breadcrumb="Student Portal">
      <DashboardPageHeader
        badge={
          <span className="dashboard-role-badge dashboard-role-badge--student">
            Student Access
          </span>
        }
        title="Student Dashboard"
        subtitle={`Welcome back, ${displayName}. Track attendance records and view your enrolled academic subjects.`}
      />

      <div className="dashboard-grid">
        {/* Card 1: Attendance History Placeholder */}
        <section className="dashboard-card" aria-labelledby="card-attendance-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div className="dashboard-card__icon" aria-hidden="true">
                <CalendarCheck size={18} />
              </div>
              <h2 id="card-attendance-title" className="dashboard-card__title">
                My Attendance
              </h2>
            </div>
            <span className="dashboard-card__badge">Upcoming</span>
          </header>
          <div className="dashboard-card__body">
            <EmptyState
              icon={<CalendarCheck size={36} />}
              title="No attendance records found"
              description="Your attendance logs, session timestamps, and verification history will appear here once classes begin."
            />
          </div>
        </section>

        {/* Card 2: Enrolled Subjects Placeholder */}
        <section className="dashboard-card" aria-labelledby="card-subjects-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div className="dashboard-card__icon" aria-hidden="true">
                <BookOpen size={18} />
              </div>
              <h2 id="card-subjects-title" className="dashboard-card__title">
                My Subjects
              </h2>
            </div>
            <span className="dashboard-card__badge">Current Term</span>
          </header>
          <div className="dashboard-card__body">
            <EmptyState
              icon={<BookOpen size={36} />}
              title="No enrolled subjects yet"
              description="Enrolled courses, professors, and scheduled class sessions will be listed here after academic roster synchronization."
            />
          </div>
        </section>

        {/* Card 3: Student Profile Overview */}
        <section className="dashboard-card" aria-labelledby="card-profile-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div className="dashboard-card__icon" aria-hidden="true">
                <User size={18} />
              </div>
              <h2 id="card-profile-title" className="dashboard-card__title">
                Account Overview
              </h2>
            </div>
            <span className="dashboard-card__badge">Active</span>
          </header>
          <div className="dashboard-card__body" style={{ gap: 'var(--space-3)' }}>
            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Registered Name
              </span>
              <p style={{ margin: 0, fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                {displayName}
              </p>
            </div>
            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Email Address
              </span>
              <p style={{ margin: 0, fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                {user?.email || 'N/A'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Account Role
              </span>
              <p style={{ margin: 0, fontWeight: 'var(--font-weight-medium)', color: 'var(--color-brand-cyan)' }}>
                Student (Verified)
              </p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default StudentDashboard;

