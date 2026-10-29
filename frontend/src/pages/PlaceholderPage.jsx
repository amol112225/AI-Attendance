/**
 * AttendAI Root Route Development Placeholder
 * Milestone 1: Frontend Foundation and Architecture
 *
 * NOTE: This is a foundation placeholder to verify design tokens, routing,
 * and reusable components. Full Home Page is scheduled for Milestone 2.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Palette,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import './PlaceholderPage.css';

export function PlaceholderPage() {
  const [btnLoading, setBtnLoading] = useState(false);
  const [showErrorDemo, setShowErrorDemo] = useState(false);
  const [showEmptyDemo, setShowEmptyDemo] = useState(false);

  return (
    <div className="placeholder-page">
      <Container size="xl">
        {/* Hero Section */}
        <div className="placeholder-page__hero">
          <div className="placeholder-page__tag">
            <Sparkles size={14} />
            <span>Milestone 1 • Development Placeholder</span>
          </div>

          <h1 className="placeholder-page__title">AttendAI Frontend Foundation</h1>

          <p className="placeholder-page__subtitle">
            Clean, modular React 19 + Vite architecture configured with centralized design tokens,
            declarative routing, reusable components, and strict security safeguards.
          </p>

          <div className="showcase-row" style={{ justifyContent: 'center' }}>
            <Link to="/test-not-found-route">
              <Button variant="outline" size="sm" icon={<ExternalLink size={14} />}>
                Test 404 Route
              </Button>
            </Link>
          </div>
        </div>

        {/* Foundation Grid */}
        <div className="placeholder-page__grid">
          {/* Card 1: Shared Components Showcase */}
          <div className="card">
            <div className="card__header">
              <div className="card__icon-box">
                <Layers size={20} />
              </div>
              <h2 className="card__title">Reusable Components</h2>
            </div>
            <div className="card__body">
              <p className="card__text">
                Accessible, composable primitives built with semantic HTML and consistent sizing.
              </p>

              <div className="showcase-row">
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={btnLoading}
                  onClick={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 1500);
                  }}
                >
                  {btnLoading ? 'Simulating...' : 'Test Primary & Loading'}
                </Button>
                <Button variant="secondary" size="sm">
                  Secondary
                </Button>
                <Button variant="ghost" size="sm">
                  Ghost
                </Button>
              </div>

              <div className="showcase-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowErrorDemo(!showErrorDemo)}
                >
                  {showErrorDemo ? 'Hide Alert Demo' : 'Toggle Alert Demo'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmptyDemo(!showEmptyDemo)}
                >
                  {showEmptyDemo ? 'Hide Empty State' : 'Toggle Empty State'}
                </Button>
              </div>

              {showErrorDemo && (
                <ErrorMessage
                  title="Validation Notice"
                  message="This demonstrates the accessible error alert component with an optional retry action."
                  onRetry={() => setShowErrorDemo(false)}
                  retryLabel="Dismiss Alert"
                />
              )}

              {showEmptyDemo && (
                <EmptyState
                  title="No Attendance Sessions"
                  description="When session data is empty, this reusable component maintains UI consistency."
                />
              )}
            </div>
          </div>

          {/* Card 2: Visual Foundation & Design Tokens */}
          <div className="card">
            <div className="card__header">
              <div className="card__icon-box">
                <Palette size={20} />
              </div>
              <h2 className="card__title">Design Tokens & Palette</h2>
            </div>
            <div className="card__body">
              <p className="card__text">
                Centralized CSS tokens defining the deep navy foundation, violet/cyan accents, and
                soft lavender surfaces.
              </p>

              <div className="token-swatches">
                <div className="token-swatch">
                  <div
                    className="token-swatch__preview"
                    style={{ backgroundColor: 'var(--color-bg-base)' }}
                  />
                  <span className="token-swatch__name">Navy Base</span>
                </div>
                <div className="token-swatch">
                  <div
                    className="token-swatch__preview"
                    style={{ backgroundColor: 'var(--color-bg-surface)' }}
                  />
                  <span className="token-swatch__name">Navy Surface</span>
                </div>
                <div className="token-swatch">
                  <div
                    className="token-swatch__preview"
                    style={{ backgroundColor: 'var(--color-brand-primary)' }}
                  />
                  <span className="token-swatch__name">Indigo Primary</span>
                </div>
                <div className="token-swatch">
                  <div
                    className="token-swatch__preview"
                    style={{ backgroundColor: 'var(--color-brand-violet)' }}
                  />
                  <span className="token-swatch__name">Violet Accent</span>
                </div>
                <div className="token-swatch">
                  <div
                    className="token-swatch__preview"
                    style={{ backgroundColor: 'var(--color-brand-cyan)' }}
                  />
                  <span className="token-swatch__name">Cyan Accent</span>
                </div>
              </div>

              <div className="showcase-row" style={{ marginTop: 'var(--space-2)' }}>
                <LoadingIndicator size="sm" message="Token Loading Indicator" />
              </div>
            </div>
          </div>

          {/* Card 3: Milestone 1 Verification Status */}
          <div className="card">
            <div className="card__header">
              <div className="card__icon-box">
                <CheckCircle2 size={20} />
              </div>
              <h2 className="card__title">Milestone 1 Scope Checklist</h2>
            </div>
            <div className="card__body">
              <div className="status-list">
                <div className="status-item">
                  <CheckCircle2 size={16} className="status-item__icon" />
                  <span>React 19 + JavaScript + Vite foundation initialized</span>
                </div>
                <div className="status-item">
                  <CheckCircle2 size={16} className="status-item__icon" />
                  <span>Centralized design tokens and minimal CSS reset established</span>
                </div>
                <div className="status-item">
                  <CheckCircle2 size={16} className="status-item__icon" />
                  <span>Reusable components (Button, Container, Loading, Error, Empty)</span>
                </div>
                <div className="status-item">
                  <CheckCircle2 size={16} className="status-item__icon" />
                  <span>Declarative React Router with lazy loading for future pages</span>
                </div>
                <div className="status-item">
                  <CheckCircle2 size={16} className="status-item__icon" />
                  <span>Zero unnecessary backend or database queries executed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Architecture & Future Roadmap */}
          <div className="card">
            <div className="card__header">
              <div className="card__icon-box">
                <ShieldCheck size={20} />
              </div>
              <h2 className="card__title">Security & Next Milestones</h2>
            </div>
            <div className="card__body">
              <p className="card__text">
                Strict boundaries maintained: no hardcoded secrets, no service-role keys in client,
                and environment variable templates prepared safely.
              </p>
              <div className="status-list">
                <div className="status-item">
                  <RefreshCw size={14} style={{ color: 'var(--color-brand-cyan)' }} />
                  <span>Next: Milestone 2 — AttendAI Home & Landing Page</span>
                </div>
                <div className="status-item">
                  <RefreshCw size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <span>Future: Milestone 3 — Supabase Auth (Login / Register)</span>
                </div>
                <div className="status-item">
                  <RefreshCw size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <span>Future: Milestone 4 — Dashboards (Student & Teacher)</span>
                </div>
                <div className="status-item">
                  <RefreshCw size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <span>Future: Milestone 5+ — Face & Voice AI Attendance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default PlaceholderPage;

