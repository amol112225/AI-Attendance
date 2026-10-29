/**
 * AttendAI LoadingIndicator Component
 * Accessible loading state indicator with customizable size, label, and full-center support.
 */

import React from 'react';
import './LoadingIndicator.css';

export function LoadingIndicator({
  size = 'md',
  message = 'Loading...',
  centered = false,
  className = '',
}) {
  const classes = [
    'loading-indicator',
    `loading-indicator--${size}`,
    centered ? 'loading-indicator--centered' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="status" aria-live="polite">
      <div className="loading-indicator__spinner" aria-hidden="true" />
      {message && <span className="loading-indicator__text">{message}</span>}
      <span className="sr-only">{message || 'Content is loading'}</span>
    </div>
  );
}

export default LoadingIndicator;

