-- ==============================================================================
-- AttendAI Database Security Test & Verification Script
-- Milestone 8.5 Security Audit and Verification
--
-- This script contains executable SQL test cases to be run in the Supabase SQL Editor
-- to verify RLS policies, trigger constraints, and role protection rules.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TEST 1: Schema & Integrity Constraints Verification
-- ------------------------------------------------------------------------------
-- Expected: Table exists, RLS is enabled, columns and constraints match specification.
SELECT 
    c.column_name, 
    c.data_type, 
    c.is_nullable, 
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' AND c.table_name = 'profiles'
ORDER BY c.ordinal_position;

SELECT 
    conname AS constraint_name, 
    pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public' AND c.conrelid = 'public.profiles'::regclass;

-- ------------------------------------------------------------------------------
-- TEST 2: Row Level Security Policies Verification
-- ------------------------------------------------------------------------------
-- Expected:
--   - "Users can view own profile" (SELECT, TO authenticated, USING (auth.uid() = id))
--   - "Users can update own profile name" (UPDATE, TO authenticated, USING/CHECK (auth.uid() = id))
SELECT 
    policyname, 
    cmd, 
    roles, 
    qual AS using_expression, 
    with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- ------------------------------------------------------------------------------
-- TEST 3: Column Privileges Verification
-- ------------------------------------------------------------------------------
-- Expected:
--   - authenticated role has SELECT on all columns
--   - authenticated role has UPDATE ONLY on full_name
SELECT 
    grantee, 
    table_name, 
    column_name, 
    privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'profiles' AND grantee = 'authenticated'
ORDER BY column_name, privilege_type;

-- ------------------------------------------------------------------------------
-- TEST 4: Automatic Profile Creation Simulation (Trigger Test)
-- ------------------------------------------------------------------------------
-- Note: When a user registers via supabase.auth.signUp(), on_auth_user_created executes.
-- To test the trigger logic in SQL:
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    created_profile RECORD;
BEGIN
    -- Insert a mock user into auth.users (requires superuser/postgres in SQL editor)
    INSERT INTO auth.users (
        id, 
        instance_id, 
        email, 
        encrypted_password, 
        email_confirmed_at, 
        raw_user_meta_data, 
        role, 
        aud, 
        created_at, 
        updated_at
    )
    VALUES (
        test_user_id,
        '00000000-0000-0000-0000-000000000000',
        'audit_test_student@attendai.edu',
        crypt('TestPassword123!', gen_salt('bf')),
        NOW(),
        '{"full_name": "Audit Student", "role": "teacher"}'::jsonb, -- Intentionally passing role: teacher to test rejection
        'authenticated',
        'authenticated',
        NOW(),
        NOW()
    );

    -- Check the automatically created profile
    SELECT * INTO created_profile FROM public.profiles WHERE id = test_user_id;

    -- Verify default student role was assigned despite client metadata requesting "teacher"
    IF created_profile.role != 'student'::user_role THEN
        RAISE EXCEPTION 'TEST 4 FAILED: Expected role = student, got %', created_profile.role;
    END IF;

    -- Verify default unapproved status
    IF created_profile.is_approved IS NOT FALSE THEN
        RAISE EXCEPTION 'TEST 4 FAILED: Expected is_approved = false, got %', created_profile.is_approved;
    END IF;

    -- Verify full name was extracted
    IF created_profile.full_name != 'Audit Student' THEN
        RAISE EXCEPTION 'TEST 4 FAILED: Expected full_name = Audit Student, got %', created_profile.full_name;
    END IF;

    RAISE NOTICE 'TEST 4 PASSED: Profile auto-created with student role and is_approved = false';

    -- Cleanup test record
    DELETE FROM auth.users WHERE id = test_user_id;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 5: Role Escalation Prevention Simulation (Authenticated User Context)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    tamper_blocked BOOLEAN := FALSE;
BEGIN
    -- Setup test user
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at, 
        raw_user_meta_data, role, aud, created_at, updated_at
    ) VALUES (
        test_user_id, '00000000-0000-0000-0000-000000000000', 'tamper_test@attendai.edu',
        crypt('Pass123!', gen_salt('bf')), NOW(), '{"full_name": "Tamper Test"}'::jsonb,
        'authenticated', 'authenticated', NOW(), NOW()
    );

    -- Simulate an authenticated web request by setting the PostgREST request JWT claim
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);

    -- Attempt to escalate role to teacher
    BEGIN
        UPDATE public.profiles 
        SET role = 'teacher'::user_role 
        WHERE id = test_user_id;
    EXCEPTION
        WHEN OTHERS THEN
            tamper_blocked := TRUE;
            RAISE NOTICE 'Role tamper attempt successfully blocked: %', SQLERRM;
    END;

    IF NOT tamper_blocked THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Client was able to update role to teacher!';
    END IF;

    -- Attempt to self-approve
    tamper_blocked := FALSE;
    BEGIN
        UPDATE public.profiles 
        SET is_approved = TRUE 
        WHERE id = test_user_id;
    EXCEPTION
        WHEN OTHERS THEN
            tamper_blocked := TRUE;
            RAISE NOTICE 'Self-approval attempt successfully blocked: %', SQLERRM;
    END;

    IF NOT tamper_blocked THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Client was able to self-approve!';
    END IF;

    -- Attempt permitted update (updating own full_name)
    UPDATE public.profiles 
    SET full_name = 'Updated Legal Name' 
    WHERE id = test_user_id;

    IF (SELECT full_name FROM public.profiles WHERE id = test_user_id) != 'Updated Legal Name' THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Permitted name update failed';
    END IF;

    RAISE NOTICE 'TEST 5 PASSED: Name update permitted; Role and approval tampering strictly blocked!';

    -- Cleanup test record
    DELETE FROM auth.users WHERE id = test_user_id;
END;
$$;
