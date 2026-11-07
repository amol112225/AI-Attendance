-- ==============================================================================
-- AttendAI Database Forward Migration: Finalize Teacher Approval & Security
-- Migration Version: 20261101000000_finalize_teacher_approval_and_security.sql
--
-- Security Corrections & Architecture Finalization:
-- 1. Validates public.user_role ENUM type.
-- 2. Ensures rejection_reason column exists on teacher_registration_requests.
-- 3. Revokes direct client INSERT on teacher_registration_requests (trigger-only creation).
-- 4. Corrects privilege escalation triggers to SECURITY INVOKER checking effective role current_user.
-- 5. Implements fail-closed handle_new_user() with explicit quarantine for ambiguous metadata.
-- 6. Implements concurrency-safe, fail-closed admin_approve_teacher() & admin_reject_teacher()
--    with strict target validation (cannot modify admin, approved teacher, or active student;
--    validates pending request existence and uniqueness).
-- 7. Audits and tightens all privileges from PUBLIC, anon, and authenticated.
-- 8. Executes audited, safe backfill with explicit reconciliation rules:
--    - Historical approved requests backfilled with role = teacher, is_approved = true.
--    - Historical rejected requests backfilled with role = student, is_approved = true (never recreated as pending).
--    - Active pending teacher applicants backfilled with role = teacher, is_approved = false.
--    - Clear students backfilled with role = student, is_approved = true.
--    - Ambiguous accounts quarantined with is_approved = false (never silently approved).
--    - Existing profiles strictly preserved (ON CONFLICT DO NOTHING).
-- 9. PostgREST schema cache reload.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Validate public.user_role ENUM Type
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'user_role'
    ) THEN
        CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'admin');
    ELSE
        -- Validate existing type is an enum with exact required labels
        IF NOT EXISTS (
            SELECT 1 FROM pg_type t
            JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public' AND t.typname = 'user_role' AND t.typtype = 'e'
        ) THEN
            RAISE EXCEPTION 'Schema conflict: Type public.user_role exists but is not an ENUM.';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'user_role' AND e.enumlabel = 'student')
           OR NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'user_role' AND e.enumlabel = 'teacher')
           OR NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'user_role' AND e.enumlabel = 'admin') THEN
            RAISE EXCEPTION 'Schema conflict: Existing public.user_role does not contain required labels (student, teacher, admin).';
        END IF;
    END IF;
END$$;

-- ------------------------------------------------------------------------------
-- 2. Schema Structure Verification & Idempotent Setup
-- ------------------------------------------------------------------------------
-- Ensure public.profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'student',
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON public.profiles(is_approved);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure public.teacher_registration_requests table exists
CREATE TABLE IF NOT EXISTS public.teacher_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Idempotency repair: Ensure rejection_reason column exists if table was previously created
ALTER TABLE public.teacher_registration_requests 
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_teacher_requests_user ON public.teacher_registration_requests(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_pending_requests 
    ON public.teacher_registration_requests(user_id) 
    WHERE status = 'pending';

ALTER TABLE public.teacher_registration_requests ENABLE ROW LEVEL SECURITY;

-- Base RLS policies for profiles: authenticated users can view own profile and update full_name
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile name" ON public.profiles;
CREATE POLICY "Users can update own profile name"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

GRANT SELECT, UPDATE(full_name) ON public.profiles TO authenticated;
REVOKE ALL ON TABLE public.profiles FROM anon;

-- ------------------------------------------------------------------------------
-- 3. Trigger-Only Request Creation & RLS Hardening on teacher_registration_requests
-- ------------------------------------------------------------------------------
-- Revoke direct client INSERT: Teacher requests are created solely by the trusted registration trigger
DROP POLICY IF EXISTS "Users can submit own teacher request" ON public.teacher_registration_requests;
REVOKE INSERT ON public.teacher_registration_requests FROM authenticated;
REVOKE INSERT ON public.teacher_registration_requests FROM anon;
REVOKE INSERT ON public.teacher_registration_requests FROM PUBLIC;

-- Preserve authenticated SELECT for user's own request and rejection reason
DROP POLICY IF EXISTS "Users can view own teacher requests" ON public.teacher_registration_requests;
CREATE POLICY "Users can view own teacher requests"
    ON public.teacher_registration_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

GRANT SELECT ON public.teacher_registration_requests TO authenticated;

-- ------------------------------------------------------------------------------
-- 4. Correct Privilege Escalation Triggers (SECURITY INVOKER)
-- ------------------------------------------------------------------------------
-- A. Profile protection trigger
-- Relies on current_user = 'authenticated' to distinguish direct client web calls
-- from trusted administrative operations executing under definer roles (e.g. postgres).
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    -- If the effective database role is 'authenticated' (direct client API call):
    IF current_user = 'authenticated' THEN
        -- Prevent role tampering
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Permission denied: Cannot alter user role.';
        END IF;

        -- Prevent approval status tampering
        IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
            RAISE EXCEPTION 'Permission denied: Cannot alter approval status.';
        END IF;

        -- Prevent primary key tampering
        IF NEW.id IS DISTINCT FROM OLD.id THEN
            RAISE EXCEPTION 'Permission denied: Cannot alter profile ID.';
        END IF;

        -- Prevent creation timestamp tampering
        IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Permission denied: Cannot alter created_at timestamp.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_profile_privilege_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- B. Teacher registration request protection trigger
CREATE OR REPLACE FUNCTION public.prevent_teacher_request_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Direct client updates from 'authenticated' web sessions are strictly forbidden.
    -- Trusted SECURITY DEFINER operations (running as function owner postgres) can update requests.
    IF current_user = 'authenticated' THEN
        RAISE EXCEPTION 'Permission denied: Authenticated users cannot modify teacher registration requests.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_teacher_request_tampering ON public.teacher_registration_requests;
CREATE TRIGGER trigger_prevent_teacher_request_tampering
    BEFORE UPDATE ON public.teacher_registration_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_teacher_request_tampering();

-- ------------------------------------------------------------------------------
-- 5. Correct Registration Trigger: Strict Intent & Quarantine for Ambiguities
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    raw_name TEXT;
    cleaned_name TEXT;
    meta_role TEXT;
    meta_requested_role TEXT;
    assigned_role public.user_role;
    should_approve BOOLEAN;
    is_valid_teacher_reg BOOLEAN := FALSE;
    is_valid_student_reg BOOLEAN := FALSE;
BEGIN
    -- Extract full name safely with fallbacks
    raw_name := NEW.raw_user_meta_data->>'full_name';
    cleaned_name := TRIM(COALESCE(raw_name, ''));
    IF LENGTH(cleaned_name) = 0 THEN
        cleaned_name := TRIM(SPLIT_PART(NEW.email, '@', 1));
    END IF;
    IF LENGTH(cleaned_name) = 0 THEN
        cleaned_name := 'AttendAI User';
    END IF;

    -- Extract metadata as registration intent ONLY
    meta_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', '')));
    meta_requested_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'requested_role', '')));

    -- Case 1: Explicit valid Teacher registration intent:
    -- requested_role = 'teacher' AND role is either 'student' (standard signup default) or empty.
    -- Strict check: meta_role must NOT be 'admin' or invalid.
    IF meta_requested_role = 'teacher' AND (meta_role = 'student' OR meta_role = '') THEN
        is_valid_teacher_reg := TRUE;
    -- Case 2: Explicit valid Student registration intent:
    -- role = 'student' AND requested_role is NOT set (empty)
    ELSIF meta_role = 'student' AND meta_requested_role = '' THEN
        is_valid_student_reg := TRUE;
    END IF;

    -- Authorization assignment
    IF is_valid_teacher_reg THEN
        assigned_role := 'teacher'::public.user_role;
        should_approve := FALSE;
    ELSIF is_valid_student_reg THEN
        assigned_role := 'student'::public.user_role;
        should_approve := TRUE;
    ELSE
        -- Case 3: Missing, invalid, conflicting, or privileged attempt (e.g. claiming 'admin')
        -- Quarantined: assigned role student, is_approved FALSE. No teacher request created.
        assigned_role := 'student'::public.user_role;
        should_approve := FALSE;
    END IF;

    -- Insert profile
    INSERT INTO public.profiles (
        id,
        full_name,
        role,
        is_approved,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        cleaned_name,
        assigned_role,
        should_approve,
        TIMEZONE('utc'::TEXT, NOW()),
        TIMEZONE('utc'::TEXT, NOW())
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create pending request strictly for valid teacher applicants
    IF is_valid_teacher_reg THEN
        INSERT INTO public.teacher_registration_requests (
            user_id,
            status,
            rejection_reason,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            'pending',
            NULL,
            TIMEZONE('utc'::TEXT, NOW()),
            TIMEZONE('utc'::TEXT, NOW())
        )
        ON CONFLICT (user_id) WHERE status = 'pending' DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 6. Concurrency-Safe, Fail-Closed Admin Approval & Rejection Operations
-- ------------------------------------------------------------------------------

-- A. Admin Approve Teacher
CREATE OR REPLACE FUNCTION public.admin_approve_teacher(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    caller_uid UUID;
    caller_role TEXT;
    is_admin BOOLEAN;
    v_target_role public.user_role;
    v_target_is_approved BOOLEAN;
    v_pending_count INT;
    locked_request_id UUID;
    v_rows_updated INT;
BEGIN
    caller_uid := auth.uid();
    caller_role := auth.role();

    -- 1. Strict fail-closed caller check using IS DISTINCT FROM
    IF caller_uid IS NULL OR caller_role IS DISTINCT FROM 'authenticated' THEN
        RAISE EXCEPTION 'Access denied: Caller must be an authenticated user.';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = caller_uid AND role = 'admin' AND is_approved = TRUE
    ) INTO is_admin;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Access denied: Caller is not an authorized administrator.';
    END IF;

    -- 2. Validate target_user_id parameter
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Validation error: target_user_id cannot be null.';
    END IF;

    IF target_user_id = caller_uid THEN
        RAISE EXCEPTION 'Access denied: Administrator cannot approve their own account.';
    END IF;

    -- 3. Lock target profile and validate applicant status
    SELECT role, is_approved 
    INTO v_target_role, v_target_is_approved
    FROM public.profiles 
    WHERE id = target_user_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user profile not found for user ID: %', target_user_id;
    END IF;

    -- Safeguard: Do not allow approval to change an administrator
    IF v_target_role = 'admin' THEN
        RAISE EXCEPTION 'Operation rejected: Target user is an administrator and cannot be modified by teacher approval.';
    END IF;

    -- Safeguard: Do not allow approval to change an already approved teacher
    IF v_target_role = 'teacher' AND v_target_is_approved = TRUE THEN
        RAISE EXCEPTION 'Operation rejected: Target user is already an approved teacher.';
    END IF;

    -- Safeguard: Do not allow approval to change an unrelated active student
    IF v_target_role = 'student' AND v_target_is_approved = TRUE THEN
        RAISE EXCEPTION 'Operation rejected: Target user is an active student and cannot be modified by teacher approval.';
    END IF;

    -- Safeguard: Target profile must not be already approved
    IF v_target_is_approved = TRUE THEN
        RAISE EXCEPTION 'Operation rejected: Target user profile is already approved.';
    END IF;

    -- 4. Validate existence and uniqueness of the pending teacher request
    SELECT COUNT(*), MIN(id)
    INTO v_pending_count, locked_request_id
    FROM public.teacher_registration_requests
    WHERE user_id = target_user_id AND status = 'pending';

    IF v_pending_count = 0 THEN
        RAISE EXCEPTION 'Validation error: No pending teacher registration request found for user ID: %', target_user_id;
    END IF;

    IF v_pending_count > 1 THEN
        RAISE EXCEPTION 'Data integrity error: Multiple pending teacher registration requests found for user ID: % (count: %). Manual reconciliation required.', target_user_id, v_pending_count;
    END IF;

    -- Lock target pending request row to serialize concurrent operations
    PERFORM 1
    FROM public.teacher_registration_requests
    WHERE id = locked_request_id AND status = 'pending'
    FOR UPDATE;

    -- 5. Atomic update: Set request to approved
    UPDATE public.teacher_registration_requests
    SET status = 'approved',
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE id = locked_request_id AND status = 'pending';

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    IF v_rows_updated != 1 THEN
        RAISE EXCEPTION 'Concurrency error: Expected 1 request update, affected %', v_rows_updated;
    END IF;

    -- 6. Atomic update: Set profile to teacher and approved
    UPDATE public.profiles
    SET role = 'teacher'::public.user_role,
        is_approved = TRUE,
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE id = target_user_id;

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    IF v_rows_updated != 1 THEN
        RAISE EXCEPTION 'Concurrency error: Expected 1 profile update, affected %', v_rows_updated;
    END IF;
END;
$$;

-- B. Admin Reject Teacher
CREATE OR REPLACE FUNCTION public.admin_reject_teacher(
    target_user_id UUID,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    caller_uid UUID;
    caller_role TEXT;
    is_admin BOOLEAN;
    v_target_role public.user_role;
    v_target_is_approved BOOLEAN;
    v_pending_count INT;
    locked_request_id UUID;
    v_rows_updated INT;
    cleaned_reason TEXT;
BEGIN
    caller_uid := auth.uid();
    caller_role := auth.role();

    -- 1. Strict fail-closed caller check using IS DISTINCT FROM
    IF caller_uid IS NULL OR caller_role IS DISTINCT FROM 'authenticated' THEN
        RAISE EXCEPTION 'Access denied: Caller must be an authenticated user.';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = caller_uid AND role = 'admin' AND is_approved = TRUE
    ) INTO is_admin;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Access denied: Caller is not an authorized administrator.';
    END IF;

    -- 2. Validate target_user_id parameter
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Validation error: target_user_id cannot be null.';
    END IF;

    IF target_user_id = caller_uid THEN
        RAISE EXCEPTION 'Access denied: Administrator cannot reject their own account.';
    END IF;

    -- 3. Lock target profile and validate applicant status
    SELECT role, is_approved 
    INTO v_target_role, v_target_is_approved
    FROM public.profiles 
    WHERE id = target_user_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user profile not found for user ID: %', target_user_id;
    END IF;

    -- Safeguard: Do not allow rejection to change an administrator
    IF v_target_role = 'admin' THEN
        RAISE EXCEPTION 'Operation rejected: Target user is an administrator and cannot be modified by teacher rejection.';
    END IF;

    -- Safeguard: Do not allow rejection to change an already approved teacher
    IF v_target_role = 'teacher' AND v_target_is_approved = TRUE THEN
        RAISE EXCEPTION 'Operation rejected: Target user is already an approved teacher.';
    END IF;

    -- Safeguard: Do not allow rejection to change an unrelated active student
    IF v_target_role = 'student' AND v_target_is_approved = TRUE THEN
        RAISE EXCEPTION 'Operation rejected: Target user is an active student and cannot be modified by teacher rejection.';
    END IF;

    -- Safeguard: Target profile must not be already approved
    IF v_target_is_approved = TRUE THEN
        RAISE EXCEPTION 'Operation rejected: Target user profile is already approved.';
    END IF;

    -- 4. Validate existence and uniqueness of the pending teacher request
    SELECT COUNT(*), MIN(id)
    INTO v_pending_count, locked_request_id
    FROM public.teacher_registration_requests
    WHERE user_id = target_user_id AND status = 'pending';

    IF v_pending_count = 0 THEN
        RAISE EXCEPTION 'Validation error: No pending teacher registration request found for user ID: %', target_user_id;
    END IF;

    IF v_pending_count > 1 THEN
        RAISE EXCEPTION 'Data integrity error: Multiple pending teacher registration requests found for user ID: % (count: %). Manual reconciliation required.', target_user_id, v_pending_count;
    END IF;

    -- Lock target pending request row to serialize concurrent operations
    PERFORM 1
    FROM public.teacher_registration_requests
    WHERE id = locked_request_id AND status = 'pending'
    FOR UPDATE;

    cleaned_reason := NULLIF(TRIM(p_rejection_reason), '');

    -- 5. Atomic update: Mark request rejected with preserved reason
    UPDATE public.teacher_registration_requests
    SET status = 'rejected',
        rejection_reason = cleaned_reason,
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE id = locked_request_id AND status = 'pending';

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    IF v_rows_updated != 1 THEN
        RAISE EXCEPTION 'Concurrency error: Expected 1 request update, affected %', v_rows_updated;
    END IF;

    -- 6. Atomic update: Set profile to student with is_approved TRUE
    -- Allows continued student attendance; permanently blocks from Faculty Portal
    UPDATE public.profiles
    SET role = 'student'::public.user_role,
        is_approved = TRUE,
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE id = target_user_id;

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    IF v_rows_updated != 1 THEN
        RAISE EXCEPTION 'Concurrency error: Expected 1 profile update, affected %', v_rows_updated;
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. Function Privilege Lockdown
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.admin_approve_teacher(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_approve_teacher(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_teacher(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_reject_teacher(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_reject_teacher(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_teacher(UUID, TEXT) TO authenticated;

-- ------------------------------------------------------------------------------
-- 8. Audited, Reconciled Backfill (Preserves Existing Profiles & Rejection History)
-- ------------------------------------------------------------------------------
-- Step 8A: Historical Approved Teachers with missing profiles
-- If a user has an approved request in teacher_registration_requests and no profile,
-- restore them as an approved teacher.
INSERT INTO public.profiles (id, full_name, role, is_approved, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), SPLIT_PART(u.email, '@', 1), 'AttendAI Faculty'),
    'teacher'::public.user_role,
    TRUE,
    u.created_at,
    TIMEZONE('utc'::TEXT, NOW())
FROM auth.users u
WHERE EXISTS (
    SELECT 1 FROM public.teacher_registration_requests trr 
    WHERE trr.user_id = u.id AND trr.status = 'approved'
)
AND NOT EXISTS (
    SELECT 1 FROM public.teacher_registration_requests trr 
    WHERE trr.user_id = u.id AND trr.status = 'pending'
)
ON CONFLICT (id) DO NOTHING;

-- Step 8B: Historical Rejected Teachers with missing profiles
-- Reconcile as approved student (preserving student attendance while request record stays rejected).
-- NEVER recreate a rejected applicant as an unapproved pending teacher!
INSERT INTO public.profiles (id, full_name, role, is_approved, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), SPLIT_PART(u.email, '@', 1), 'AttendAI User'),
    'student'::public.user_role,
    TRUE,
    u.created_at,
    TIMEZONE('utc'::TEXT, NOW())
FROM auth.users u
WHERE EXISTS (
    SELECT 1 FROM public.teacher_registration_requests trr 
    WHERE trr.user_id = u.id AND trr.status = 'rejected'
)
AND NOT EXISTS (
    SELECT 1 FROM public.teacher_registration_requests trr 
    WHERE trr.user_id = u.id AND trr.status IN ('pending', 'approved')
)
ON CONFLICT (id) DO NOTHING;

-- Step 8C: Active Pending Teacher Applicants with missing profiles
-- Strictly users who have a pending request, OR explicit requested_role = 'teacher'
-- AND no existing approved or rejected request.
INSERT INTO public.profiles (id, full_name, role, is_approved, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), SPLIT_PART(u.email, '@', 1), 'AttendAI Applicant'),
    'teacher'::public.user_role,
    FALSE,
    u.created_at,
    TIMEZONE('utc'::TEXT, NOW())
FROM auth.users u
WHERE (
    EXISTS (
        SELECT 1 FROM public.teacher_registration_requests trr 
        WHERE trr.user_id = u.id AND trr.status = 'pending'
    )
    OR (
        LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'requested_role', ''))) = 'teacher'
        AND NOT EXISTS (
            SELECT 1 FROM public.teacher_registration_requests trr 
            WHERE trr.user_id = u.id AND trr.status IN ('approved', 'rejected')
        )
    )
)
ON CONFLICT (id) DO NOTHING;

-- Step 8D: Ensure pending request exists for unapproved teacher profiles lacking any request
INSERT INTO public.teacher_registration_requests (user_id, status, rejection_reason, created_at, updated_at)
SELECT 
    p.id,
    'pending',
    NULL,
    p.created_at,
    TIMEZONE('utc'::TEXT, NOW())
FROM public.profiles p
WHERE p.role = 'teacher'
  AND p.is_approved = FALSE
  AND NOT EXISTS (
      SELECT 1 FROM public.teacher_registration_requests trr WHERE trr.user_id = p.id
  )
ON CONFLICT (user_id) WHERE status = 'pending' DO NOTHING;

-- Step 8E: Clear Students with missing profiles
-- Explicit role = student, requested_role is empty, and NO records in teacher_registration_requests.
INSERT INTO public.profiles (id, full_name, role, is_approved, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), SPLIT_PART(u.email, '@', 1), 'AttendAI Student'),
    'student'::public.user_role,
    TRUE,
    u.created_at,
    TIMEZONE('utc'::TEXT, NOW())
FROM auth.users u
WHERE LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'role', ''))) = 'student'
  AND LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'requested_role', ''))) = ''
  AND NOT EXISTS (SELECT 1 FROM public.teacher_registration_requests trr WHERE trr.user_id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Step 8F: Ambiguous Accounts (Missing or conflicting metadata) with missing profiles
-- Quarantined with is_approved = FALSE. NEVER silently approved.
INSERT INTO public.profiles (id, full_name, role, is_approved, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), SPLIT_PART(u.email, '@', 1), 'Unverified User'),
    'student'::public.user_role,
    FALSE,
    u.created_at,
    TIMEZONE('utc'::TEXT, NOW())
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. PostgREST Schema Cache Reload
-- ------------------------------------------------------------------------------
-- Instruct PostgREST to immediately refresh its schema cache so newly created
-- tables and columns are instantly reachable via the REST API without 404 errors.
NOTIFY pgrst, 'reload schema';
