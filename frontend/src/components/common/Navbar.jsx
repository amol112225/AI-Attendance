/**
 * AttendAI Navbar Component
 * Milestone 2: Navbar Implementation
 *
 * Polished, accessible, responsive navigation header for public pages.
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Cpu, Menu, X } from 'lucide-react';
import { Container } from './Container';
import { Button } from './Button';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Home', href: '/', id: 'home' },
  { label: 'Features', href: '#features', id: 'features' },
  { label: 'How It Works', href: '#how-it-works', id: 'how-it-works' },
  { label: 'About', href: '#about', id: 'about' },
];

export function Navbar({
  onLoginClick,
  onGetStartedClick,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState('/');
  const location = useLocation();
  const navigate = useNavigate();

  // Reset mobile menu if pathname changes during navigation
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Auto-close mobile drawer when window resizes to desktop breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleBrandClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleLinkClick = (e, link) => {
    if (link.href === '/') {
      if (location.pathname === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setIsMobileMenuOpen(false);
      return;
    }

    if (link.href.startsWith('#')) {
      if (location.pathname !== '/') {
        // Navigate back to home route with target hash
        setIsMobileMenuOpen(false);
        navigate('/' + link.href);
        return;
      }

      const targetElement = document.getElementById(link.id);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Section not yet implemented in current milestone (e.g. #about).
        // Prevent jarring URL jump or broken scrolling.
        e.preventDefault();
      }
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogin = (e) => {
    setIsMobileMenuOpen(false);
    if (onLoginClick) {
      onLoginClick(e);
    }
    // No-op placeholder: ready for Milestone 3 Supabase authentication flow.
  };

  const handleGetStarted = (e) => {
    setIsMobileMenuOpen(false);
    if (onGetStartedClick) {
      onGetStartedClick(e);
    }
    // No-op placeholder: ready for Milestone 3 registration onboarding flow.
  };

  return (
    <header className="navbar">
      <Container size="xl">
        <div className="navbar__inner">
          {/* Brand */}
          <Link
            to="/"
            className="navbar__brand"
            onClick={handleBrandClick}
            aria-label="AttendAI Home"
          >
            <div className="navbar__brand-icon" aria-hidden="true">
              <Cpu size={18} />
            </div>
            <span className="navbar__brand-name">AttendAI</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="navbar__nav" aria-label="Main Navigation">
            <ul className="navbar__nav-list">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  {link.href === '/' ? (
                    <Link
                      to="/"
                      className="navbar__nav-link"
                      onClick={(e) => handleLinkClick(e, link)}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="navbar__nav-link"
                      onClick={(e) => handleLinkClick(e, link)}
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="navbar__actions">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleLogin}
            >
              Log In
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="navbar__toggle"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="attendai-mobile-menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </Container>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          className="navbar__mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            id="attendai-mobile-menu"
            className="navbar__mobile-drawer"
            role="region"
            aria-label="Mobile Navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="navbar__mobile-list">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  {link.href === '/' ? (
                    <Link
                      to="/"
                      className="navbar__mobile-link"
                      onClick={(e) => handleLinkClick(e, link)}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="navbar__mobile-link"
                      onClick={(e) => handleLinkClick(e, link)}
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>

            <div className="navbar__mobile-actions">
              <Button
                variant="outline"
                size="md"
                type="button"
                onClick={handleLogin}
              >
                Log In
              </Button>
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
