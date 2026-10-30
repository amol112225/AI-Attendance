/**
 * AttendAI Role-Specific Navigation Configurations
 * Milestone 9.1: Dashboard Architecture and Shared Layout
 *
 * Requirements:
 * - Student: Dashboard, My Attendance, My Subjects, My Profile
 * - Teacher: Dashboard, My Classes, Attendance Sessions, Attendance Records, My Profile
 * - Admin: Dashboard, User Management, Teacher Approvals, System Overview, My Profile
 */

import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  GraduationCap,
  Clock,
  ClipboardList,
  Users,
  ShieldCheck,
  SlidersHorizontal,
  User,
} from 'lucide-react';
import { ROUTES } from '../../routes/routes';
import { ROLES } from '../../routes/accessRules';

export const NAVIGATION_CONFIG = {
  [ROLES.STUDENT]: [
    {
      label: 'Dashboard',
      to: ROUTES.STUDENT_DASHBOARD,
      icon: <LayoutDashboard size={18} aria-hidden="true" />,
      end: true,
    },
    {
      label: 'My Attendance',
      to: ROUTES.STUDENT_ATTENDANCE,
      icon: <CalendarCheck size={18} aria-hidden="true" />,
    },
    {
      label: 'My Subjects',
      to: ROUTES.STUDENT_SUBJECTS,
      icon: <BookOpen size={18} aria-hidden="true" />,
    },
    {
      label: 'My Profile',
      to: ROUTES.STUDENT_PROFILE,
      icon: <User size={18} aria-hidden="true" />,
    },
  ],

  [ROLES.TEACHER]: [
    {
      label: 'Dashboard',
      to: ROUTES.TEACHER_DASHBOARD,
      icon: <LayoutDashboard size={18} aria-hidden="true" />,
      end: true,
    },
    {
      label: 'My Classes',
      to: ROUTES.TEACHER_CLASSES,
      icon: <GraduationCap size={18} aria-hidden="true" />,
    },
    {
      label: 'Attendance Sessions',
      to: ROUTES.TEACHER_SESSIONS,
      icon: <Clock size={18} aria-hidden="true" />,
    },
    {
      label: 'Attendance Records',
      to: ROUTES.TEACHER_RECORDS,
      icon: <ClipboardList size={18} aria-hidden="true" />,
    },
    {
      label: 'My Profile',
      to: ROUTES.TEACHER_PROFILE,
      icon: <User size={18} aria-hidden="true" />,
    },
  ],

  [ROLES.ADMIN]: [
    {
      label: 'Dashboard',
      to: ROUTES.ADMIN_DASHBOARD,
      icon: <LayoutDashboard size={18} aria-hidden="true" />,
      end: true,
    },
    {
      label: 'User Management',
      to: ROUTES.ADMIN_USERS,
      icon: <Users size={18} aria-hidden="true" />,
    },
    {
      label: 'Teacher Approvals',
      to: ROUTES.ADMIN_TEACHER_APPROVALS,
      icon: <ShieldCheck size={18} aria-hidden="true" />,
    },
    {
      label: 'System Overview',
      to: ROUTES.ADMIN_SYSTEM,
      icon: <SlidersHorizontal size={18} aria-hidden="true" />,
    },
    {
      label: 'My Profile',
      to: ROUTES.ADMIN_PROFILE,
      icon: <User size={18} aria-hidden="true" />,
    },
  ],
};

export default NAVIGATION_CONFIG;

