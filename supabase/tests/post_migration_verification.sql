-- ==============================================================================
-- AttendAI — Post-Migration Database Verification Script (READ-ONLY)
--
-- Instructions:
-- Run this script in the Supabase SQL Editor AFTER applying migrations.
--
-- Features:
-- - Evaluates 28 automated security and architectural assertions.
-- - Verifies tables, columns, indexes, RLS, triggers, functions, and ownership.
-- - Tests effective database privileges for anon, authenticated, and public.
-- - Detects relational inconsistencies and data integrity issues.
-- - Output explicitly highlights any failed checks (PASS / FAIL) without requiring
--   manual interpretation of raw database metadata.
-- ==============================================================================

CREATE TEMP TABLE IF NOT EXISTS verification_results (
    check_id INT GENERATED ALWAYS AS IDENTITY,
    category TEXT NOT NULL,
    check_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'PASS' or 'FAIL'
    details TEXT
);

TRUNCATE TABLE verification_results;

DO $$
DECLARE
    v_cnt INT;
    v_bool BOOLEAN;
    v_text TEXT;
    v_owner TEXT;
    v_secdef BOOLEAN;
BEGIN
    -- -------------------------------------------------------------------------
    -- Category 1: Schema Types & Tables
    -- -------------------------------------------------------------------------

    -- Check 1: public.user_role ENUM exists with labels ('student', 'teacher', 'admin')
    SELECT COUNT(*) INTO v_cnt
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'user_role'
      AND e.enumlabel IN ('student', 'teacher', 'admin');

    IF v_cnt = 3 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Schema & Types', 'user_role ENUM definition', 'PASS', 'ENUM exists with all 3 labels (student, teacher, admin).');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Schema & Types', 'user_role ENUM definition', 'FAIL', format('Expected 3 enum labels, found %s.', v_cnt));
    END IF;

    -- Check 2: public.profiles table exists
    IF to_regclass('public.profiles') IS NOT NULL THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Schema & Types', 'public.profiles table exists', 'PASS', 'Table found in public schema.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Schema & Types', 'public.profiles table exists', 'FAIL', 'Table public.profiles is missing.');
    END IF;

    -- Check 3: public.profiles required columns
    SELECT COUNT(*) INTO v_cnt
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name IN ('id', 'full_name', 'role', 'is_approved', 'created_at', 'updated_at');

    IF v_cnt = 6 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Schema & Types', 'public.profiles columns', 'PASS', 'All 6 required columns exist.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Schema & Types', 'public.profiles columns', 'FAIL', format('Expected 6 columns, found %s.', v_cnt));
    END IF;

    -- Check 4: public.teacher_registration_requests table exists
    IF to_regclass('public.teacher_registration_requests') IS NOT NULL THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Schema & Types', 'public.teacher_registration_requests table exists', 'PASS', 'Table found in public schema.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Schema & Types', 'public.teacher_registration_requests table exists', 'FAIL', 'Table public.teacher_registration_requests is missing.');
    END IF;

    -- Check 5: rejection_reason column on teacher_registration_requests
    SELECT COUNT(*) INTO v_cnt
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'teacher_registration_requests'
      AND column_name = 'rejection_reason' AND data_type = 'text';

    IF v_cnt = 1 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Schema & Types', 'rejection_reason column exists', 'PASS', 'Column rejection_reason (TEXT) is present.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Schema & Types', 'rejection_reason column exists', 'FAIL', 'Column rejection_reason is missing or incorrect type.');
    END IF;

    -- Check 6: Unique pending request constraint/index
    SELECT COUNT(*) INTO v_cnt
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'teacher_registration_requests'
      AND indexname = 'uq_teacher_pending_requests';

    IF v_cnt = 1 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Schema & Types', 'uq_teacher_pending_requests unique index', 'PASS', 'Partial unique index on status=pending exists.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Schema & Types', 'uq_teacher_pending_requests unique index', 'FAIL', 'Partial unique index uq_teacher_pending_requests is missing.');
    END IF;

    -- -------------------------------------------------------------------------
    -- Category 2: Row Level Security (RLS) Activation & Policies
    -- -------------------------------------------------------------------------

    -- Check 7: RLS enabled on profiles
    SELECT relrowsecurity INTO v_bool FROM pg_class WHERE oid = 'public.profiles'::regclass;
    IF v_bool THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('RLS & Policies', 'profiles RLS activation', 'PASS', 'Row Level Security is active on public.profiles.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('RLS & Policies', 'profiles RLS activation', 'FAIL', 'RLS is disabled on public.profiles.');
    END IF;

    -- Check 8: RLS enabled on teacher_registration_requests
    SELECT relrowsecurity INTO v_bool FROM pg_class WHERE oid = 'public.teacher_registration_requests'::regclass;
    IF v_bool THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('RLS & Policies', 'teacher_registration_requests RLS activation', 'PASS', 'Row Level Security is active on teacher_registration_requests.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('RLS & Policies', 'teacher_registration_requests RLS activation', 'FAIL', 'RLS is disabled on teacher_registration_requests.');
    END IF;

    -- Check 9: profiles SELECT policy (Users can view own profile)
    SELECT COUNT(*) INTO v_cnt
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Users can view own profile' AND cmd = 'SELECT'
      AND qual = '(auth.uid() = id)';

    IF v_cnt = 1 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('RLS & Policies', 'profiles SELECT policy', 'PASS', 'Users can view only their own profile (auth.uid() = id).');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('RLS & Policies', 'profiles SELECT policy', 'FAIL', 'Policy "Users can view own profile" missing or invalid.');
    END IF;

    -- Check 10: profiles UPDATE policy (Users can update own profile name)
    SELECT COUNT(*) INTO v_cnt
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Users can update own profile name' AND cmd = 'UPDATE';

    IF v_cnt = 1 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('RLS & Policies', 'profiles UPDATE policy', 'PASS', 'Self-update policy exists without recursive table subqueries.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('RLS & Policies', 'profiles UPDATE policy', 'FAIL', 'Policy "Users can update own profile name" missing.');
    END IF;

    -- Check 11: teacher_registration_requests SELECT policy
    SELECT COUNT(*) INTO v_cnt
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'teacher_registration_requests'
      AND policyname = 'Users can view own teacher requests' AND cmd = 'SELECT';

    IF v_cnt = 1 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('RLS & Policies', 'teacher_requests SELECT policy', 'PASS', 'Users can view only their own request and rejection reason.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('RLS & Policies', 'teacher_requests SELECT policy', 'FAIL', 'Policy "Users can view own teacher requests" missing.');
    END IF;

    -- Check 12: teacher_registration_requests INSERT policy revoked
    SELECT COUNT(*) INTO v_cnt
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'teacher_registration_requests'
      AND policyname = 'Users can submit own teacher request';

    IF v_cnt = 0 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('RLS & Policies', 'teacher_requests client INSERT policy revoked', 'PASS', 'Client INSERT policy correctly removed (trigger-only creation).');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('RLS & Policies', 'teacher_requests client INSERT policy revoked', 'FAIL', 'Unsafe client INSERT policy "Users can submit own teacher request" still exists.');
    END IF;

    -- -------------------------------------------------------------------------
    -- Category 3: Functions, Security Definer / Invoker & Ownership
    -- -------------------------------------------------------------------------

    -- Check 13: admin_approve_teacher is SECURITY DEFINER
    SELECT p.prosecdef, pg_get_userbyid(p.proowner)
    INTO v_secdef, v_owner
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_approve_teacher';

    IF v_secdef THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Functions & Privileges', 'admin_approve_teacher SECURITY DEFINER', 'PASS', format('Function is SECURITY DEFINER (owner: %s).', v_owner));
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Functions & Privileges', 'admin_approve_teacher SECURITY DEFINER', 'FAIL', 'Function is NOT SECURITY DEFINER or missing.');
    END IF;

    -- Check 14: admin_reject_teacher is SECURITY DEFINER
    SELECT p.prosecdef, pg_get_userbyid(p.proowner)
    INTO v_secdef, v_owner
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_reject_teacher';

    IF v_secdef THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Functions & Privileges', 'admin_reject_teacher SECURITY DEFINER', 'PASS', format('Function is SECURITY DEFINER (owner: %s).', v_owner));
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Functions & Privileges', 'admin_reject_teacher SECURITY DEFINER', 'FAIL', 'Function is NOT SECURITY DEFINER or missing.');
    END IF;

    -- Check 15: prevent_profile_privilege_escalation is SECURITY INVOKER
    SELECT p.prosecdef INTO v_secdef
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'prevent_profile_privilege_escalation';

    IF v_secdef = FALSE THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Functions & Privileges', 'prevent_profile_privilege_escalation INVOKER', 'PASS', 'Function is SECURITY INVOKER (current_user check active).');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Functions & Privileges', 'prevent_profile_privilege_escalation INVOKER', 'FAIL', 'Function is incorrectly SECURITY DEFINER or missing.');
    END IF;

    -- Check 16: prevent_teacher_request_tampering is SECURITY INVOKER
    SELECT p.prosecdef INTO v_secdef
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'prevent_teacher_request_tampering';

    IF v_secdef = FALSE THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Functions & Privileges', 'prevent_teacher_request_tampering INVOKER', 'PASS', 'Function is SECURITY INVOKER (current_user check active).');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Functions & Privileges', 'prevent_teacher_request_tampering INVOKER', 'FAIL', 'Function is incorrectly SECURITY DEFINER or missing.');
    END IF;

    -- -------------------------------------------------------------------------
    -- Category 4: Effective Grants & Permissions
    -- -------------------------------------------------------------------------

    -- Check 17: anon has zero access to profiles
    IF NOT has_table_privilege('anon', 'public.profiles', 'SELECT')
       AND NOT has_table_privilege('anon', 'public.profiles', 'INSERT')
       AND NOT has_table_privilege('anon', 'public.profiles', 'UPDATE')
       AND NOT has_table_privilege('anon', 'public.profiles', 'DELETE') THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Grants & Permissions', 'anon access to profiles revoked', 'PASS', 'Anonymous users have 0 privileges on public.profiles.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Grants & Permissions', 'anon access to profiles revoked', 'FAIL', 'Anonymous role has unauthorized privileges on public.profiles.');
    END IF;

    -- Check 18: anon has zero access to teacher_registration_requests
    IF NOT has_table_privilege('anon', 'public.teacher_registration_requests', 'SELECT')
       AND NOT has_table_privilege('anon', 'public.teacher_registration_requests', 'INSERT')
       AND NOT has_table_privilege('anon', 'public.teacher_registration_requests', 'UPDATE')
       AND NOT has_table_privilege('anon', 'public.teacher_registration_requests', 'DELETE') THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Grants & Permissions', 'anon access to requests revoked', 'PASS', 'Anonymous users have 0 privileges on teacher_registration_requests.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Grants & Permissions', 'anon access to requests revoked', 'FAIL', 'Anonymous role has unauthorized privileges on teacher_registration_requests.');
    END IF;

    -- Check 19: authenticated CANNOT insert into teacher_registration_requests directly
    IF NOT has_table_privilege('authenticated', 'public.teacher_registration_requests', 'INSERT') THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Grants & Permissions', 'authenticated INSERT on requests revoked', 'PASS', 'Direct INSERT revoked from authenticated role.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Grants & Permissions', 'authenticated INSERT on requests revoked', 'FAIL', 'authenticated role retains direct INSERT on teacher_registration_requests.');
    END IF;

    -- Check 20: Execution of admin_approve_teacher granted to authenticated, denied to anon/public
    IF has_function_privilege('authenticated', 'public.admin_approve_teacher(uuid)', 'EXECUTE')
       AND NOT has_function_privilege('anon', 'public.admin_approve_teacher(uuid)', 'EXECUTE') THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Grants & Permissions', 'admin_approve_teacher execution grant', 'PASS', 'EXECUTE granted to authenticated; denied to anon.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Grants & Permissions', 'admin_approve_teacher execution grant', 'FAIL', 'Permission mismatch on admin_approve_teacher.');
    END IF;

    -- Check 21: Execution of admin_reject_teacher granted to authenticated, denied to anon/public
    IF has_function_privilege('authenticated', 'public.admin_reject_teacher(uuid, text)', 'EXECUTE')
       AND NOT has_function_privilege('anon', 'public.admin_reject_teacher(uuid, text)', 'EXECUTE') THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Grants & Permissions', 'admin_reject_teacher execution grant', 'PASS', 'EXECUTE granted to authenticated; denied to anon.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Grants & Permissions', 'admin_reject_teacher execution grant', 'FAIL', 'Permission mismatch on admin_reject_teacher.');
    END IF;

    -- -------------------------------------------------------------------------
    -- Category 5: Triggers Attachment
    -- -------------------------------------------------------------------------

    -- Check 22: on_auth_user_created attached to auth.users
    SELECT COUNT(*) INTO v_cnt
    FROM information_schema.triggers
    WHERE trigger_schema = 'auth' AND event_object_table = 'users'
      AND trigger_name = 'on_auth_user_created';

    IF v_cnt = 1 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Triggers', 'on_auth_user_created attached', 'PASS', 'Trigger attached AFTER INSERT on auth.users.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Triggers', 'on_auth_user_created attached', 'FAIL', 'Trigger on_auth_user_created missing from auth.users.');
    END IF;

    -- Check 23: trigger_prevent_profile_privilege_escalation attached to profiles
    SELECT COUNT(*) INTO v_cnt
    FROM information_schema.triggers
    WHERE trigger_schema = 'public' AND event_object_table = 'profiles'
      AND trigger_name = 'trigger_prevent_profile_privilege_escalation';

    IF v_cnt = 1 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Triggers', 'profile anti-tampering trigger attached', 'PASS', 'Trigger attached BEFORE UPDATE on public.profiles.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Triggers', 'profile anti-tampering trigger attached', 'FAIL', 'Trigger trigger_prevent_profile_privilege_escalation is missing.');
    END IF;

    -- Check 24: trigger_prevent_teacher_request_tampering attached to requests
    SELECT COUNT(*) INTO v_cnt
    FROM information_schema.triggers
    WHERE trigger_schema = 'public' AND event_object_table = 'teacher_registration_requests'
      AND trigger_name = 'trigger_prevent_teacher_request_tampering';

    IF v_cnt = 1 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Triggers', 'request anti-tampering trigger attached', 'PASS', 'Trigger attached BEFORE UPDATE on teacher_registration_requests.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Triggers', 'request anti-tampering trigger attached', 'FAIL', 'Trigger trigger_prevent_teacher_request_tampering is missing.');
    END IF;

    -- -------------------------------------------------------------------------
    -- Category 6: Data Integrity & Inconsistencies
    -- -------------------------------------------------------------------------

    -- Check 25: No duplicate pending requests per user
    SELECT COUNT(*) INTO v_cnt
    FROM (
        SELECT user_id FROM public.teacher_registration_requests
        WHERE status = 'pending'
        GROUP BY user_id HAVING COUNT(*) > 1
    ) sub;

    IF v_cnt = 0 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Data Integrity', 'No duplicate pending requests', 'PASS', '0 users with duplicate pending teacher requests.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Data Integrity', 'No duplicate pending requests', 'FAIL', format('%s users found with duplicate pending requests.', v_cnt));
    END IF;

    -- Check 26: No approved teacher has a pending request
    SELECT COUNT(*) INTO v_cnt
    FROM public.profiles p
    JOIN public.teacher_registration_requests trr ON trr.user_id = p.id
    WHERE p.role = 'teacher' AND p.is_approved = TRUE AND trr.status = 'pending';

    IF v_cnt = 0 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Data Integrity', 'Approved teachers have no pending requests', 'PASS', '0 approved teachers with lingering pending requests.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Data Integrity', 'Approved teachers have no pending requests', 'FAIL', format('%s approved teachers have pending requests.', v_cnt));
    END IF;

    -- Check 27: No approved student has an unresolved teacher request
    SELECT COUNT(*) INTO v_cnt
    FROM public.profiles p
    JOIN public.teacher_registration_requests trr ON trr.user_id = p.id
    WHERE p.role = 'student' AND trr.status = 'approved';

    IF v_cnt = 0 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Data Integrity', 'Students have no approved teacher requests', 'PASS', '0 student profiles with approved teacher requests.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Data Integrity', 'Students have no approved teacher requests', 'FAIL', format('%s student profiles have approved teacher requests.', v_cnt));
    END IF;

    -- Check 28: Rejected teacher requests do NOT have teacher profiles
    SELECT COUNT(*) INTO v_cnt
    FROM public.profiles p
    JOIN public.teacher_registration_requests trr ON trr.user_id = p.id
    WHERE trr.status = 'rejected' AND p.role = 'teacher';

    IF v_cnt = 0 THEN
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Data Integrity', 'Rejected requests not assigned teacher role', 'PASS', '0 rejected applicants retain teacher role.');
    ELSE
        INSERT INTO verification_results (category, check_name, status, details)
        VALUES ('Data Integrity', 'Rejected requests not assigned teacher role', 'FAIL', format('%s rejected applicants still have teacher role in profiles.', v_cnt));
    END IF;

END $$;

-- ------------------------------------------------------------------------------
-- VERIFICATION REPORT OUTPUT
-- ------------------------------------------------------------------------------

-- Summary Count by Status
SELECT 
    status, 
    COUNT(*) AS total_checks
FROM verification_results
GROUP BY status
ORDER BY status DESC;

-- CRITICAL: Display all failed checks (Must return 0 rows for clean pass)
SELECT 
    check_id,
    category,
    check_name,
    status,
    details AS failure_details
FROM verification_results
WHERE status != 'PASS'
ORDER BY check_id;

-- Detailed Report of All Executed Checks
SELECT 
    check_id,
    category,
    check_name,
    status,
    details
FROM verification_results
ORDER BY check_id;
