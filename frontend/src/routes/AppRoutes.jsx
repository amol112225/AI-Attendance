/**
 * AttendAI Application Routes Configuration
 *
 * Implements route definitions with code splitting (lazy loading)
 * and accessible loading fallback via React Suspense.
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { ROUTES } from './routes';

// Code-split pages using React.lazy to maintain minimal initial bundle size
const HomePage = lazy(() => import('../pages/HomePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <LoadingIndicator centered size="lg" message="Loading AttendAI view..." />
      }
    >
      <Routes>
        {/* Milestone 3: Home Page with Hero Section */}
        <Route path={ROUTES.ROOT} element={<HomePage />} />

        {/* Catch-All 404 Page */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
