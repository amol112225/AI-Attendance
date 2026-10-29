/**
 * AttendAI Button Component
 * Reusable, accessible button with variant, size, icon, and loading support.
 */

import React from 'react';
import './Button.css';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  icon = null,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}) {
  const isDisabled = disabled || isLoading;
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    isLoading ? 'btn--loading' : '',
    isDisabled ? 'btn--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={isLoading}
      onClick={isDisabled ? undefined : onClick}
      {...props}
    >
      {isLoading && <span className="btn__spinner" aria-hidden="true" />}
      {!isLoading && icon && iconPosition === 'left' && (
        <span className="btn__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="btn__icon" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );
}

export default Button;
