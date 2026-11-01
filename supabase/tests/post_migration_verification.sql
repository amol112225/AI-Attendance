-- ==============================================================================
-- AttendAI — Post-Migration Database Verification Script (READ-ONLY)
--
-- Instructions:
-- Run this script in the Supabase SQL Editor AFTER applying all migrations.
-- Verifies that tables, columns, indexes, RLS, triggers, roles, and approval
-- statuses conform strictly to AttendAI security and architectural requirements.
-- ==============================================================================

-- 1. Table and Column Existence Verification
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'teacher_registration_requests')
ORDER BY table_name, ordinal_position;

-- 2. Verify rejection_reason column exists on teacher_registration_requests
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'teacher_registration_requests' 
  AND column_name = 'rejection_reason';

-- 3. Row Level Security Activation Check (Must both be true)
SELECT 
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname IN ('profiles', 'teacher_registration_requests');

-- 4. RLS Policies Inspection
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'teacher_registration_requests');

-- 5. Trigger Attachments Verification
SELECT 
    event_object_table AS target_table,
    trigger_name,
    action_timing,
    event_manipulation AS event,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
   OR (trigger_schema = 'auth' AND event_object_table = 'users')
ORDER BY event_object_table, trigger_name;

-- 6. Profile Breakdown by Role and Approval Status
SELECT 
    role, 
    is_approved, 
    COUNT(*) AS total_accounts
FROM public.profiles
GROUP BY role, is_approved
ORDER BY role, is_approved;

-- 7. Teacher Registration Requests Breakdown by Status
SELECT 
    status, 
    COUNT(*) AS total_requests
FROM public.teacher_registration_requests
GROUP BY status;

-- 8. Quarantined / Ambiguous Accounts Verification
-- (Accounts with is_approved = FALSE and role = 'student' that require admin review)
SELECT 
    p.id, 
    p.full_name, 
    p.role, 
    p.is_approved, 
    u.email,
    p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'student' AND p.is_approved = FALSE;

-- 9. Verify No Multiple Pending Requests per User
SELECT 
    user_id, 
    COUNT(*) AS pending_requests
FROM public.teacher_registration_requests
WHERE status = 'pending'
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 10. Verify Functions and Privileges
SELECT 
    p.proname AS function_name,
    pg_get_userbyid(p.proowner) AS function_owner,
    p.prosecdef AS is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
      'handle_new_user', 
      'admin_approve_teacher', 
      'admin_reject_teacher', 
      'prevent_profile_privilege_escalation', 
      'prevent_teacher_request_tampering'
  );
