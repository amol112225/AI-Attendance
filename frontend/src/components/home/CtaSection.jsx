/**
 * AttendAI CTA Section Component
 * Milestone 6: Final CTA Section
 *
 * Implements the closing call-to-action on the homepage.
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import './CtaSection.css';

export function CtaSection() {
  const handleGetStarted = (e) => {
    e.preventDefault();
    // Milestone integration point: Authentication & Onboarding
    // Safely kept inert until authentication and registration are implemented.
  };

  return (
    <section id="get-started" className="cta-section" aria-labelledby="cta-heading">
      <Container size="xl">
        <div className="cta-card">
          <span className="cta-card__eyebrow">READY TO SIMPLIFY ATTENDANCE?</span>
          <h2 id="cta-heading" className="cta-card__title">
            A smarter way to manage attendance starts here.
          </h2>
          <p className="cta-card__description">
            Bring face verification, voice verification, and teacher-reviewed attendance
            into one streamlined workflow.
          </p>
          <div className="cta-card__actions">
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
          </div>
        </div>
      </Container>
    </section>
  );
}

export default CtaSection;

