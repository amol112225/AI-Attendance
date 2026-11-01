/**
 * AttendAI Teacher Login Page Component
 * Milestone 8.8: Teacher Login and Role-Specific Authentication Experience
 * UI Parity: Structural layout identical to Student Login (LoginPage.jsx)
 *
 * Implements dedicated sign-in for faculty and educators:
 * - Authenticates using central loginUser() email/password infrastructure via authenticateTeacher().
 * - Authorizes against public.profiles database role and is_approved status.
 * - Handles role-specific login outcomes (Cases A-G).
 * - Prevents unauthorized session access when role verification fails.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import {
  authenticateTeacher,
  TEACHER_LOGIN_OUTCOMES,
  formatAuthError,
} from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../routes/routes';
import './TeacherLoginPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function TeacherLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    user,
    profile,
    isApproved,
    role,
    teacherRequest,
    loading,
    profileLoading,
    setAuthSession,
    logout,
  } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [_loginOutcome, setLoginOutcome] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reactive Redirection: Direct authenticated users directly to their designated dashboard/status
  useEffect(() => {
    if (isAuthenticated && !loading && !profileLoading && profile) {
      if (role === 'teacher') {
        const dest = isApproved ? ROUTES.TEACHER_DASHBOARD : ROUTES.TEACHER_STATUS;
        navigate(dest, { replace: true });
      } else if (role === 'student') {
        navigate(ROUTES.STUDENT_DASHBOARD, { replace: true });
      }
    }
  }, [isAuthenticated, loading, profileLoading, profile, role, isApproved, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    if (generalError) {
      setGeneralError('');
      setLoginOutcome(null);
    }
  };

  const validateForm = () => {
    const errors = {};

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      errors.email = 'Institutional email is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setGeneralError('');
    setLoginOutcome(null);
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authenticateTeacher({
        email: formData.email,
        password: formData.password,
      });

      setLoginOutcome(result.outcome);

      // Case A: Approved Teacher
      if (result.outcome === TEACHER_LOGIN_OUTCOMES.APPROVED_TEACHER) {
        if (result.data?.session) {
          await setAuthSession(result.data.session);
        }
        const from = location.state?.from?.pathname;
        const destination =
          from && from !== ROUTES.TEACHER_LOGIN && from !== ROUTES.LOGIN
            ? from
            : ROUTES.TEACHER_DASHBOARD;
        navigate(destination, { replace: true });
        return;
      }

      // Case B: Pending Teacher
      if (result.outcome === TEACHER_LOGIN_OUTCOMES.PENDING_TEACHER) {
        if (result.data?.session) {
          await setAuthSession(result.data.session);
        }
        navigate(ROUTES.TEACHER_STATUS, { replace: true });
        return;
      }

      // Cases C, D, E, F, G: Access Denied / Error
      setGeneralError(result.message || 'Authentication failed.');
    } catch (err) {
      setGeneralError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // While authenticating and resolving user profile, display an accessible loading indicator
  if (isAuthenticated && (loading || profileLoading)) {
    return (
      <div className="login-page">
        <Container size="sm">
          <div className="login-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <LoadingIndicator centered size="lg" message="Directing to faculty portal..." />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="login-page">
      <Container size="sm">
        <div className="login-card">
          {isAuthenticated ? (
            <div
              className="login-authenticated-banner"
              role="region"
              aria-label="Already Signed In Notice"
            >
              <div className="login-authenticated-icon" aria-hidden="true">
                <CheckCircle2 size={26} />
              </div>
              <h1 className="login-authenticated-title">You are signed in</h1>
              <p className="login-authenticated-desc">
                Signed in as <strong>{user?.email}</strong>
                <br />
                Role: <strong>{role || 'Student'}</strong>{' '}
                {role === 'teacher' ? (
                  <span>({isApproved ? 'Approved Teacher' : 'Pending Approval'})</span>
                ) : teacherRequest?.status === 'pending' ? (
                  <span>(Teacher Application Pending Approval)</span>
                ) : teacherRequest?.status === 'rejected' ? (
                  <span>(Teacher Application Not Approved)</span>
                ) : null}
              </p>
              <div className="login-authenticated-actions">
                {role === 'teacher' && isApproved ? (
                  <Button
                    variant="primary"
                    size="md"
                    type="button"
                    onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}
                  >
                    Go to Teacher Dashboard
                  </Button>
                ) : (role === 'teacher' && !isApproved) || teacherRequest?.status === 'pending' ? (
                  <Button
                    variant="primary"
                    size="md"
                    type="button"
                    onClick={() => navigate(ROUTES.TEACHER_STATUS)}
                  >
                    View Teacher Status
                  </Button>
                ) : role === 'student' ? (
                  <Button
                    variant="primary"
                    size="md"
                    type="button"
                    onClick={() => navigate(ROUTES.STUDENT_DASHBOARD)}
                  >
                    Go to Student Dashboard
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={() => navigate(ROUTES.ROOT)}
                >
                  Return to Homepage
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  type="button"
                  onClick={logout}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <>
              <header className="login-header">
                <div className="login-badge login-badge--teacher">
                  <BookOpen size={13} aria-hidden="true" />
                  <span>FACULTY PORTAL</span>
                </div>
                <h1 className="login-title">Teacher Sign In</h1>
                <p className="login-subtitle">
                  Sign in to your AttendAI faculty account.
                </p>
              </header>

              {generalError && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <ErrorMessage
                    title="Sign in failed"
                    message={generalError}
                  />
                </div>
              )}

              <form className="login-form" onSubmit={handleSubmit} noValidate>
                {/* Email Address */}
                <div className="login-field">
                  <label htmlFor="teacher-login-email" className="login-label">
                    Institutional Email Address
                  </label>
                  <div className="login-input-wrapper">
                    <input
                      id="teacher-login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="faculty@university.edu"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`login-input ${fieldErrors.email ? 'login-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'teacher-login-email-error' : undefined}
                    />
                  </div>
                  {fieldErrors.email && (
                    <span id="teacher-login-email-error" className="login-field-error" role="alert">
                      {fieldErrors.email}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="login-field">
                  <div className="login-field-header">
                    <label htmlFor="teacher-login-password" className="login-label">
                      Password
                    </label>
                    <Link to={ROUTES.FORGOT_PASSWORD} className="login-forgot-link">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="login-input-wrapper">
                    <input
                      id="teacher-login-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`login-input ${fieldErrors.password ? 'login-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? 'teacher-login-password-error' : undefined}
                    />
                  </div>
                  {fieldErrors.password && (
                    <span id="teacher-login-password-error" className="login-field-error" role="alert">
                      {fieldErrors.password}
                    </span>
                  )}
                </div>

                {/* Submit Action */}
                <div className="login-actions">
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    icon={<ArrowRight size={16} />}
                    iconPosition="right"
                  >
                    Sign In
                  </Button>
                </div>
              </form>

              {/* Navigation Links */}
              <footer className="login-footer">
                <p className="login-footer-text">
                  New faculty member?{' '}
                  <Link to={ROUTES.TEACHER_REGISTER} className="login-footer-link">
                    Register as Teacher
                  </Link>
                </p>
                <p className="login-footer-text login-footer-text--subtle">
                  Looking for student sign in?{' '}
                  <Link to={ROUTES.LOGIN} className="login-footer-link">
                    Student Sign In
                  </Link>
                </p>
              </footer>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}

export default TeacherLoginPage;
