/**
 * AttendAI Student Service
 * Milestone 9.2: Student Dashboard
 *
 * Provides data-fetching methods for student attendance records and enrolled subjects.
 * Strictly adheres to AttendAI security principles:
 * - Queries data exclusively for the authenticated user's ID
 * - Handles missing backend tables gracefully without throwing or crashing
 * - Returns zero/empty states without fabricating fake records or statistics
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

/**
 * Calculate attendance percentage safely without division by zero.
 * Attendance Percentage = (Classes Attended / Total Classes) * 100
 *
 * @param {number} attended - Number of attended classes
 * @param {number} total - Total number of scheduled classes
 * @returns {number} Integer percentage between 0 and 100
 */
export function calculateAttendancePercentage(attended, total) {
  if (!total || typeof total !== 'number' || total <= 0) {
    return 0;
  }
  if (!attended || typeof attended !== 'number' || attended < 0) {
    return 0;
  }
  const percentage = (attended / total) * 100;
  return Math.min(100, Math.max(0, Math.round(percentage)));
}

/**
 * Fetch attendance records for the authenticated student.
 * If attendance tables are not yet created in the database, safely returns empty state.
 *
 * @param {string} studentId - UUID of the authenticated student
 * @returns {Promise<{records: Array, total: number, attended: number, missed: number, rate: number, error: Error|null, isAvailable: boolean}>}
 */
export async function getStudentAttendance(studentId) {
  if (!isSupabaseConfigured() || !studentId) {
    return {
      records: [],
      total: 0,
      attended: 0,
      missed: 0,
      rate: 0,
      error: null,
      isAvailable: false,
    };
  }

  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('id, session_id, subject_name, status, verification_method, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // Handle missing database table (PostgreSQL 42P01) or other schema unavailability
    if (error) {
      return {
        records: [],
        total: 0,
        attended: 0,
        missed: 0,
        rate: 0,
        error: null,
        isAvailable: false,
      };
    }

    const records = data || [];
    const total = records.length;
    const attended = records.filter(
      (r) => r.status && r.status.toLowerCase() === 'present'
    ).length;
    const missed = records.filter(
      (r) => r.status && r.status.toLowerCase() === 'absent'
    ).length;
    const rate = calculateAttendancePercentage(attended, total);

    return {
      records,
      total,
      attended,
      missed,
      rate,
      error: null,
      isAvailable: true,
    };
  } catch {
    return {
      records: [],
      total: 0,
      attended: 0,
      missed: 0,
      rate: 0,
      error: null,
      isAvailable: false,
    };
  }
}

/**
 * Fetch enrolled academic subjects for the authenticated student.
 * If enrollment tables are not yet created in the database, safely returns empty state.
 *
 * @param {string} studentId - UUID of the authenticated student
 * @returns {Promise<{subjects: Array, error: Error|null, isAvailable: boolean}>}
 */
export async function getStudentSubjects(studentId) {
  if (!isSupabaseConfigured() || !studentId) {
    return {
      subjects: [],
      error: null,
      isAvailable: false,
    };
  }

  try {
    const { data, error } = await supabase
      .from('student_subjects')
      .select('id, subject_id, subject_name, subject_code, professor_name, schedule')
      .eq('student_id', studentId);

    if (error) {
      return {
        subjects: [],
        error: null,
        isAvailable: false,
      };
    }

    return {
      subjects: data || [],
      error: null,
      isAvailable: true,
    };
  } catch {
    return {
      subjects: [],
      error: null,
      isAvailable: false,
    };
  }
}
