/**
 * AttendAI How It Works Section Component
 * Milestone 5: Homepage How It Works Section
 *
 * Displays the 4-step workflow: Start Session, Verify Students, Review Results, Finalize Attendance.
 */

import React from 'react';
import { PlayCircle, ScanFace, ClipboardCheck, CheckCheck } from 'lucide-react';
import { Container } from '../common/Container';
import './HowItWorksSection.css';

const STEPS_DATA = [
  {
    stepNumber: '01',
    stepTag: 'Step 1',
    title: 'Start a Session',
    description: 'A teacher selects the class or subject and starts an attendance session.',
    icon: PlayCircle,
  },
  {
    stepNumber: '02',
    stepTag: 'Step 2',
    title: 'Verify Students',
    description: 'Students can be checked using face recognition or voice recognition.',
    icon: ScanFace,
  },
  {
    stepNumber: '03',
    stepTag: 'Step 3',
    title: 'Review Results',
    description: 'The teacher reviews uncertain or unmatched verification results before making decisions.',
    icon: ClipboardCheck,
  },
  {
    stepNumber: '04',
    stepTag: 'Step 4',
    title: 'Finalize Attendance',
    description: 'The teacher confirms the reviewed records to complete the attendance session.',
    icon: CheckCheck,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="how-it-works-section" aria-labelledby="how-it-works-heading">
      <Container size="xl">
        <div className="how-it-works-section__header">
          <span className="how-it-works-section__eyebrow">SIMPLE WORKFLOW</span>
          <h2 id="how-it-works-heading" className="how-it-works-section__title">
            From verification to attendance.
          </h2>
          <p className="how-it-works-section__description">
            A clear, teacher-guided process designed to make attendance easier to manage.
          </p>
        </div>

        <ol className="steps-grid">
          {STEPS_DATA.map((step) => {
            const IconComponent = step.icon;
            return (
              <li key={step.stepNumber} className="step-card">
                <div className="step-card__top">
                  <span className="step-card__number" aria-hidden="true">
                    {step.stepNumber}
                  </span>
                  <div className="step-card__icon-wrap" aria-hidden="true">
                    <IconComponent size={20} />
                  </div>
                </div>

                <span className="step-card__step-tag">{step.stepTag}</span>
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__description">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}

export default HowItWorksSection;

