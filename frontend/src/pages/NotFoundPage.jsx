/**
 * AttendAI NotFoundPage (404)
 * Reusable fallback route for nonexistent application paths.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import './NotFoundPage.css';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <Container size="sm">
        <div className="not-found-page__card">
          <span className="not-found-page__badge">HTTP 404</span>
          <h1 className="not-found-page__code">404</h1>
          <h2 className="not-found-page__title">Page not found</h2>
          <p className="not-found-page__desc">
            The page or route you are looking for does not exist or has not been implemented yet.
          </p>
          <div className="not-found-page__action">
            <Button
              variant="primary"
              icon={<Home size={16} />}
              onClick={() => navigate('/')}
            >
              Return to Foundation Root
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default NotFoundPage;
