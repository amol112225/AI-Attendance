/**
 * AttendAI TeacherDashboard Component
 * Milestone 9.1: Dashboard Architecture and Shared Layout
 *
 * Implements the Faculty Portal placeholder using the shared DashboardLayout.
 */

import React from 'react';
import { GraduationCap, Clock, ClipboardList } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';

export function TeacherDashboard() {
  const { user, profile } = useAuth();

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Faculty Member');

  return (
    <DashboardLayout breadcrumb="Faculty Portal">
      <DashboardPageHeader
        badge={
          <span className="dashboard-role-badge dashboard-role-badge--teacher">
            Approved Faculty
          </span>
        }
        title="Faculty Portal"
        subtitle={`Welcome back, ${displayName}. Manage assigned classes, launch attendance sessions, and inspect records.`}
      />

      <div className="dashboard-grid">
        {/* Card 1: My Classes Placeholder */}
        <section className="dashboard-card" aria-labelledby="card-classes-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div className="dashboard-card__icon" aria-hidden="true">
                <GraduationCap size={18} />
              </div>
              <h2 id="card-classes-title" className="dashboard-card__title">
                My Classes
              </h2>
            </div>
            <span className="dashboard-card__badge">Academic Term</span>
          </header>
          <div className="dashboard-card__body">
            <EmptyState
              icon={<GraduationCap size={36} />}
              title="No courses assigned yet"
              description="Assigned academic classes, lecture sections, and enrolled student rosters will appear here."
            />
          </div>
        </section>

        {/* Card 2: Attendance Sessions Placeholder */}
        <section className="dashboard-card" aria-labelledby="card-sessions-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div className="dashboard-card__icon" aria-hidden="true">
                <Clock size={18} />
              </div>
              <h2 id="card-sessions-title" className="dashboard-card__title">
                Attendance Sessions
              </h2>
            </div>
            <span className="dashboard-card__badge">Session Control</span>
          </header>
          <div className="dashboard-card__body">
            <EmptyState
              icon={<Clock size={36} />}
              title="No active attendance sessions"
              description="Launch live AI-assisted attendance sessions or schedule upcoming classroom roll calls in this module."
            />
          </div>
        </section>

        {/* Card 3: Attendance Records Placeholder */}
        <section className="dashboard-card" aria-labelledby="card-records-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div className="dashboard-card__icon" aria-hidden="true">
                <ClipboardList size={18} />
              </div>
              <h2 id="card-records-title" className="dashboard-card__title">
                Attendance Records
              </h2>
            </div>
            <span className="dashboard-card__badge">Logs & Reports</span>
          </header>
          <div className="dashboard-card__body">
            <EmptyState
              icon={<ClipboardList size={36} />}
              title="No records recorded"
              description="Historical class attendance logs, student compliance summaries, and exportable reports will appear here."
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default TeacherDashboard;

