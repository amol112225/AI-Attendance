/**
 * AttendAI Teacher Registration Page Component
 * Milestone 8.7: Teacher Registration and Approval Request
 *
 * Structurally identical to Student Registration (RegisterPage.jsx):
 * - Reuses the exact same form layout, container, input dimensions, buttons, and styles.
 * - Displays Teacher-specific content: Faculty Portal badge, institutional email, approval notice.
 * - Submits teacher application via registerTeacher() without auto-assigning elevated privileges.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  GraduationCap,
  ShieldCheck,
  Clock,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { registerTeacher, formatAuthError } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../routes/routes';
import './TeacherRegisterPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export function TeacherRegisterPage() {
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
  // - 'confirmation_required': Email confirmation link sent
  // - 'active_session': Direct session created & approval request submitted
  const [successState, setSuccessState] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState('');

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
      errors.email = 'Please enter a valid email address (e.g. professor@university.edu).';
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
      const { data, error, isConfirmationRequired } = await registerTeacher({
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
        setSuccessState('confirmation_required');
      } else if (data?.session) {
        setAuthSession(data.session);
        setSuccessState('active_session');
      } else {
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
            <div
              className="register-success-card"
              role="region"
              aria-label="Teacher Registration Confirmation Notice"
            >
              <div
                className="register-success-icon register-success-icon--confirmation"
                aria-hidden="true"
              >
                <Mail size={28} />
              </div>
              <h1 className="register-success-title">Verify your email</h1>
              <p className="register-success-description">
                We sent a confirmation link to{' '}
                <span className="register-success-highlight">{registeredEmail}</span>.
                Please check your inbox and verify your email. Once verified, log in to
                track your Teacher approval request.
              </p>
              <div className="register-success-actions">
                <Button
                  variant="primary"
                  size="md"
                  type="button"
                  onClick={() => navigate(ROUTES.TEACHER_LOGIN)}
                >
                  Go to Teacher Login
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
          )}

          {/* Scenario B: Active Session & Immediate Teacher Request Created */}
          {successState === 'active_session' && (
            <div
              className="register-success-card"
              role="region"
              aria-label="Teacher Application Submitted Notice"
            >
              <div
                className="register-success-icon register-success-icon--active"
                aria-hidden="true"
              >
                <Clock size={28} />
              </div>
              <h1 className="register-success-title">Application Submitted!</h1>
              <p className="register-success-description">
                Your account has been registered and your request to become a Teacher
                has been submitted for administrative review.
                <br />
                <strong>Current Status: Pending Approval</strong>
              </p>
              <div className="register-success-actions">
                <Button
                  variant="primary"
                  size="md"
                  type="button"
                  onClick={() => navigate(ROUTES.TEACHER_STATUS)}
                >
                  View Approval Status
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
          )}

          {/* Teacher Registration Form (Default View) */}
          {successState === null && (
            <>
              {/* Role Switcher Tabs */}
              <div className="auth-role-tabs" role="tablist" aria-label="Account Type Selection">
                <Link to={ROUTES.REGISTER} className="auth-role-tab" role="tab" aria-selected="false">
                  <GraduationCap size={15} aria-hidden="true" />
                  <span>Student Registration</span>
                </Link>
                <span className="auth-role-tab auth-role-tab--active" role="tab" aria-selected="true">
                  <BookOpen size={15} aria-hidden="true" />
                  <span>Teacher Registration</span>
                </span>
              </div>

              <header className="register-header">
                <div className="register-badge register-badge--teacher">
                  <ShieldCheck size={13} aria-hidden="true" />
                  <span>FACULTY PORTAL</span>
                </div>
                <h1 className="register-title">Register as a Teacher</h1>
                <p className="register-subtitle">
                  Apply for teacher privileges to conduct AI-assisted attendance sessions.
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
                  <label htmlFor="teacher-fullName" className="register-label">
                    Full Name
                  </label>
                  <div className="register-input-wrapper">
                    <input
                      id="teacher-fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder="e.g. Prof. Eleanor Vance"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`register-input ${fieldErrors.fullName ? 'register-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.fullName)}
                      aria-describedby={fieldErrors.fullName ? 'teacher-fullName-error' : undefined}
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <span id="teacher-fullName-error" className="register-field-error" role="alert">
                      {fieldErrors.fullName}
                    </span>
                  )}
                </div>

                {/* Email Address */}
                <div className="register-field">
                  <label htmlFor="teacher-email" className="register-label">
                    Institutional Email Address
                  </label>
                  <div className="register-input-wrapper">
                    <input
                      id="teacher-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="faculty@university.edu"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`register-input ${fieldErrors.email ? 'register-input--error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'teacher-email-error' : undefined}
                    />
                  </div>
                  {fieldErrors.email && (
                    <span id="teacher-email-error" className="register-field-error" role="alert">
                      {fieldErrors.email}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="register-field">
                  <label htmlFor="teacher-password" className="register-label">
                    Password
                  </label>
                  <div className="register-input-wrapper">
                    <input
                      id="teacher-password"
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
                      aria-describedby={fieldErrors.password ? 'teacher-password-error' : 'teacher-password-hint'}
                    />
                  </div>
                  {fieldErrors.password ? (
                    <span id="teacher-password-error" className="register-field-error" role="alert">
                      {fieldErrors.password}
                    </span>
                  ) : (
                    <span id="teacher-password-hint" className="register-field-hint">
                      Must be at least 6 characters.
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="register-field">
                  <label htmlFor="teacher-confirmPassword" className="register-label">
                    Confirm Password
                  </label>
                  <div className="register-input-wrapper">
                    <input
                      id="teacher-confirmPassword"
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
                      aria-describedby={fieldErrors.confirmPassword ? 'teacher-confirmPassword-error' : undefined}
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span id="teacher-confirmPassword-error" className="register-field-error" role="alert">
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>

                {/* Administrative Approval Policy Notice */}
                <div className="register-policy-notice register-policy-notice--warning" role="note">
                  <Clock size={16} aria-hidden="true" />
                  <p className="register-policy-text">
                    <strong>Administrative Approval Required:</strong> In accordance with AttendAI
                    security policies, teacher roles cannot be self-assigned. Your submission will
                    register your account and queue an approval request for administrator verification.
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
                    Submit Teacher Application
                  </Button>
                </div>
              </form>

              {/* Login and Switcher Links */}
              <footer className="register-footer">
                <p className="register-footer-text">
                  Already registered as a teacher?{' '}
                  <Link to={ROUTES.TEACHER_LOGIN} className="register-footer-link">
                    Teacher Sign In
                  </Link>
                </p>
                <p className="register-footer-text">
                  Looking for student registration?{' '}
                  <Link to={ROUTES.REGISTER} className="register-footer-link">
                    Student Registration
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

export default TeacherRegisterPage;
