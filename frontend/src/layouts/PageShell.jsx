/**
 * AttendAI PageShell Component
 * Master layout wrapper. For dashboard routes, renders only children (no public Navbar/Footer).
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import './PageShell.css';

const DASHBOARD_ROOTS = ['/student', '/teacher', '/admin', '/dashboard'];

export function PageShell({ children }) {
  const location = useLocation();
  const isDashboard = DASHBOARD_ROOTS.some(
    (root) => location.pathname === root || location.pathname.startsWith(`${root}/`)
  );

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-shell__main" id="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default PageShell;
