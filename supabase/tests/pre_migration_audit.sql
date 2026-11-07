-- ==============================================================================
-- AttendAI — Pre-Migration Database Audit Script (READ-ONLY)
--
-- Instructions:
-- Run this script in the Supabase SQL Editor BEFORE applying migrations.
-- Safe to execute on:
-- 1. A completely fresh database (where application tables do not exist yet).
-- 2. An existing database (where migrations 1-4 may already be applied).
--
-- Performs read-only inspections without modifying any data.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Schema Catalog Status Check (Safe on Fresh and Existing Databases)
-- ------------------------------------------------------------------------------
SELECT 
    'public.profiles' AS object_name,
    'table' AS object_type,
    CASE WHEN to_regclass('public.profiles') IS NOT NULL THEN 'EXISTS' ELSE 'NOT FOUND (Fresh Database)' END AS status
UNION ALL
SELECT 
    'public.teacher_registration_requests' AS object_name,
    'table' AS object_type,
    CASE WHEN to_regclass('public.teacher_registration_requests') IS NOT NULL THEN 'EXISTS' ELSE 'NOT FOUND (Fresh Database)' END AS status
UNION ALL
SELECT 
    'public.user_role' AS object_name,
    'enum_type' AS object_type,
    CASE WHEN to_regtype('public.user_role') IS NOT NULL THEN 'EXISTS' ELSE 'NOT FOUND (Fresh Database)' END AS status;

-- ------------------------------------------------------------------------------
-- 2. Auth Users Registration Metadata Classification & Audit
-- Checks for valid student/teacher metadata, ambiguous entries, and privilege claims.
-- ------------------------------------------------------------------------------
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' AS meta_full_name,
    u.raw_user_meta_data->>'role' AS meta_role,
    u.raw_user_meta_data->>'requested_role' AS meta_requested_role,
    u.created_at,
    CASE 
        -- Suspicious / Escalation attempts: Public admin registration claim
        WHEN LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'role', ''))) = 'admin' 
             OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'requested_role', ''))) = 'admin'
            THEN 'SECURITY ALERT: Public Admin Claim (Must Quarantine)'
        
        -- Conflicting metadata: client sent teacher directly in 'role'
        WHEN LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'role', ''))) = 'teacher'
            THEN 'CONFLICTING: Direct teacher role metadata (Requires requested_role)'
        
        -- Unrecognized / Invalid role values
        WHEN LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'role', ''))) NOT IN ('student', '')
             AND u.raw_user_meta_data->>'role' IS NOT NULL
            THEN 'INVALID: Unrecognized role metadata'
        WHEN LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'requested_role', ''))) NOT IN ('teacher', '')
             AND u.raw_user_meta_data->>'requested_role' IS NOT NULL
            THEN 'INVALID: Unrecognized requested_role metadata'

        -- Valid registration intents
        WHEN LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'requested_role', ''))) = 'teacher'
             AND (LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'role', ''))) IN ('student', ''))
            THEN 'Clear Teacher Applicant'
        
        WHEN LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'role', ''))) = 'student' 
             AND (u.raw_user_meta_data->>'requested_role' IS NULL OR LOWER(TRIM(u.raw_user_meta_data->>'requested_role')) = '')
            THEN 'Clear Student'

        -- Missing / Incomplete metadata
        WHEN u.raw_user_meta_data IS NULL OR u.raw_user_meta_data = '{}'::jsonb 
            THEN 'Ambiguous: Missing Metadata (Must Quarantine)'
        WHEN u.raw_user_meta_data->>'full_name' IS NULL OR LENGTH(TRIM(u.raw_user_meta_data->>'full_name')) = 0
            THEN 'Ambiguous: Missing Full Name (Must Quarantine)'
        
        ELSE 'Ambiguous / Unclassified'
    END AS user_audit_classification
FROM auth.users u
ORDER BY u.created_at ASC;

-- ------------------------------------------------------------------------------
-- 3. Specific Detection of Invalid, Suspicious, or Escalation Metadata
-- ------------------------------------------------------------------------------
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' AS full_name,
    u.raw_user_meta_data->>'role' AS meta_role,
    u.raw_user_meta_data->>'requested_role' AS meta_requested_role,
    u.created_at,
    'Action: Quarantined as unapproved student (is_approved = FALSE)' AS planned_treatment
FROM auth.users u
WHERE LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'role', ''))) NOT IN ('student', '')
   OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'requested_role', ''))) NOT IN ('teacher', '')
   OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'role', ''))) = 'admin'
   OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'requested_role', ''))) = 'admin';

-- ------------------------------------------------------------------------------
-- 4. Effective Table Privileges on Schema Tables
-- Safely queries permissions for PUBLIC, anon, and authenticated.
-- (Returns empty if tables do not exist yet; never errors on fresh database).
-- ------------------------------------------------------------------------------
SELECT 
    r.rolname AS database_role,
    t.tbl AS table_name,
    has_table_privilege(r.rolname, t.tbl, 'SELECT') AS can_select,
    has_table_privilege(r.rolname, t.tbl, 'INSERT') AS can_insert,
    has_table_privilege(r.rolname, t.tbl, 'UPDATE') AS can_update,
    has_table_privilege(r.rolname, t.tbl, 'DELETE') AS can_delete
FROM (VALUES ('public.profiles'), ('public.teacher_registration_requests')) AS t(tbl)
CROSS JOIN (VALUES ('public'), ('anon'), ('authenticated')) AS r(rolname)
WHERE to_regclass(t.tbl) IS NOT NULL
ORDER BY t.tbl, r.rolname;

-- ------------------------------------------------------------------------------
-- 5. Effective Function Privileges on Administrative and Security Functions
-- ------------------------------------------------------------------------------
SELECT 
    p.proname AS function_name,
    r.rolname AS database_role,
    has_function_privilege(r.rolname, p.oid, 'EXECUTE') AS can_execute,
    p.prosecdef AS is_security_definer,
    pg_get_userbyid(p.proowner) AS function_owner
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN (VALUES ('public'), ('anon'), ('authenticated')) AS r(rolname)
WHERE n.nspname = 'public' 
  AND p.proname IN (
      'admin_approve_teacher', 
      'admin_reject_teacher', 
      'handle_new_user', 
      'prevent_profile_privilege_escalation', 
      'prevent_teacher_request_tampering'
  )
ORDER BY p.proname, r.rolname;

-- ------------------------------------------------------------------------------
-- 6. Active Row Level Security Policies (if tables exist)
-- ------------------------------------------------------------------------------
SELECT 
    schemaname, 
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

-- ------------------------------------------------------------------------------
-- 7. Deep Dynamic Consistency Audit (PL/pgSQL Block)
-- Safely inspects relational consistency between auth.users, profiles, and requests.
-- If running on a fresh database, cleanly reports that tables do not exist yet.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_profiles_exists BOOLEAN;
    v_requests_exists BOOLEAN;
    v_missing_profiles INT := 0;
    v_unapproved_teachers_no_req INT := 0;
    v_approved_teachers_pending_req INT := 0;
    v_rejected_teachers_pending_req INT := 0;
    v_dup_pending_req INT := 0;
BEGIN
    v_profiles_exists := to_regclass('public.profiles') IS NOT NULL;
    v_requests_exists := to_regclass('public.teacher_registration_requests') IS NOT NULL;

    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'ATTENDAI PRE-MIGRATION CONSISTENCY AUDIT';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Table status: profiles = %, teacher_registration_requests = %', 
        CASE WHEN v_profiles_exists THEN 'FOUND' ELSE 'NOT FOUND (Fresh Database)' END,
        CASE WHEN v_requests_exists THEN 'FOUND' ELSE 'NOT FOUND (Fresh Database)' END;

    IF NOT v_profiles_exists AND NOT v_requests_exists THEN
        RAISE NOTICE 'INFO: Application schema tables do not exist yet.';
        RAISE NOTICE 'Fresh database detected: No pre-existing relational anomalies exist.';
        RAISE NOTICE '====================================================================';
        RETURN;
    END IF;

    -- If profiles exists, check unprofiled users
    IF v_profiles_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE p.id IS NULL'
        INTO v_missing_profiles;
        RAISE NOTICE 'Users in auth.users missing public.profiles record: %', v_missing_profiles;
    END IF;

    -- If both tables exist, check relational anomalies
    IF v_profiles_exists AND v_requests_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM public.profiles p WHERE p.role = ''teacher'' AND p.is_approved = FALSE AND NOT EXISTS (SELECT 1 FROM public.teacher_registration_requests trr WHERE trr.user_id = p.id)'
        INTO v_unapproved_teachers_no_req;
        RAISE NOTICE 'Unapproved teacher profiles lacking request records: %', v_unapproved_teachers_no_req;

        EXECUTE 'SELECT COUNT(*) FROM public.profiles p JOIN public.teacher_registration_requests trr ON trr.user_id = p.id WHERE p.role = ''teacher'' AND p.is_approved = TRUE AND trr.status = ''pending'''
        INTO v_approved_teachers_pending_req;
        RAISE NOTICE 'Approved teacher profiles with pending requests (inconsistent): %', v_approved_teachers_pending_req;

        EXECUTE 'SELECT COUNT(*) FROM public.profiles p JOIN public.teacher_registration_requests trr ON trr.user_id = p.id WHERE trr.status = ''rejected'' AND p.role = ''teacher'''
        INTO v_rejected_teachers_pending_req;
        RAISE NOTICE 'Rejected teacher requests where profile is still teacher (inconsistent): %', v_rejected_teachers_pending_req;

        EXECUTE 'SELECT COUNT(*) FROM (SELECT user_id FROM public.teacher_registration_requests WHERE status = ''pending'' GROUP BY user_id HAVING COUNT(*) > 1) s'
        INTO v_dup_pending_req;
        RAISE NOTICE 'Users with duplicate pending requests: %', v_dup_pending_req;
    END IF;

    RAISE NOTICE '====================================================================';
END $$;
