/**
 * AttendAI PageShell Component
 * Master layout wrapper establishing the visual foundation, navbar, and responsive framing.
 */

import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Container } from '../components/common/Container';
import './PageShell.css';

const CURRENT_YEAR = new Date().getFullYear();

export function PageShell({ children }) {
  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-shell__main" id="main-content">
        {children}
      </main>

      <footer className="page-shell__footer">
        <Container size="xl">
          <div className="page-shell__footer-inner">
            <p>© {CURRENT_YEAR} AttendAI. Architecture & Frontend Foundation.</p>
            <p>React + Vite • Supabase & FastAPI Ready</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}

export default PageShell;
