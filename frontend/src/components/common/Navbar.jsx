/**
 * AttendAI Navbar Component
 * Milestone 2: Navbar Implementation
 *
 * Polished, accessible, responsive navigation header for public pages.
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Cpu, Menu, X, LogOut, User } from 'lucide-react';
import { Container } from './Container';
import { Button } from './Button';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../routes/routes';
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
  const { isAuthenticated, user, profile, role, isApproved, teacherRequest, logout } = useAuth();

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
      return;
    }
    navigate(ROUTES.LOGIN);
  };

  const handleGetStarted = (e) => {
    setIsMobileMenuOpen(false);
    if (onGetStartedClick) {
      onGetStartedClick(e);
      return;
    }
    navigate(ROUTES.REGISTER);
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await logout();
    navigate(ROUTES.ROOT);
  };

  // Derive readable user display identifier:
  // Prefer validated profile.full_name, then user_metadata.full_name, then email prefix
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'User');

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
            {isAuthenticated ? (
              <div className="navbar__user-actions">
                {role === 'teacher' && isApproved ? (
                  <Link
                    to={ROUTES.TEACHER_DASHBOARD}
                    className="navbar__teacher-pill"
                    title="Faculty Portal"
                  >
                    Faculty Portal
                  </Link>
                ) : (role === 'teacher' && !isApproved) || teacherRequest?.status === 'pending' ? (
                  <Link
                    to={ROUTES.TEACHER_STATUS}
                    className="navbar__pending-pill"
                    title="View Teacher Application Status"
                  >
                    Teacher Status
                  </Link>
                ) : role === 'admin' ? (
                  <Link
                    to={ROUTES.ADMIN_DASHBOARD}
                    className="navbar__teacher-pill"
                    title="Admin Console"
                  >
                    Admin Console
                  </Link>
                ) : role === 'student' ? (
                  <Link
                    to={ROUTES.STUDENT_DASHBOARD}
                    className="navbar__student-pill"
                    title="Student Dashboard"
                  >
                    Dashboard
                  </Link>
                ) : null}
                <div className="navbar__user-badge" title={user?.email || 'Authenticated User'}>
                  <User size={14} aria-hidden="true" />
                  <span className="navbar__user-name">{displayName}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={handleLogout}
                  icon={<LogOut size={14} />}
                  iconPosition="right"
                >
                  Log Out
                </Button>
              </div>
            ) : (
              <>
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
              </>
            )}
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
              {isAuthenticated ? (
                <div className="navbar__mobile-user-section">
                  <div className="navbar__mobile-user-info">
                    <User size={16} aria-hidden="true" />
                    <span className="navbar__mobile-user-name">{displayName}</span>
                    <span className="navbar__mobile-user-email">{user?.email}</span>
                    {role === 'teacher' && isApproved && (
                      <span className="navbar__mobile-role-badge">Faculty Member</span>
                    )}
                  </div>
                  {role === 'teacher' && isApproved && (
                    <Link
                      to={ROUTES.TEACHER_DASHBOARD}
                      className="navbar__mobile-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Faculty Portal →
                    </Link>
                  )}
                  {role === 'admin' && (
                    <Link
                      to={ROUTES.ADMIN_DASHBOARD}
                      className="navbar__mobile-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Console →
                    </Link>
                  )}
                  {role === 'student' && (
                    <Link
                      to={ROUTES.STUDENT_DASHBOARD}
                      className="navbar__mobile-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Student Dashboard →
                    </Link>
                  )}
                  {((role === 'teacher' && !isApproved) || teacherRequest?.status === 'pending') && !isApproved && (
                    <Link
                      to={ROUTES.TEACHER_STATUS}
                      className="navbar__mobile-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Teacher Application Status →
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="md"
                    type="button"
                    onClick={handleLogout}
                    icon={<LogOut size={16} />}
                    iconPosition="right"
                  >
                    Log Out
                  </Button>
                </div>
              ) : (
                <>
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
                  <Link
                    to={ROUTES.TEACHER_REGISTER}
                    className="navbar__mobile-link"
                    style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-brand-cyan)' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Teacher Registration & Portal →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
