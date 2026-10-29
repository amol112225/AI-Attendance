/**
 * AttendAI Home Page
 * Milestone 3 & 4: Hero Section & Features Section
 *
 * Implements the hero section with a two-column responsive layout,
 * accessible action triggers, and the core capabilities FeaturesSection.
 */

import React from 'react';
import {
  ScanFace,
  Mic,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { FeaturesSection } from '../components/home/FeaturesSection';
import './HomePage.css';

// Sample fictional rows demonstrating the multi-modal attendance verification interface
const DEMO_ATTENDANCE_ROWS = [
  {
    id: 'STU-1042',
    name: 'Alex Rivera',
    initials: 'AR',
    method: 'Face Scan',
    methodIcon: ScanFace,
    status: 'Present',
    statusClass: 'hero-preview__status--present',
  },
  {
    id: 'STU-1088',
    name: 'Jordan Chen',
    initials: 'JC',
    method: 'Voice Pass',
    methodIcon: Mic,
    status: 'Review',
    statusClass: 'hero-preview__status--review',
  },
  {
    id: 'STU-1125',
    name: 'Taylor Smith',
    initials: 'TS',
    method: 'Dual Verify',
    methodIcon: ScanFace,
    status: 'Present',
    statusClass: 'hero-preview__status--present',
  },
  {
    id: 'STU-1150',
    name: 'Morgan Lee',
    initials: 'ML',
    method: 'Manual Check',
    methodIcon: ShieldCheck,
    status: 'Pending',
    statusClass: 'hero-preview__status--pending',
  },
];

export function HomePage() {
  const handleGetStarted = (e) => {
    e.preventDefault();
    // Milestone integration point: Authentication & Onboarding
    // Kept safe and inert while authentication is under construction.
  };

  const handleExploreFeatures = (e) => {
    e.preventDefault();
    const featuresElement = document.getElementById('features');
    if (featuresElement) {
      featuresElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home-page">
      <section className="hero-section" aria-labelledby="hero-heading">
        <Container size="xl">
          <div className="hero-grid">
            {/* Left Column: Hero Copy & Actions */}
            <div className="hero-content">
              <div className="hero-eyebrow">
                <Sparkles size={14} aria-hidden="true" />
                <span>SMART ATTENDANCE. SIMPLIFIED.</span>
              </div>

              <h1 id="hero-heading" className="hero-title">
                Attendance, Reimagined{' '}
                <span className="hero-title-highlight">with AI.</span>
              </h1>

              <p className="hero-description">
                A smarter attendance platform combining face and voice recognition with
                teacher-reviewed records for a more reliable attendance workflow.
              </p>

              <div className="hero-actions">
                <Button
                  variant="primary"
                  size="lg"
                  type="button"
                  onClick={handleGetStarted}
                  icon={<ArrowRight size={16} />}
                  iconPosition="right"
                >
                  Get Started
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  type="button"
                  onClick={handleExploreFeatures}
                >
                  Explore Features
                </Button>
              </div>

              <div className="hero-footnote">
                <CheckCircle2 size={15} className="hero-footnote-icon" aria-hidden="true" />
                <span>Multi-modal verification • Teacher review oversight</span>
              </div>
            </div>

            {/* Right Column: Attendance Interface Preview (Illustrative Demo) */}
            <div className="hero-visual">
              <div
                className="hero-preview"
                role="region"
                aria-label="Illustrative Attendance Interface Preview"
              >
                {/* Preview Header */}
                <div className="hero-preview__header">
                  <div className="hero-preview__session-info">
                    <span className="hero-preview__dot" aria-hidden="true" />
                    <span className="hero-preview__session-title">Session: CS-301 Lecture</span>
                  </div>
                  <span className="hero-preview__demo-tag">Demo Preview</span>
                </div>

                {/* Modality Capabilities */}
                <div className="hero-preview__modalities">
                  <div className="hero-preview__modality-pill">
                    <ScanFace size={14} aria-hidden="true" />
                    <span>Face AI</span>
                  </div>
                  <div className="hero-preview__modality-pill">
                    <Mic size={14} aria-hidden="true" />
                    <span>Voice AI</span>
                  </div>
                  <div className="hero-preview__modality-pill">
                    <ShieldCheck size={14} aria-hidden="true" />
                    <span>Review</span>
                  </div>
                </div>

                {/* Sample Attendance List */}
                <div className="hero-preview__list">
                  {DEMO_ATTENDANCE_ROWS.map((row) => {
                    const MethodIcon = row.methodIcon;
                    return (
                      <div key={row.id} className="hero-preview__row">
                        <div className="hero-preview__student">
                          <div className="hero-preview__avatar" aria-hidden="true">
                            {row.initials}
                          </div>
                          <div className="hero-preview__student-meta">
                            <span className="hero-preview__student-name">{row.name}</span>
                            <span className="hero-preview__student-id">{row.id}</span>
                          </div>
                        </div>

                        <div className="hero-preview__verification">
                          <span className="hero-preview__method">
                            <MethodIcon size={13} aria-hidden="true" />
                            <span>{row.method}</span>
                          </span>
                          <span className={`hero-preview__status ${row.statusClass}`}>
                            {row.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Preview Caption */}
                <p className="hero-preview__caption">
                  Illustrative UI preview • Non-operational demonstration data
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Milestone 4: Features Section */}
      <FeaturesSection />
    </div>
  );
}

export default HomePage;
