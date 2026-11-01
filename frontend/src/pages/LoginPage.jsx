/**
 * AttendAI Login Page Component
 * Milestone 8.4: AttendAI Login, AuthContext & Session Management
 *
 * Implements accessible, validated user login powered by authService.loginUser().
 * Updates AuthContext upon successful sign in and redirects to the role dashboard.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { loginUser, formatAuthError } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../routes/routes';
import { getRoleDashboardPath } from '../routes/accessRules';
import './LoginPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    user,
    profile,
    isApproved,
    loading,
    profileLoading,
    setAuthSession,
    logout,
  } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reactive Redirection:
  // When an authenticated user's session and profile are resolved, direct them immediately to their dashboard
  useEffect(() => {
    if (isAuthenticated && !loading && !profileLoading) {
      const activeRole = profile?.role || (user?.user_metadata?.requested_role !== 'teacher' ? 'student' : null);
      if (activeRole) {
        const from = location.state?.from?.pathname;
        const destination =
          from &&
          from !== ROUTES.LOGIN &&
          from !== ROUTES.REGISTER &&
          from !== ROUTES.TEACHER_LOGIN &&
          from !== ROUTES.TEACHER_REGISTER &&
          from !== ROUTES.ROOT &&
          from !== ROUTES.DASHBOARD
            ? from
            : getRoleDashboardPath({ role: activeRole, isApproved });
        navigate(destination, { replace: true });
      }
    }
  }, [isAuthenticated, loading, profileLoading, profile, isApproved, user, location.state, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear individual field error on change
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

    // 1. Email Address
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email Address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    // 2. Password
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
        const authState = await setAuthSession(data.session);
        const resolvedProfile = authState?.profile;
        const from = location.state?.from?.pathname;
        let destination;
        if (
          from &&
          from !== ROUTES.LOGIN &&
          from !== ROUTES.REGISTER &&
          from !== ROUTES.TEACHER_LOGIN &&
          from !== ROUTES.TEACHER_REGISTER &&
          from !== ROUTES.ROOT &&
          from !== ROUTES.DASHBOARD
        ) {
          destination = from;
        } else {
          const userRole = resolvedProfile?.role || 'student';
          const approvedStatus = userRole === 'teacher' ? Boolean(resolvedProfile?.is_approved) : true;
          destination = getRoleDashboardPath({
            role: userRole,
            isApproved: approvedStatus,
          });
        }
        navigate(destination, { replace: true });
      } else {
        // Fallback for safety
        navigate(ROUTES.ROOT);
      }
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
            <LoadingIndicator centered size="lg" message="Directing to your dashboard..." />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="login-page">
      <Container size="sm">
        <div className="login-card">
          {/* If user is already authenticated */}
          {isAuthenticated ? (
            <div className="login-authenticated-banner" role="region" aria-label="Already Signed In Notice">
              <div className="login-authenticated-icon" aria-hidden="true">
                <CheckCircle2 size={26} />
              </div>
              <h1 className="login-authenticated-title">You are already signed in</h1>
              <p className="login-authenticated-desc">
                Signed in as <strong>{user?.email}</strong>.
              </p>
              <div className="login-authenticated-actions">
                <Button
                  variant="primary"
                  size="md"
                  type="button"
                  onClick={() =>
                    navigate(
                      getRoleDashboardPath({
                        role: profile?.role || 'student',
                        isApproved,
                      })
                    )
                  }
                >
                  Go to Dashboard
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
                <div className="login-badge">
                  <LogIn size={13} aria-hidden="true" />
                  <span>SECURE SIGN IN</span>
                </div>
                <h1 className="login-title">Welcome back</h1>
                <p className="login-subtitle">
                  Sign in to your AttendAI account to continue.
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
                  <label htmlFor="login-email" className="login-label">
                    Email Address
                  </label>
                  <div className="login-input-wrapper">
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="student@university.edu"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`login-input ${fieldErrors.email ? 'login-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                    />
                  </div>
                  {fieldErrors.email && (
                    <span id="email-error" className="login-field-error" role="alert">
                      {fieldErrors.email}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="login-field">
                  <div className="login-field-header">
                    <label htmlFor="login-password" className="login-label">
                      Password
                    </label>
                    <Link to={ROUTES.FORGOT_PASSWORD} className="login-forgot-link">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="login-input-wrapper">
                    <input
                      id="login-password"
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
                      aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    />
                  </div>
                  {fieldErrors.password && (
                    <span id="password-error" className="login-field-error" role="alert">
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
                  Don't have an account?{' '}
                  <Link to={ROUTES.REGISTER} className="login-footer-link">
                    Sign up
                  </Link>
                </p>
                <p className="login-footer-text login-footer-text--subtle">
                  Are you a faculty member?{' '}
                  <Link to={ROUTES.TEACHER_LOGIN} className="login-footer-link">
                    Teacher Sign In
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

export default LoginPage;
