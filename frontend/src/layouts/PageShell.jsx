/**
 * AttendAI PageShell Component
 * Master layout wrapper establishing the visual foundation and responsive framing.
 */

import React from 'react';
import { Cpu } from 'lucide-react';
import { Container } from '../components/common/Container';
import './PageShell.css';

const CURRENT_YEAR = new Date().getFullYear();

export function PageShell({ children }) {
  return (
    <div className="page-shell">
      <header className="page-shell__header">
        <Container size="xl">
          <div className="page-shell__header-inner">
            <div className="page-shell__brand">
              <div className="page-shell__logo" aria-hidden="true">
                <Cpu size={20} />
              </div>
              <span className="page-shell__brand-name">AttendAI</span>
            </div>

            <div className="page-shell__badge">
              <span className="page-shell__badge-dot" aria-hidden="true" />
              <span>Milestone 1 • Foundation</span>
            </div>
          </div>
        </Container>
      </header>

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
