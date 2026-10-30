/**
 * AttendAI Teacher Request Status Page Component
 * Milestone 8.7: Teacher Registration and Approval Request
 *
 * Displays the current status of the teacher's approval request:
 * - Reads status strictly from the database (teacher_registration_requests).
 * - Handles: 'pending', 'approved', 'rejected', and 'none'.
 * - Allows re-querying the database with "Check Status Again".
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Home,
  LogOut,
  Send,
} from 'lucide-react';
import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { submitTeacherRegistrationRequest } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../routes/routes';
import './TeacherStatusPage.css';

export function TeacherStatusPage() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    role,
    isApproved,
    teacherRequest,
    teacherRequestLoading,
    loading,
    isAuthenticated,
    refreshTeacherRequest,
    refreshProfile,
    logout,
  } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([refreshProfile(), refreshTeacherRequest()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmitNewRequest = async () => {
    if (!user?.id || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitMessage('');
    try {
      const { error } = await submitTeacherRegistrationRequest(user.id);
      if (!error) {
        await refreshTeacherRequest();
        setSubmitMessage('Your teacher approval request has been submitted successfully.');
      } else {
        setSubmitMessage('Could not submit request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.ROOT);
  };

  if (loading || teacherRequestLoading) {
    return (
      <div className="teacher-status-page">
        <Container size="sm">
          <LoadingIndicator
            centered
            size="lg"
            message="Checking teacher registration status..."
          />
        </Container>
      </div>
    );
  }

  // If user is unauthenticated
  if (!isAuthenticated) {
    return (
      <div className="teacher-status-page">
        <Container size="sm">
          <div className="teacher-status-card">
            <div className="teacher-status-icon-box teacher-status-icon-box--pending">
              <Clock size={32} />
            </div>
            <h1 className="teacher-status-title">Sign In Required</h1>
            <p className="teacher-status-desc">
              Please sign in to view your teacher approval request status.
            </p>
            <div className="teacher-status-actions">
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => navigate(ROUTES.TEACHER_LOGIN)}
              >
                Teacher Sign In
              </Button>
              <Button
                variant="outline"
                size="md"
                type="button"
                onClick={() => navigate(ROUTES.ROOT)}
              >
                Return to Homepage
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Derive status from request record or profile
  const status = isApproved ? 'approved' : teacherRequest?.status || 'none';

  return (
    <div className="teacher-status-page">
      <Container size="sm">
        <div className="teacher-status-card" role="region" aria-label="Teacher Application Status">
          {/* Status: Approved */}
          {status === 'approved' && (
            <>
              <div
                className="teacher-status-icon-box teacher-status-icon-box--approved"
                aria-hidden="true"
              >
                <CheckCircle2 size={32} />
              </div>
              <span className="teacher-status-badge teacher-status-badge--approved">
                ACCOUNT APPROVED
              </span>
              <h1 className="teacher-status-title">Teacher Privileges Active</h1>
              <p className="teacher-status-desc">
                Your teacher account has been verified and approved by an administrator.
                You have full access to faculty features and attendance sessions.
              </p>
            </>
          )}

          {/* Status: Pending */}
          {status === 'pending' && (
            <>
              <div
                className="teacher-status-icon-box teacher-status-icon-box--pending"
                aria-hidden="true"
              >
                <Clock size={32} />
              </div>
              <span className="teacher-status-badge teacher-status-badge--pending">
                APPROVAL PENDING
              </span>
              <h1 className="teacher-status-title">Application Under Review</h1>
              <p className="teacher-status-desc">
                Your request to become an AttendAI Teacher has been received and is waiting
                for administrator approval. While your request is pending, you may continue
                using your account as a student.
              </p>
            </>
          )}

          {/* Status: Rejected */}
          {status === 'rejected' && (
            <>
              <div
                className="teacher-status-icon-box teacher-status-icon-box--rejected"
                aria-hidden="true"
              >
                <AlertCircle size={32} />
              </div>
              <span className="teacher-status-badge teacher-status-badge--rejected">
                NOT APPROVED
              </span>
              <h1 className="teacher-status-title">Request Not Approved</h1>
              <p className="teacher-status-desc">
                Your teacher registration request was reviewed and not approved at this time.
                You can continue using AttendAI with your Student account, or contact your
                institution administrator.
              </p>
            </>
          )}

          {/* Status: None */}
          {status === 'none' && (
            <>
              <div
                className="teacher-status-icon-box teacher-status-icon-box--pending"
                aria-hidden="true"
              >
                <Clock size={32} />
              </div>
              <span className="teacher-status-badge teacher-status-badge--pending">
                NO REQUEST SUBMITTED
              </span>
              <h1 className="teacher-status-title">Become an AttendAI Teacher</h1>
              <p className="teacher-status-desc">
                You do not have an active teacher approval request on file. Submit a request
                to apply for educator privileges.
              </p>
              {submitMessage && (
                <p style={{ color: 'var(--color-brand-cyan)', fontSize: 'var(--font-size-sm)' }}>
                  {submitMessage}
                </p>
              )}
            </>
          )}

          {/* Account Details Box */}
          <div className="teacher-status-details">
            <div className="teacher-status-row">
              <span className="teacher-status-row-label">Full Name:</span>
              <span className="teacher-status-row-value">
                {profile?.full_name || user?.user_metadata?.full_name || 'AttendAI User'}
              </span>
            </div>
            <div className="teacher-status-row">
              <span className="teacher-status-row-label">Account Email:</span>
              <span className="teacher-status-row-value">{user?.email}</span>
            </div>
            <div className="teacher-status-row">
              <span className="teacher-status-row-label">Current Role:</span>
              <span className="teacher-status-row-value">{role || 'Student'}</span>
            </div>
            <div className="teacher-status-row">
              <span className="teacher-status-row-label">Approval Status:</span>
              <span className="teacher-status-row-value">
                {status === 'approved'
                  ? 'Approved'
                  : status === 'pending'
                  ? 'Pending Admin Review'
                  : status === 'rejected'
                  ? 'Rejected'
                  : 'Not Requested'}
              </span>
            </div>
            {teacherRequest?.created_at && (
              <div className="teacher-status-row">
                <span className="teacher-status-row-label">Requested On:</span>
                <span className="teacher-status-row-value">
                  {new Date(teacherRequest.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="teacher-status-actions">
            {status === 'none' ? (
              <Button
                variant="primary"
                size="md"
                type="button"
                icon={<Send size={16} />}
                isLoading={isSubmitting}
                disabled={isSubmitting}
                onClick={handleSubmitNewRequest}
              >
                Submit Teacher Request
              </Button>
            ) : (
              <Button
                variant="outline"
                size="md"
                type="button"
                icon={<RefreshCw size={16} />}
                isLoading={isRefreshing}
                disabled={isRefreshing}
                onClick={handleRefresh}
              >
                Check Status Again
              </Button>
            )}

            {status === 'approved' && (
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}
              >
                Go to Faculty Portal
              </Button>
            )}

            <Button
              variant="outline"
              size="md"
              type="button"
              icon={<Home size={16} />}
              onClick={() => navigate(ROUTES.ROOT)}
            >
              Return to Homepage
            </Button>

            <Button
              variant="ghost"
              size="md"
              type="button"
              icon={<LogOut size={16} />}
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default TeacherStatusPage;
