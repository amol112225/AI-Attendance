/**
 * AttendAI Registration Page Component
 * Milestone 8.3: AttendAI User Registration
 *
 * Implements accessible, validated user registration powered by authService.registerUser().
 * Supports both Email Confirmation Enabled & Disabled scenarios.
 * Strictly enforces Option B: Student role by default, no user-side teacher selection.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, ShieldCheck, ArrowRight, GraduationCap, BookOpen } from 'lucide-react';
import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { registerUser, formatAuthError } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../routes/routes';
import './RegisterPage.css';

// Simple RFC 5322 compatible email pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success States:
  // - null: form active
  // - 'confirmation_required': Scenario A (Email verification link sent)
  // - 'active_session': Scenario B (Instant account registration)
  const [successState, setSuccessState] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState('');

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

    // 1. Full Name
    const trimmedName = formData.fullName.trim();
    if (!trimmedName) {
      errors.fullName = 'Full Name is required.';
    }

    // 2. Email Address
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email Address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    // 3. Password
    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
    }

    // 4. Confirm Password
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm Password is required.';
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
      const { data, error, isConfirmationRequired } = await registerUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
      });

      if (error) {
        setGeneralError(formatAuthError(error));
        setIsSubmitting(false);
        return;
      }

      setRegisteredEmail(formData.email.trim());

      if (isConfirmationRequired) {
        // Scenario A: Email confirmation required
        setSuccessState('confirmation_required');
      } else if (data?.session) {
        // Scenario B: Active session / immediate creation
        setAuthSession(data.session);
        setSuccessState('active_session');
      } else if (data?.user) {
        // Fallback user with no session (Scenario A)
        setSuccessState('confirmation_required');
      } else {
        // Fallback safe state
        setSuccessState('confirmation_required');
      }
    } catch (err) {
      setGeneralError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <Container size="sm">
        <div className="register-card">
          {/* Scenario A: Email Confirmation Sent Screen */}
          {successState === 'confirmation_required' && (
            <div className="register-success-card" role="region" aria-label="Registration Confirmation Notice">
              <div className="register-success-icon register-success-icon--confirmation" aria-hidden="true">
                <Mail size={28} />
              </div>
              <h1 className="register-success-title">Check your email</h1>
              <p className="register-success-description">
                We sent a confirmation link to{' '}
                <span className="register-success-highlight">{registeredEmail}</span>.
                Please check your inbox and verify your email to activate your account.
              </p>
              <div className="register-success-actions">
                <Button
                  variant="primary"
                  size="md"
                  type="button"
                  onClick={() => navigate(ROUTES.ROOT)}
                >
                  Return to Homepage
                </Button>
              </div>
            </div>
          )}

          {/* Scenario B: Account Created Successfully (Immediate Session) */}
          {successState === 'active_session' && (
            <div className="register-success-card" role="region" aria-label="Account Created Success">
              <div className="register-success-icon register-success-icon--active" aria-hidden="true">
                <CheckCircle2 size={28} />
              </div>
              <h1 className="register-success-title">Account Created!</h1>
              <p className="register-success-description">
                Your AttendAI account has been created successfully with the Student role.
                Authentication and dashboard views will be available in upcoming milestones.
              </p>
              <div className="register-success-actions">
                <Button
                  variant="primary"
                  size="md"
                  type="button"
                  onClick={() => navigate(ROUTES.ROOT)}
                >
                  Return to Homepage
                </Button>
              </div>
            </div>
          )}

          {/* Registration Form (Default View) */}
          {successState === null && (
            <>
              {/* Role Switcher Tabs */}
              <div className="auth-role-tabs" role="tablist" aria-label="Account Type Selection">
                <span className="auth-role-tab auth-role-tab--active" role="tab" aria-selected="true">
                  <GraduationCap size={15} aria-hidden="true" />
                  <span>Student Registration</span>
                </span>
                <Link to={ROUTES.TEACHER_REGISTER} className="auth-role-tab" role="tab" aria-selected="false">
                  <BookOpen size={15} aria-hidden="true" />
                  <span>Teacher Registration</span>
                </Link>
              </div>

              <header className="register-header">
                <div className="register-badge">
                  <ShieldCheck size={13} aria-hidden="true" />
                  <span>STUDENT ACCESS</span>
                </div>
                <h1 className="register-title">Create your account</h1>
                <p className="register-subtitle">
                  Join AttendAI to participate in AI-assisted attendance sessions.
                </p>
              </header>

              {generalError && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <ErrorMessage
                    title="Registration failed"
                    message={generalError}
                  />
                </div>
              )}

              <form className="register-form" onSubmit={handleSubmit} noValidate>
                {/* Full Name */}
                <div className="register-field">
                  <label htmlFor="fullName" className="register-label">
                    Full Name
                  </label>
                  <div className="register-input-wrapper">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder="e.g. Alex Rivera"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`register-input ${fieldErrors.fullName ? 'register-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.fullName)}
                      aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <span id="fullName-error" className="register-field-error" role="alert">
                      {fieldErrors.fullName}
                    </span>
                  )}
                </div>

                {/* Email Address */}
                <div className="register-field">
                  <label htmlFor="email" className="register-label">
                    Email Address
                  </label>
                  <div className="register-input-wrapper">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="student@university.edu"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`register-input ${fieldErrors.email ? 'register-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                    />
                  </div>
                  {fieldErrors.email && (
                    <span id="email-error" className="register-field-error" role="alert">
                      {fieldErrors.email}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="register-field">
                  <label htmlFor="password" className="register-label">
                    Password
                  </label>
                  <div className="register-input-wrapper">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`register-input ${fieldErrors.password ? 'register-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? 'password-error' : 'password-hint'}
                    />
                  </div>
                  {fieldErrors.password ? (
                    <span id="password-error" className="register-field-error" role="alert">
                      {fieldErrors.password}
                    </span>
                  ) : (
                    <span id="password-hint" className="register-field-hint">
                      Must be at least 6 characters.
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="register-field">
                  <label htmlFor="confirmPassword" className="register-label">
                    Confirm Password
                  </label>
                  <div className="register-input-wrapper">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`register-input ${fieldErrors.confirmPassword ? 'register-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span id="confirmPassword-error" className="register-field-error" role="alert">
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>

                {/* Policy Notice: Option B Administrative Approval */}
                <div className="register-policy-notice">
                  <ShieldCheck size={16} aria-hidden="true" />
                  <p className="register-policy-text">
                    New accounts are registered as <strong>Student</strong>. Teacher privileges
                    require administrative approval.
                  </p>
                </div>

                {/* Submit Action */}
                <div className="register-actions">
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    icon={<ArrowRight size={16} />}
                    iconPosition="right"
                  >
                    Create Account
                  </Button>
                </div>
              </form>

              {/* Login Page Link */}
              <footer className="register-footer">
                <p className="register-footer-text">
                  Already have an account?{' '}
                  <Link to={ROUTES.LOGIN} className="register-footer-link">
                    Log in
                  </Link>
                </p>
                <p className="register-footer-text">
                  Are you an educator or faculty member?{' '}
                  <Link to={ROUTES.TEACHER_REGISTER} className="register-footer-link">
                    Register as a Teacher
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

export default RegisterPage;

