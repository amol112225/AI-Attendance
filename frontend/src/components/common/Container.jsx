/**
 * AttendAI Container Component
 * Responsive centering container with consistent max-widths and horizontal padding.
 */

import React from 'react';
import './Container.css';

export function Container({
  as: Component = 'div',
  size = 'xl',
  className = '',
  children,
  ...props
}) {
  const classes = ['container', `container--${size}`, className].filter(Boolean).join(' ');

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}

export default Container;
