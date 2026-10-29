/**
 * AttendAI PageShell Component
 * Master layout wrapper establishing the visual foundation, navbar, footer, and responsive framing.
 */

import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import './PageShell.css';

export function PageShell({ children }) {
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
