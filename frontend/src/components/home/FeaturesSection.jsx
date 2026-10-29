/**
 * AttendAI Features Section Component
 * Milestone 4: Homepage Features Section
 *
 * Highlights the three core capabilities: Face Recognition, Voice Recognition, and Teacher Review.
 */

import React from 'react';
import { ScanFace, Mic, ShieldCheck } from 'lucide-react';
import { Container } from '../common/Container';
import './FeaturesSection.css';

const FEATURES_DATA = [
  {
    id: 'face-recognition',
    title: 'Face Recognition',
    label: 'FACE VERIFICATION',
    description: 'Use face-based verification to help identify students during an attendance session.',
    icon: ScanFace,
    themeClass: 'feature-card__icon-wrap--cyan',
  },
  {
    id: 'voice-recognition',
    title: 'Voice Recognition',
    label: 'VOICE VERIFICATION',
    description: 'Use voice-based verification as another way to support the attendance process.',
    icon: Mic,
    themeClass: 'feature-card__icon-wrap--violet',
  },
  {
    id: 'teacher-review',
    title: 'Teacher Review',
    label: 'HUMAN OVERSIGHT',
    description: 'Let teachers review uncertain verification results and finalize attendance records.',
    icon: ShieldCheck,
    themeClass: 'feature-card__icon-wrap--indigo',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="features-section" aria-labelledby="features-heading">
      <Container size="xl">
        <div className="features-section__header">
          <span className="features-section__eyebrow">CORE CAPABILITIES</span>
          <h2 id="features-heading" className="features-section__title">
            Attendance made smarter.
          </h2>
          <p className="features-section__description">
            Bring face recognition, voice recognition, and teacher oversight together in one attendance workflow.
          </p>
        </div>

        <div className="features-grid" role="list">
          {FEATURES_DATA.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <article key={feature.id} className="feature-card" role="listitem">
                <div className="feature-card__top">
                  <div
                    className={`feature-card__icon-wrap ${feature.themeClass}`}
                    aria-hidden="true"
                  >
                    <IconComponent size={22} />
                  </div>
                  <span className="feature-card__badge">{feature.label}</span>
                </div>

                <h3 className="feature-card__title">{feature.title}</h3>
                <p className="feature-card__description">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default FeaturesSection;
