/**
 * AttendAI Route Constants
 * Central registry of application path strings for routing and navigation.
 */

export const ROUTES = {
  ROOT: '/',
  // Milestone 8.3 & 8.4 (Auth):
  REGISTER: '/register',
  LOGIN: '/login',
  // Milestone 8.9 (Password Recovery):
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  // Milestone 8.7 (Teacher Registration & Request):
  TEACHER_REGISTER: '/register/teacher',
  TEACHER_LOGIN: '/login/teacher',
  TEACHER_STATUS: '/teacher/status',
  // Milestone 8.6 (Access Control & RBAC):
  UNAUTHORIZED: '/unauthorized',

  // Milestone 9.5 (Role Dashboard Resolution):
  DASHBOARD: '/dashboard',

  // Milestone 9.1 (Student Dashboard & Sections):
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_ATTENDANCE: '/student/attendance',
  STUDENT_SUBJECTS: '/student/subjects',
  STUDENT_PROFILE: '/student/profile',

  // Milestone 9.1 (Teacher Dashboard & Sections):
  TEACHER_DASHBOARD: '/teacher/dashboard',
  TEACHER_CLASSES: '/teacher/classes',
  TEACHER_SESSIONS: '/teacher/sessions',
  TEACHER_RECORDS: '/teacher/records',
  TEACHER_PROFILE: '/teacher/profile',

  // Milestone 9.1 (Admin Dashboard & Sections):
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_TEACHER_APPROVALS: '/admin/teacher-approvals',
  ADMIN_SYSTEM: '/admin/system',
  ADMIN_PROFILE: '/admin/profile',

  // Future Milestone 9 (AI Attendance Features):
  // FACE_ATTENDANCE: '/attendance/face',
  // VOICE_ATTENDANCE: '/attendance/voice',
  NOT_FOUND: '*',
};

export default ROUTES;
