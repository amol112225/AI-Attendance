/**
 * AttendAI Reset Password Page Component
 * Milestone 8.9: Forgot Password and Password Reset
 *
 * Handles setting a new password via Supabase Auth recovery session.
 * Protects against expired/invalid recovery links and enforces password policies.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { ErrorMessage } from '../components/common/ErrorMessage';
import {
  getSession,
  onAuthStateChange,
  updateUserPassword,
  logoutUser,
  formatAuthError,
} from '../services/authService';
import { ROUTES } from '../routes/routes';
import './ResetPasswordPage.css';

const MIN_PASSWORD_LENGTH = 6;

export function ResetPasswordPage() {
  const navigate = useNavigate();

  // Session state: 'checking' | 'ready' | 'invalid' | 'success'
  const [sessionStatus, setSessionStatus] = useState('checking');
  const [recoveryError, setRecoveryError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkRecoverySession() {
      // 1. Check for URL error parameters (e.g. #error=access_denied&error_code=otp_expired)
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const searchParams = new URLSearchParams(window.location.search);
      const urlError =
        hashParams.get('error_description') ||
        searchParams.get('error_description') ||
        hashParams.get('error');

      if (urlError) {
        if (isMounted) {
          setSessionStatus('invalid');
          setRecoveryError(
            formatAuthError(new Error(urlError)) ||
              'This password reset link is invalid or has expired. Please request a new link.'
          );
        }
        return;
      }

      // 2. Check for active recovery session
      try {
        const { session } = await getSession();
        if (isMounted) {
          if (session?.user) {
            setSessionStatus('ready');
          } else {
            // Short grace period in case Supabase client is asynchronously exchanging hash token
            const timer = setTimeout(async () => {
              if (!isMounted) return;
              const { session: retrySession } = await getSession();
              if (retrySession?.user) {
                setSessionStatus('ready');
              } else {
                setSessionStatus('invalid');
                setRecoveryError(
                  'No valid password recovery session was found. Please request a new password reset link.'
                );
              }
            }, 350);
            return () => clearTimeout(timer);
          }
        }
      } catch {
        if (isMounted) {
          setSessionStatus('invalid');
          setRecoveryError('Unable to verify recovery link. Please try requesting a new link.');
        }
      }
    }

    checkRecoverySession();

    // Listen to Supabase auth events (e.g. PASSWORD_RECOVERY)
    const { unsubscribe } = onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || (session?.user && event === 'SIGNED_IN')) {
        setSessionStatus('ready');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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

    if (!formData.password) {
      errors.password = 'New password is required.';
    } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
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
      const { error } = await updateUserPassword(formData.password);

      if (error) {
        setGeneralError(formatAuthError(error));
        setIsSubmitting(false);
        return;
      }

      // Terminate the temporary recovery session so user signs in cleanly
      await logoutUser();
      setSessionStatus('success');
    } catch (err) {
      setGeneralError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-password-page">
      <Container size="sm">
        <div className="reset-password-card">
          {/* State 1: Checking recovery session */}
          {sessionStatus === 'checking' && (
            <div className="reset-password-status-card" role="region" aria-label="Verifying Link">
              <LoadingIndicator centered size="lg" message="Verifying recovery session..." />
            </div>
          )}

          {/* State 2: Invalid or expired link */}
          {sessionStatus === 'invalid' && (
            <div
              className="reset-password-status-card"
              role="region"
              aria-label="Invalid or Expired Link"
            >
              <div className="reset-password-icon reset-password-icon--error" aria-hidden="true">
                <AlertCircle size={28} />
              </div>
              <h1 className="reset-password-title">Link Invalid or Expired</h1>
              <p className="reset-password-subtitle">
                {recoveryError ||
                  'This password reset link is invalid or has expired. Password recovery links can only be used once.'}
              </p>
              <div className="reset-password-actions">
                <Button
                  variant="primary"
                  size="md"
                  as={Link}
                  to={ROUTES.FORGOT_PASSWORD}
                >
                  Request a New Reset Link
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  as={Link}
                  to={ROUTES.LOGIN}
                >
                  Return to Sign In
                </Button>
              </div>
            </div>
          )}

          {/* State 3: Password updated successfully */}
          {sessionStatus === 'success' && (
            <div
              className="reset-password-status-card"
              role="region"
              aria-label="Password Reset Successful"
            >
              <div className="reset-password-icon reset-password-icon--success" aria-hidden="true">
                <CheckCircle2 size={28} />
              </div>
              <h1 className="reset-password-title">Password Updated!</h1>
              <p className="reset-password-subtitle">
                Your password has been changed successfully. You can now use your new password to sign in to AttendAI.
              </p>
              <div className="reset-password-actions">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate(ROUTES.LOGIN)}
                >
                  Student Sign In
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate(ROUTES.TEACHER_LOGIN)}
                >
                  Teacher Sign In
                </Button>
              </div>
            </div>
          )}

          {/* State 4: Valid recovery session, show reset form */}
          {sessionStatus === 'ready' && (
            <>
              <header className="reset-password-header">
                <div className="reset-password-badge">
                  <ShieldCheck size={13} aria-hidden="true" />
                  <span>PASSWORD RECOVERY</span>
                </div>
                <h1 className="reset-password-title">Create New Password</h1>
                <p className="reset-password-subtitle">
                  Choose a strong, unique password with at least 6 characters.
                </p>
              </header>

              {generalError && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <ErrorMessage
                    title="Password update failed"
                    message={generalError}
                  />
                </div>
              )}

              <form className="reset-password-form" onSubmit={handleSubmit} noValidate>
                {/* New Password */}
                <div className="reset-password-field">
                  <label htmlFor="reset-password" className="reset-password-label">
                    New Password
                  </label>
                  <div className="reset-password-input-wrapper">
                    <input
                      id="reset-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`reset-password-input ${fieldErrors.password ? 'reset-password-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? 'reset-password-error' : 'reset-password-hint'}
                    />
                  </div>
                  {fieldErrors.password ? (
                    <span id="reset-password-error" className="reset-password-field-error" role="alert">
                      {fieldErrors.password}
                    </span>
                  ) : (
                    <span id="reset-password-hint" className="reset-password-field-hint">
                      Must be at least 6 characters long.
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="reset-password-field">
                  <label htmlFor="reset-confirmPassword" className="reset-password-label">
                    Confirm New Password
                  </label>
                  <div className="reset-password-input-wrapper">
                    <input
                      id="reset-confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      placeholder="Re-enter your new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`reset-password-input ${fieldErrors.confirmPassword ? 'reset-password-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      aria-describedby={fieldErrors.confirmPassword ? 'reset-confirmPassword-error' : undefined}
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span id="reset-confirmPassword-error" className="reset-password-field-error" role="alert">
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>

                <div className="reset-password-actions">
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    icon={<ArrowRight size={16} />}
                    iconPosition="right"
                  >
                    Update Password
                  </Button>
                </div>
              </form>

              <footer className="reset-password-footer">
                <p className="reset-password-footer-text">
                  Remember your existing credentials?{' '}
                  <Link to={ROUTES.LOGIN} className="reset-password-footer-link">
                    Student Sign In
                  </Link>
                </p>
                <p className="reset-password-footer-text">
                  Faculty or teacher?{' '}
                  <Link to={ROUTES.TEACHER_LOGIN} className="reset-password-footer-link">
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

export default ResetPasswordPage;

