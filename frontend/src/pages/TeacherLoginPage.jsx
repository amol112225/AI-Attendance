/**
 * AttendAI Teacher Login Page Component
 * Milestone 8.7: Teacher Registration and Approval Request
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
    <div className="teacher-login-page">
      <Container size="sm">
        <div className="teacher-login-card">
          {isAuthenticated ? (
            <div
              className="teacher-login-authenticated"
              role="region"
              aria-label="Already Signed In Notice"
            >
              <div className="teacher-login-auth-icon" aria-hidden="true">
                <CheckCircle2 size={26} />
              </div>
              <h1 className="teacher-login-auth-title">You are signed in</h1>
              <p className="teacher-login-auth-desc">
                Signed in as <strong>{user?.email}</strong>
                <br />
                Role: <strong>{role || 'Student'}</strong> (
                {isApproved ? 'Approved Teacher' : 'Pending Approval'})
              </p>
              <div className="teacher-login-auth-actions">
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
              <header className="teacher-login-header">
                <div className="teacher-login-badge">
                  <BookOpen size={13} aria-hidden="true" />
                  <span>FACULTY PORTAL</span>
                </div>
                <h1 className="teacher-login-title">Teacher Sign In</h1>
                <p className="teacher-login-subtitle">
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

              <form className="teacher-login-form" onSubmit={handleSubmit} noValidate>
                {/* Email Address */}
                <div className="teacher-login-field">
                  <label htmlFor="teacher-login-email" className="teacher-login-label">
                    Institutional Email Address
                  </label>
                  <div className="teacher-login-input-wrapper">
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
                      className={`teacher-login-input ${fieldErrors.email ? 'teacher-login-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'teacher-login-email-error' : undefined}
                    />
                  </div>
                  {fieldErrors.email && (
                    <span
                      id="teacher-login-email-error"
                      className="teacher-login-field-error"
                      role="alert"
                    >
                      {fieldErrors.email}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="teacher-login-field">
                  <label htmlFor="teacher-login-password" className="teacher-login-label">
                    Password
                  </label>
                  <div className="teacher-login-input-wrapper">
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
                      className={`teacher-login-input ${fieldErrors.password ? 'teacher-login-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? 'teacher-login-password-error' : undefined}
                    />
                  </div>
                  {fieldErrors.password && (
                    <span
                      id="teacher-login-password-error"
                      className="teacher-login-field-error"
                      role="alert"
                    >
                      {fieldErrors.password}
                    </span>
                  )}
                </div>

                <div className="teacher-login-actions">
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

              <footer className="teacher-login-footer">
                <p className="teacher-login-footer-text">
                  New faculty member?{' '}
                  <Link to={ROUTES.TEACHER_REGISTER} className="teacher-login-footer-link">
                    Apply for Teacher Access
                  </Link>
                </p>
                <p className="teacher-login-footer-text">
                  Student account?{' '}
                  <Link to={ROUTES.LOGIN} className="teacher-login-footer-link">
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
