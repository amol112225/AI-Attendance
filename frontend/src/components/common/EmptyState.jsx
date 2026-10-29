/**
 * AttendAI EmptyState Component
 * Clean presentation component for empty screens, missing data, or initial configurations.
 */

import React from 'react';
import './EmptyState.css';

export function EmptyState({
  icon = null,
  title = 'No records found',
  description = 'There is currently no information to display here.',
  action = null,
  className = '',
}) {
  const classes = ['empty-state', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {icon && (
        <div className="empty-state__icon-wrap" aria-hidden="true">
          {icon}
        </div>
      )}
      {title && <h3 className="empty-state__title">{title}</h3>}
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

export default EmptyState;

