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
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const TeacherRegisterPage = lazy(() => import('../pages/TeacherRegisterPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const TeacherLoginPage = lazy(() => import('../pages/TeacherLoginPage'));
const TeacherStatusPage = lazy(() => import('../pages/TeacherStatusPage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));
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

        {/* Milestone 8.3: AttendAI Student Registration */}
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        {/* Milestone 8.7: AttendAI Teacher Registration */}
        <Route path={ROUTES.TEACHER_REGISTER} element={<TeacherRegisterPage />} />
        <Route path="/teacher/register" element={<TeacherRegisterPage />} />

        {/* Milestone 8.4: AttendAI Student Login */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Milestone 8.7: AttendAI Teacher Login */}
        <Route path={ROUTES.TEACHER_LOGIN} element={<TeacherLoginPage />} />
        <Route path="/teacher/login" element={<TeacherLoginPage />} />

        {/* Milestone 8.7: AttendAI Teacher Request Status */}
        <Route path={ROUTES.TEACHER_STATUS} element={<TeacherStatusPage />} />

        {/* Milestone 8.6: Access Denied / Unauthorized Route */}
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

        {/* Catch-All 404 Page */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
