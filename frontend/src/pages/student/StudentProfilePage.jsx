/**
 * AttendAI – My Profile Page
 * Student Portal: Personal credentials, verification status, enrolled subjects summary, and session logout.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Hash,
  BookOpen,
  LogOut,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { useAuth } from '../../hooks/useAuth';
import { getStudentSubjects } from '../../services/studentService';
import { ROUTES } from '../../routes/routes';
import './StudentPortal.css';

export function StudentProfilePage() {
  const { user, profile, profileLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [subjectsData, setSubjectsData] = useState({ subjects: [], isAvailable: false });
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Fetch enrolled subjects summary
  useEffect(() => {
    let isMounted = true;
    async function loadSubjects() {
      if (!user?.id) {
        if (isMounted) setLoadingSubjects(false);
        return;
      }
      try {
        const res = await getStudentSubjects(user.id);
        if (isMounted) {
          setSubjectsData(res);
        }
      } catch {
        // Safe fail-closed
      } finally {
        if (isMounted) setLoadingSubjects(false);
      }
    }
    loadSubjects();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Student');

  const formattedId = user?.id
    ? `STU-${user.id.slice(0, 8).toUpperCase()}`
    : 'Not Assigned';

  const memberSince = (() => {
    const rawDate = profile?.created_at || user?.created_at;
    if (!rawDate) return 'Current Academic Term';
    return new Date(rawDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  })();

  const initial = (displayName.charAt(0) || 'S').toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.ROOT);
  };

  if (profileLoading) {
    return (
      <DashboardLayout breadcrumb="My Profile">
        <div
          className="dashboard-card"
          style={{ padding: 'var(--space-10)', textAlign: 'center' }}
        >
          <LoadingIndicator message="Loading your profile information…" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumb="My Profile">
      <DashboardPageHeader
        badge={
          <span className="dashboard-role-badge dashboard-role-badge--student">
            My Profile
          </span>
        }
        title="My Profile"
        subtitle="View your student credentials, verification details, enrolled courses, and manage your session."
      />

      {/* Top 2-Column: Identity Card & Account Details */}
      <div className="sp-profile-layout">
        {/* Left Column: Student Identity Card */}
        <section aria-label="Student Identity" className="sp-profile-id-card">
          <div className="sp-profile-avatar-circle" aria-hidden="true">
            {initial}
          </div>
          <div>
            <h2 className="sp-profile-id-name">{displayName}</h2>
            <p className="sp-profile-id-email">{user?.email || 'Student Account'}</p>
          </div>

          <div className="sp-verified-tag">
            <CheckCircle2 size={14} aria-hidden="true" />
            <span>Verified Student Account</span>
          </div>

          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--color-text-muted)',
              borderTop: '1px solid var(--color-border-subtle)',
              paddingTop: 'var(--space-3)',
              width: '100%',
            }}
          >
            Role: Student • Standard Authorization
          </span>
        </section>

        {/* Right Column: Account Information Grid */}
        <section aria-labelledby="account-details-heading" className="sp-profile-fields-card">
          <h2 id="account-details-heading" className="sp-section-title" style={{ marginBottom: 'var(--space-4)' }}>
            Account Credentials & Metadata
          </h2>

          <div className="sp-profile-field-list">
            <div className="sp-profile-field-item">
              <div className="sp-profile-field-icon" aria-hidden="true">
                <User size={18} />
              </div>
              <div className="sp-profile-field-content">
                <span className="sp-profile-field-label">Full Name</span>
                <span className="sp-profile-field-value">{displayName}</span>
              </div>
            </div>

            <div className="sp-profile-field-item">
              <div className="sp-profile-field-icon" aria-hidden="true">
                <Mail size={18} />
              </div>
              <div className="sp-profile-field-content">
                <span className="sp-profile-field-label">Institutional Email</span>
                <span className="sp-profile-field-value">{user?.email || '—'}</span>
              </div>
            </div>

            <div className="sp-profile-field-item">
              <div className="sp-profile-field-icon" aria-hidden="true">
                <Hash size={18} />
              </div>
              <div className="sp-profile-field-content">
                <span className="sp-profile-field-label">Student ID</span>
                <span className="sp-profile-field-value sp-profile-field-value--mono">
                  {formattedId}
                </span>
              </div>
            </div>

            <div className="sp-profile-field-item">
              <div className="sp-profile-field-icon" aria-hidden="true">
                <Shield size={18} />
              </div>
              <div className="sp-profile-field-content">
                <span className="sp-profile-field-label">Portal Authorization</span>
                <span className="sp-profile-field-value" style={{ textTransform: 'capitalize' }}>
                  {profile?.role || 'Student'} (Active)
                </span>
              </div>
            </div>

            <div className="sp-profile-field-item">
              <div className="sp-profile-field-icon" aria-hidden="true">
                <Calendar size={18} />
              </div>
              <div className="sp-profile-field-content">
                <span className="sp-profile-field-label">Account Enrolled</span>
                <span className="sp-profile-field-value">{memberSince}</span>
              </div>
            </div>

            <div className="sp-profile-field-item">
              <div className="sp-profile-field-icon" aria-hidden="true">
                <BookOpen size={18} />
              </div>
              <div className="sp-profile-field-content">
                <span className="sp-profile-field-label">Academic Term</span>
                <span className="sp-profile-field-value">Term 2026–2027</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Enrolled Subjects Summary */}
      <section aria-labelledby="enrolled-summary-heading" className="sp-enrolled-summary-card">
        <div className="sp-section-header">
          <div>
            <h2 id="enrolled-summary-heading" className="sp-section-title">
              <BookOpen size={18} aria-hidden="true" /> Enrolled Subjects Summary
            </h2>
            <p className="sp-section-subtitle">
              Overview of active academic courses associated with your student ID.
            </p>
          </div>
          <Link
            to={ROUTES.STUDENT_SUBJECTS}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-brand-cyan)',
              textDecoration: 'none',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            <span>View All Subjects</span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        {loadingSubjects ? (
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
            Checking course roster…
          </p>
        ) : subjectsData.subjects && subjectsData.subjects.length > 0 ? (
          <div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: '0 0 var(--space-2)' }}>
              Enrolled in {subjectsData.subjects.length} active course
              {subjectsData.subjects.length === 1 ? '' : 's'}:
            </p>
            <div className="sp-enrolled-chips">
              {subjectsData.subjects.map((sub) => (
                <span key={sub.id || sub.subject_code || sub.subject_name} className="sp-subject-chip">
                  {sub.subject_code && (
                    <span className="sp-subject-chip-code">{sub.subject_code}</span>
                  )}
                  <span>{sub.subject_name}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0, fontStyle: 'italic' }}>
            No enrolled subjects registered for your profile yet.
          </p>
        )}
      </section>

      {/* Session Management & Logout Section */}
      <section aria-labelledby="session-security-heading" className="sp-logout-banner">
        <div>
          <h2
            id="session-security-heading"
            style={{
              margin: '0 0 4px',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
            }}
          >
            Sign Out of Student Portal
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            Signing out will securely terminate your current session on this device and return you to the homepage.
          </p>
        </div>

        <button
          type="button"
          className="sp-logout-btn"
          onClick={handleLogout}
          aria-label="Sign out of your account"
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </section>
    </DashboardLayout>
  );
}

export default StudentProfilePage;
