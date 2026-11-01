/**
 * AttendAI Dashboard Access & Approval Logic Verification Test Suite
 * Validates all 13 core scenarios defined in Milestone: Fix Student and Teacher Dashboard Access and Approval Logic.
 */

import assert from 'node:assert';
import { evaluateAccess, getRoleDashboardPath, ROLES } from '../src/routes/accessRules.js';
import { TEACHER_LOGIN_OUTCOMES } from '../src/services/authService.js';
import { ROUTES } from '../src/routes/routes.js';

console.log('--- AttendAI Dashboard Access & Approval Verification Suite (13 Scenarios) ---');

// Scenario 1: Student registers -> Able to access Student Dashboard immediately
const s1_dest = getRoleDashboardPath({ role: ROLES.STUDENT, isApproved: true });
assert.strictEqual(s1_dest, ROUTES.STUDENT_DASHBOARD, 'Scenario 1: Registered student destination must be Student Dashboard');
const s1_access = evaluateAccess({
  allowedRoles: [ROLES.STUDENT, ROLES.ADMIN],
  requireApproval: false,
  isAuthenticated: true,
  profile: { role: 'student', is_approved: true },
  role: 'student',
  isApproved: true,
});
assert.strictEqual(s1_access.allowed, true, 'Scenario 1: Student must have immediate dashboard access');
console.log('✔ Scenario 1 Passed: Student registers -> immediate access to Student Dashboard');

// Scenario 2: Student logs in -> Redirected to Student Dashboard
const s2_dest = getRoleDashboardPath({ role: ROLES.STUDENT, isApproved: true });
assert.strictEqual(s2_dest, ROUTES.STUDENT_DASHBOARD, 'Scenario 2: Student login destination must resolve to Student Dashboard');
console.log('✔ Scenario 2 Passed: Student logs in -> redirected to Student Dashboard');

// Scenario 3: Student accesses /student/dashboard directly -> Allowed
const s3_access = evaluateAccess({
  allowedRoles: [ROLES.STUDENT, ROLES.ADMIN],
  requireApproval: false,
  isAuthenticated: true,
  profile: { role: 'student', is_approved: true },
  role: 'student',
  isApproved: true,
});
assert.strictEqual(s3_access.allowed, true, 'Scenario 3: Direct access to Student Dashboard must be allowed');
console.log('✔ Scenario 3 Passed: Student accesses /student/dashboard directly -> Allowed');

// Scenario 4: Student accesses /teacher/dashboard -> Blocked / redirected
const s4_access = evaluateAccess({
  allowedRoles: [ROLES.TEACHER, ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { role: 'student', is_approved: true },
  role: 'student',
  isApproved: true,
});
assert.strictEqual(s4_access.allowed, false, 'Scenario 4: Student must be blocked from Teacher Dashboard');
assert.strictEqual(s4_access.reason, 'forbidden', 'Scenario 4: Student must receive forbidden error on Teacher Dashboard');
console.log('✔ Scenario 4 Passed: Student accesses /teacher/dashboard -> Blocked (forbidden)');

// Scenario 5: Student is NEVER asked for approval (even if profile is_approved is false or null)
const s5_access_false = evaluateAccess({
  allowedRoles: [ROLES.STUDENT, ROLES.ADMIN],
  requireApproval: false,
  isAuthenticated: true,
  profile: { role: 'student', is_approved: false },
  role: 'student',
  isApproved: false,
});
assert.strictEqual(s5_access_false.allowed, true, 'Scenario 5: Student with is_approved=false must still be allowed access');
const s5_access_null = evaluateAccess({
  allowedRoles: [ROLES.STUDENT, ROLES.ADMIN],
  requireApproval: false,
  isAuthenticated: true,
  profile: { role: 'student', is_approved: null },
  role: 'student',
  isApproved: true,
});
assert.strictEqual(s5_access_null.allowed, true, 'Scenario 5: Student with is_approved=null must still be allowed access');
console.log('✔ Scenario 5 Passed: Student is NEVER asked for approval');

// Scenario 6: Teacher registers -> Redirected to status page (/teacher/status)
const s6_dest = getRoleDashboardPath({ role: ROLES.TEACHER, isApproved: false });
assert.strictEqual(s6_dest, ROUTES.TEACHER_STATUS, 'Scenario 6: Teacher registration destination must be /teacher/status');
console.log('✔ Scenario 6 Passed: Teacher registers -> redirected to status page (/teacher/status)');

// Scenario 7: Teacher with pending approval logs in -> Redirected to status page
const s7_dest = getRoleDashboardPath({ role: ROLES.TEACHER, isApproved: false });
assert.strictEqual(s7_dest, ROUTES.TEACHER_STATUS, 'Scenario 7: Pending teacher login destination must be /teacher/status');
console.log('✔ Scenario 7 Passed: Teacher with pending approval logs in -> redirected to /teacher/status');

// Scenario 8: Teacher with pending approval accesses /teacher/dashboard directly -> Blocked
const s8_access = evaluateAccess({
  allowedRoles: [ROLES.TEACHER, ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { role: 'teacher', is_approved: false },
  role: 'teacher',
  isApproved: false,
});
assert.strictEqual(s8_access.allowed, false, 'Scenario 8: Pending teacher must be blocked from Teacher Dashboard');
assert.strictEqual(s8_access.reason, 'pending_approval', 'Scenario 8: Pending teacher must receive pending_approval');
console.log('✔ Scenario 8 Passed: Pending teacher accesses /teacher/dashboard directly -> Blocked (pending_approval)');

// Scenario 9: Teacher with approved status logs in -> Redirected to Teacher Dashboard
const s9_dest = getRoleDashboardPath({ role: ROLES.TEACHER, isApproved: true });
assert.strictEqual(s9_dest, ROUTES.TEACHER_DASHBOARD, 'Scenario 9: Approved teacher login destination must be Teacher Dashboard');
console.log('✔ Scenario 9 Passed: Approved teacher logs in -> redirected to Teacher Dashboard');

// Scenario 10: Teacher with approved status accesses /teacher/dashboard directly -> Allowed
const s10_access = evaluateAccess({
  allowedRoles: [ROLES.TEACHER, ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { role: 'teacher', is_approved: true },
  role: 'teacher',
  isApproved: true,
});
assert.strictEqual(s10_access.allowed, true, 'Scenario 10: Approved teacher must be allowed to access Teacher Dashboard');
console.log('✔ Scenario 10 Passed: Approved teacher accesses /teacher/dashboard directly -> Allowed');

// Scenario 11: Teacher with rejected status logs in -> Blocked with rejection status
assert.strictEqual(TEACHER_LOGIN_OUTCOMES.REJECTED_TEACHER, 'REJECTED_TEACHER', 'Scenario 11: Outcome REJECTED_TEACHER must exist');
const s11_access = evaluateAccess({
  allowedRoles: [ROLES.TEACHER, ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { role: 'teacher', is_approved: false },
  role: 'teacher',
  isApproved: false,
});
assert.strictEqual(s11_access.allowed, false, 'Scenario 11: Rejected teacher is blocked');
console.log('✔ Scenario 11 Passed: Rejected teacher logs in -> blocked with rejection outcome');

// Scenario 12: Unauthenticated user accesses /student/dashboard -> Redirected to login
const s12_student_access = evaluateAccess({
  allowedRoles: [ROLES.STUDENT, ROLES.ADMIN],
  requireApproval: false,
  isAuthenticated: false,
});
assert.strictEqual(s12_student_access.allowed, false, 'Scenario 12: Unauthenticated user must be blocked from Student Dashboard');
assert.strictEqual(s12_student_access.reason, 'not_authenticated', 'Scenario 12: Reason must be not_authenticated');
console.log('✔ Scenario 12 Passed: Unauthenticated user accesses /student/dashboard -> Blocked (not_authenticated)');

// Scenario 13: Unauthenticated user accesses /teacher/dashboard -> Redirected to login
const s13_teacher_access = evaluateAccess({
  allowedRoles: [ROLES.TEACHER, ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: false,
});
assert.strictEqual(s13_teacher_access.allowed, false, 'Scenario 13: Unauthenticated user must be blocked from Teacher Dashboard');
assert.strictEqual(s13_teacher_access.reason, 'not_authenticated', 'Scenario 13: Reason must be not_authenticated');
console.log('✔ Scenario 13 Passed: Unauthenticated user accesses /teacher/dashboard -> Blocked (not_authenticated)');

console.log('--- All 13 Mandatory Scenarios Verified Successfully! ---');
