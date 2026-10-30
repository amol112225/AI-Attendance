/**
 * AttendAI Teacher Login Page Component
 * Milestone 8.7: Teacher Registration and Approval Request
 * UI Correction: Structural layout identical to Student Login (LoginPage.jsx)
 *
 * Implements dedicated sign-in for faculty and educators.
 * Reuses central loginUser() service and AuthContext state.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { loginUser, formatAuthError } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../routes/routes';
import './TeacherLoginPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function TeacherLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isApproved, role, setAuthSession, logout } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setGeneralError(formatAuthError(error));
        setIsSubmitting(false);
        return;
      }

      if (data?.session) {
        await setAuthSession(data.session);
        // Navigate to teacher status or root
        navigate(ROUTES.TEACHER_STATUS);
      } else {
        navigate(ROUTES.ROOT);
      }
    } catch (err) {
      setGeneralError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Role: <strong>{role || 'Student'}</strong> (
                {isApproved ? 'Approved Teacher' : 'Pending Approval'})
              </p>
              <div className="login-authenticated-actions">
                <Button
                  variant="primary"
                  size="md"
                  type="button"
                  onClick={() => navigate(ROUTES.TEACHER_STATUS)}
                >
                  View Teacher Status
                </Button>
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
                    <span
                      id="teacher-login-email-error"
                      className="login-field-error"
                      role="alert"
                    >
                      {fieldErrors.email}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="login-field">
                  <label htmlFor="teacher-login-password" className="login-label">
                    Password
                  </label>
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
                    <span
                      id="teacher-login-password-error"
                      className="login-field-error"
                      role="alert"
                    >
                      {fieldErrors.password}
                    </span>
                  )}
                </div>

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

              <footer className="login-footer">
                <p className="login-footer-text">
                  New faculty member?{' '}
                  <Link to={ROUTES.TEACHER_REGISTER} className="login-footer-link">
                    Apply for Teacher Access
                  </Link>
                </p>
                <p className="login-footer-text">
                  Student account?{' '}
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
