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
  // Future Dashboards:
  // STUDENT_DASHBOARD: '/student',
  // TEACHER_DASHBOARD: '/teacher',
  // Future Milestone 9 (AI Attendance Features):
  // FACE_ATTENDANCE: '/attendance/face',
  // VOICE_ATTENDANCE: '/attendance/voice',
  NOT_FOUND: '*',
};

export default ROUTES;

