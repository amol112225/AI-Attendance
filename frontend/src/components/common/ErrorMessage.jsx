/**
 * AttendAI ErrorMessage Component
 * Accessible alert component for displaying errors with optional retry trigger.
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';
import './ErrorMessage.css';

export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  className = '',
}) {
  const classes = ['error-message', className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="alert" aria-live="assertive">
      <div className="error-message__icon" aria-hidden="true">
        <AlertCircle size={22} />
      </div>
      <div className="error-message__content">
        {title && <h3 className="error-message__title">{title}</h3>}
        {message && <p className="error-message__text">{message}</p>}
        {onRetry && (
          <div className="error-message__action">
            <Button variant="danger" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;

