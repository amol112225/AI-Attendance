/**
 * AttendAI Forgot Password Page Component
 * Milestone 8.9: Forgot Password and Password Reset
 *
 * Provides a secure, validated password recovery initiation interface.
 * Dispatches reset instructions via Supabase Auth without leaking account existence.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight } from 'lucide-react';
import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { sendPasswordResetEmail, formatAuthError } from '../services/authService';
import { ROUTES } from '../routes/routes';
import './ForgotPasswordPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors({});
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = () => {
    const errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
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
      const { error } = await sendPasswordResetEmail(email.trim());

      if (error) {
        setGeneralError(formatAuthError(error));
        return;
      }

      setSubmittedEmail(email.trim());
      setIsSubmitted(true);
    } catch (err) {
      setGeneralError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <Container size="sm">
        <div className="forgot-password-card">
          {isSubmitted ? (
            <div
              className="forgot-password-success-card"
              role="region"
              aria-label="Password Reset Email Sent"
            >
              <div className="forgot-password-icon forgot-password-icon--sent" aria-hidden="true">
                <Mail size={28} />
              </div>
              <h1 className="forgot-password-title">Check your email</h1>
              <p className="forgot-password-subtitle">
                If an account exists with{' '}
                <strong className="forgot-password-email-highlight">{submittedEmail}</strong>,
                we've sent password reset instructions to your inbox.
              </p>
              <p className="forgot-password-hint">
                Please check your spam or junk folder if the email doesn't appear within a few minutes.
              </p>
              <div className="forgot-password-actions">
                <Button
                  variant="primary"
                  size="md"
                  as={Link}
                  to={ROUTES.LOGIN}
                >
                  Return to Student Sign In
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  as={Link}
                  to={ROUTES.TEACHER_LOGIN}
                >
                  Return to Teacher Sign In
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                >
                  Try another email address
                </Button>
              </div>
            </div>
          ) : (
            <>
              <header className="forgot-password-header">
                <div className="forgot-password-badge">
                  <KeyRound size={13} aria-hidden="true" />
                  <span>SECURE RECOVERY</span>
                </div>
                <h1 className="forgot-password-title">Forgot your password?</h1>
                <p className="forgot-password-subtitle">
                  Enter your registered institutional or personal email address to receive password reset instructions.
                </p>
              </header>

              {generalError && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <ErrorMessage
                    title="Recovery request failed"
                    message={generalError}
                  />
                </div>
              )}

              <form className="forgot-password-form" onSubmit={handleSubmit} noValidate>
                <div className="forgot-password-field">
                  <label htmlFor="forgot-email" className="forgot-password-label">
                    Email Address
                  </label>
                  <div className="forgot-password-input-wrapper">
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="user@university.edu"
                      value={email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`forgot-password-input ${fieldErrors.email ? 'forgot-password-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'forgot-email-error' : undefined}
                    />
                  </div>
                  {fieldErrors.email && (
                    <span id="forgot-email-error" className="forgot-password-field-error" role="alert">
                      {fieldErrors.email}
                    </span>
                  )}
                </div>

                <div className="forgot-password-actions">
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    icon={<ArrowRight size={16} />}
                    iconPosition="right"
                  >
                    Send Reset Link
                  </Button>
                </div>
              </form>

              <footer className="forgot-password-footer">
                <p className="forgot-password-footer-text">
                  Remembered your password?{' '}
                  <Link to={ROUTES.LOGIN} className="forgot-password-footer-link">
                    Student Sign In
                  </Link>
                </p>
                <p className="forgot-password-footer-text">
                  Faculty or educator?{' '}
                  <Link to={ROUTES.TEACHER_LOGIN} className="forgot-password-footer-link">
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

export default ForgotPasswordPage;

