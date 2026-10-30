/**
 * AttendAI AdminDashboard Component
 * Milestone 9.1: Dashboard Architecture and Shared Layout
 *
 * Implements the Administrative Console placeholder using the shared DashboardLayout.
 */

import React from 'react';
import { Users, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';

export function AdminDashboard() {
  const { user, profile } = useAuth();

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Administrator');

  return (
    <DashboardLayout breadcrumb="Admin Console">
      <DashboardPageHeader
        badge={
          <span className="dashboard-role-badge dashboard-role-badge--admin">
            System Administrator
          </span>
        }
        title="Administrative Console"
        subtitle={`Welcome back, ${displayName}. Manage system users, review faculty registration requests, and inspect audit logs.`}
      />

      <div className="dashboard-grid">
        {/* Card 1: User Management Placeholder */}
        <section className="dashboard-card" aria-labelledby="card-users-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div className="dashboard-card__icon" aria-hidden="true">
                <Users size={18} />
              </div>
              <h2 id="card-users-title" className="dashboard-card__title">
                User Management
              </h2>
            </div>
            <span className="dashboard-card__badge">Directory</span>
          </header>
          <div className="dashboard-card__body">
            <EmptyState
              icon={<Users size={36} />}
              title="User management portal"
              description="Tools for institutional administrators to inspect, search, and manage registered student and faculty user profiles."
            />
          </div>
        </section>

        {/* Card 2: Teacher Approvals Placeholder */}
        <section className="dashboard-card" aria-labelledby="card-approvals-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div className="dashboard-card__icon" aria-hidden="true">
                <ShieldCheck size={18} />
              </div>
              <h2 id="card-approvals-title" className="dashboard-card__title">
                Teacher Approvals
              </h2>
            </div>
            <span className="dashboard-card__badge">Review Queue</span>
          </header>
          <div className="dashboard-card__body">
            <EmptyState
              icon={<ShieldCheck size={36} />}
              title="Approval review queue"
              description="Review submitted faculty registration requests, verify institutional credentials, and approve or reject applications."
            />
          </div>
        </section>

        {/* Card 3: System Overview Placeholder */}
        <section className="dashboard-card" aria-labelledby="card-system-title">
          <header className="dashboard-card__header">
            <div className="dashboard-card__title-wrap">
              <div className="dashboard-card__icon" aria-hidden="true">
                <SlidersHorizontal size={18} />
              </div>
              <h2 id="card-system-title" className="dashboard-card__title">
                System Overview
              </h2>
            </div>
            <span className="dashboard-card__badge">Diagnostics</span>
          </header>
          <div className="dashboard-card__body">
            <EmptyState
              icon={<SlidersHorizontal size={36} />}
              title="Platform diagnostics"
              description="Database health metrics, system performance, active session statistics, and security audit telemetry."
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;

