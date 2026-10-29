/**
 * AttendAI Footer Component
 * Milestone 6: Final CTA and Footer
 *
 * Reusable, accessible footer displaying brand overview, navigation anchors,
 * dynamic copyright, and verification oversight disclaimer.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cpu } from 'lucide-react';
import { Container } from './Container';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

const FOOTER_LINKS = [
  { label: 'Home', href: '/', id: 'home' },
  { label: 'Features', href: '#features', id: 'features' },
  { label: 'How It Works', href: '#how-it-works', id: 'how-it-works' },
];

export function Footer() {
  const location = useLocation();

  const handleLinkClick = (e, link) => {
    if (link.href === '/') {
      if (location.pathname === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (link.href.startsWith('#')) {
      const targetElement = document.getElementById(link.id);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });
      } else if (location.pathname !== '/') {
        // If on another route (e.g. 404), allow default navigation back to home with hash
      } else {
        e.preventDefault();
      }
    }
  };

  const handleBrandClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer" role="contentinfo">
      <Container size="xl">
        <div className="footer__main">
          {/* Brand Column */}
          <div className="footer__brand-col">
            <Link
              to="/"
              className="footer__brand"
              onClick={handleBrandClick}
              aria-label="AttendAI Home"
            >
              <div className="footer__brand-icon" aria-hidden="true">
                <Cpu size={16} />
              </div>
              <span className="footer__brand-name">AttendAI</span>
            </Link>
            <p className="footer__description">
              AI-assisted attendance with face verification, voice verification, and teacher oversight.
            </p>
          </div>

          {/* Navigation Column */}
          <div className="footer__nav-col">
            <span className="footer__nav-title">Navigation</span>
            <nav aria-label="Footer Navigation">
              <ul className="footer__nav-list">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.id}>
                    {link.href === '/' ? (
                      <Link
                        to="/"
                        className="footer__link"
                        onClick={(e) => handleLinkClick(e, link)}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="footer__link"
                        onClick={(e) => handleLinkClick(e, link)}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="footer__bottom">
          <p className="footer__disclaimer">
            Verification results require appropriate review. This website demonstrates the interface
            and planned workflows rather than providing live attendance services.
          </p>
          <p className="footer__copyright">
            © {CURRENT_YEAR} AttendAI. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
