/**
 * AttendAI Application Routes Configuration
 *
 * Implements route definitions with code splitting (lazy loading)
 * and accessible loading fallback via React Suspense.
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { RoleBasedRoute } from './RoleBasedRoute';
import { ROLES } from './accessRules';
import { ROUTES } from './routes';

// Code-split pages using React.lazy to maintain minimal initial bundle size
const HomePage = lazy(() => import('../pages/HomePage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const TeacherRegisterPage = lazy(() => import('../pages/TeacherRegisterPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const TeacherLoginPage = lazy(() => import('../pages/TeacherLoginPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));
const TeacherStatusPage = lazy(() => import('../pages/TeacherStatusPage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Milestone 9.1: Role Dashboards
const StudentDashboard = lazy(() => import('../pages/dashboards/StudentDashboard'));
const TeacherDashboard = lazy(() => import('../pages/dashboards/TeacherDashboard'));
const AdminDashboard = lazy(() => import('../pages/dashboards/AdminDashboard'));

// Milestone 9.5: Centralized Role Dashboard Redirection
const RoleDashboardRedirect = lazy(() => import('./RoleDashboardRedirect'));

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

        {/* Milestone 8.9: AttendAI Forgot Password & Reset Password */}
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

        {/* Milestone 8.7: AttendAI Teacher Login */}
        <Route path={ROUTES.TEACHER_LOGIN} element={<TeacherLoginPage />} />
        <Route path="/teacher/login" element={<TeacherLoginPage />} />

        {/* Milestone 8.7: AttendAI Teacher Request Status */}
        <Route path={ROUTES.TEACHER_STATUS} element={<TeacherStatusPage />} />

        {/* Milestone 8.6: Access Denied / Unauthorized Route */}
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

        {/* Milestone 9.5: Centralized Role Dashboard Redirection */}
        <Route path={ROUTES.DASHBOARD} element={<RoleDashboardRedirect />} />

        {/* ==================================================================
            Milestone 9.1: Student Dashboard & Sub-routes
            ================================================================== */}
        <Route
          path={ROUTES.STUDENT_DASHBOARD}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.STUDENT, ROLES.ADMIN]} requireApproval={false}>
              <StudentDashboard />
            </RoleBasedRoute>
          }
        />
        <Route path="/student" element={<Navigate to={ROUTES.STUDENT_DASHBOARD} replace />} />
        <Route
          path={ROUTES.STUDENT_ATTENDANCE}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.STUDENT, ROLES.ADMIN]} requireApproval={false}>
              <StudentDashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path={ROUTES.STUDENT_SUBJECTS}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.STUDENT, ROLES.ADMIN]} requireApproval={false}>
              <StudentDashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path={ROUTES.STUDENT_PROFILE}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.STUDENT, ROLES.ADMIN]} requireApproval={false}>
              <StudentDashboard />
            </RoleBasedRoute>
          }
        />

        {/* ==================================================================
            Milestone 9.1: Teacher Dashboard & Sub-routes (Approved Teachers)
            ================================================================== */}
        <Route
          path={ROUTES.TEACHER_DASHBOARD}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]} requireApproval={true}>
              <TeacherDashboard />
            </RoleBasedRoute>
          }
        />
        <Route path="/teacher" element={<Navigate to={ROUTES.TEACHER_DASHBOARD} replace />} />
        <Route
          path={ROUTES.TEACHER_CLASSES}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]} requireApproval={true}>
              <TeacherDashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path={ROUTES.TEACHER_SESSIONS}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]} requireApproval={true}>
              <TeacherDashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path={ROUTES.TEACHER_RECORDS}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]} requireApproval={true}>
              <TeacherDashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path={ROUTES.TEACHER_PROFILE}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]} requireApproval={true}>
              <TeacherDashboard />
            </RoleBasedRoute>
          }
        />

        {/* ==================================================================
            Milestone 9.1: Admin Dashboard & Sub-routes (Administrators Only)
            ================================================================== */}
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.ADMIN]} requireApproval={true}>
              <AdminDashboard />
            </RoleBasedRoute>
          }
        />
        <Route path="/admin" element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
        <Route
          path={ROUTES.ADMIN_USERS}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.ADMIN]} requireApproval={true}>
              <AdminDashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_TEACHER_APPROVALS}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.ADMIN]} requireApproval={true}>
              <AdminDashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_SYSTEM}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.ADMIN]} requireApproval={true}>
              <AdminDashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_PROFILE}
          element={
            <RoleBasedRoute allowedRoles={[ROLES.ADMIN]} requireApproval={true}>
              <AdminDashboard />
            </RoleBasedRoute>
          }
        />

        {/* Catch-All 404 Page */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
