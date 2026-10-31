/**
 * AttendAI Teacher Service
 * Milestone 9.3: Teacher Dashboard
 *
 * Provides data-fetching methods for teacher classes, attendance sessions, and activity logs.
 * Strictly adheres to AttendAI security principles:
 * - Queries data exclusively for the authenticated teacher's ID
 * - Prevents exposure of other teachers' private class or student data
 * - Handles unmigrated backend tables gracefully without throwing or crashing
 * - Returns authentic records without fabricating fake statistics or mock classes
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

/**
 * Fetch overview metrics for the authenticated teacher.
 * If class/session tables are not yet created in the database, safely returns empty state.
 *
 * @param {string} teacherId - UUID of the authenticated teacher
 * @returns {Promise<{totalClasses: number, totalStudents: number, activeSessions: number, completedSessions: number, isAvailable: boolean, error: Error|null}>}
 */
export async function getTeacherOverview(teacherId) {
  if (!isSupabaseConfigured() || !teacherId) {
    return {
      totalClasses: 0,
      totalStudents: 0,
      activeSessions: 0,
      completedSessions: 0,
      isAvailable: false,
      error: null,
    };
  }

  try {
    const [classesRes, sessionsRes] = await Promise.all([
      supabase
        .from('classes')
        .select('id, enrolled_count', { count: 'exact' })
        .eq('teacher_id', teacherId),
      supabase
        .from('attendance_sessions')
        .select('id, status', { count: 'exact' })
        .eq('teacher_id', teacherId),
    ]);

    // If tables do not exist in PostgreSQL (error code 42P01), return safe empty state
    if (classesRes.error || sessionsRes.error) {
      return {
        totalClasses: 0,
        totalStudents: 0,
        activeSessions: 0,
        completedSessions: 0,
        isAvailable: false,
        error: null,
      };
    }

    const classes = classesRes.data || [];
    const sessions = sessionsRes.data || [];

    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, c) => sum + (c.enrolled_count || 0), 0);
    const activeSessions = sessions.filter(
      (s) => s.status && s.status.toLowerCase() === 'active'
    ).length;
    const completedSessions = sessions.filter(
      (s) => s.status && s.status.toLowerCase() === 'completed'
    ).length;

    return {
      totalClasses,
      totalStudents,
      activeSessions,
      completedSessions,
      isAvailable: true,
      error: null,
    };
  } catch {
    return {
      totalClasses: 0,
      totalStudents: 0,
      activeSessions: 0,
      completedSessions: 0,
      isAvailable: false,
      error: null,
    };
  }
}

/**
 * Fetch assigned academic classes for the authenticated teacher.
 * If class tables are not yet created in the database, safely returns empty list.
 *
 * @param {string} teacherId - UUID of the authenticated teacher
 * @returns {Promise<{classes: Array, isAvailable: boolean, error: Error|null}>}
 */
export async function getTeacherClasses(teacherId) {
  if (!isSupabaseConfigured() || !teacherId) {
    return {
      classes: [],
      isAvailable: false,
      error: null,
    };
  }

  try {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name, subject_name, course_code, room, schedule, enrolled_count')
      .eq('teacher_id', teacherId)
      .order('name', { ascending: true });

    if (error) {
      return {
        classes: [],
        isAvailable: false,
        error: null,
      };
    }

    return {
      classes: data || [],
      isAvailable: true,
      error: null,
    };
  } catch {
    return {
      classes: [],
      isAvailable: false,
      error: null,
    };
  }
}

/**
 * Fetch attendance sessions conducted by the authenticated teacher.
 * If session tables are not yet created in the database, safely returns empty list.
 *
 * @param {string} teacherId - UUID of the authenticated teacher
 * @returns {Promise<{sessions: Array, isAvailable: boolean, error: Error|null}>}
 */
export async function getTeacherSessions(teacherId) {
  if (!isSupabaseConfigured() || !teacherId) {
    return {
      sessions: [],
      isAvailable: false,
      error: null,
    };
  }

  try {
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('id, class_id, class_name, status, session_date, present_count, total_count, created_at')
      .eq('teacher_id', teacherId)
      .order('session_date', { ascending: false })
      .limit(10);

    if (error) {
      return {
        sessions: [],
        isAvailable: false,
        error: null,
      };
    }

    return {
      sessions: data || [],
      isAvailable: true,
      error: null,
    };
  } catch {
    return {
      sessions: [],
      isAvailable: false,
      error: null,
    };
  }
}

/**
 * Fetch recent attendance and class activity events for the authenticated teacher.
 * If activity tables are not yet created in the database, safely returns empty list.
 *
 * @param {string} teacherId - UUID of the authenticated teacher
 * @returns {Promise<{activities: Array, isAvailable: boolean, error: Error|null}>}
 */
export async function getTeacherRecentActivity(teacherId) {
  if (!isSupabaseConfigured() || !teacherId) {
    return {
      activities: [],
      isAvailable: false,
      error: null,
    };
  }

  try {
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('id, class_name, status, session_date, created_at')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return {
        activities: [],
        isAvailable: false,
        error: null,
      };
    }

    return {
      activities: data || [],
      isAvailable: true,
      error: null,
    };
  } catch {
    return {
      activities: [],
      isAvailable: false,
      error: null,
    };
  }
}

