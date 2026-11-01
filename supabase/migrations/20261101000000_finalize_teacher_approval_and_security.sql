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
-- 6. Implements concurrency-safe, fail-closed admin_approve_teacher() & admin_reject_teacher().
-- 7. Audits and tightens all privileges from PUBLIC, anon, and authenticated.
-- 8. Executes safe, non-destructive backfill for unprofiled accounts without broad approval.
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
-- 2. Schema Repair & Table Structure
-- ------------------------------------------------------------------------------
ALTER TABLE public.teacher_registration_requests 
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

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
    locked_request_id UUID;
    v_rows_updated INT;
BEGIN
    caller_uid := auth.uid();
    caller_role := auth.role();

    -- Strict fail-closed caller check using IS DISTINCT FROM
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

    -- Lock target profile
    PERFORM 1 FROM public.profiles 
    WHERE id = target_user_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user profile not found for user ID: %', target_user_id;
    END IF;

    -- Lock target pending request to serialize concurrent operations
    SELECT id INTO locked_request_id
    FROM public.teacher_registration_requests
    WHERE user_id = target_user_id AND status = 'pending'
    FOR UPDATE;

    IF locked_request_id IS NULL THEN
        RAISE EXCEPTION 'No pending teacher registration request found for user ID: %', target_user_id;
    END IF;

    -- Atomic update: Set request to approved
    UPDATE public.teacher_registration_requests
    SET status = 'approved',
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE id = locked_request_id AND status = 'pending';

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    IF v_rows_updated != 1 THEN
        RAISE EXCEPTION 'Concurrency error: Expected 1 request update, affected %', v_rows_updated;
    END IF;

    -- Atomic update: Set profile to teacher and approved
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
    locked_request_id UUID;
    v_rows_updated INT;
    cleaned_reason TEXT;
BEGIN
    caller_uid := auth.uid();
    caller_role := auth.role();

    -- Strict fail-closed caller check using IS DISTINCT FROM
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

    -- Lock target profile
    PERFORM 1 FROM public.profiles 
    WHERE id = target_user_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user profile not found for user ID: %', target_user_id;
    END IF;

    -- Lock target pending request
    SELECT id INTO locked_request_id
    FROM public.teacher_registration_requests
    WHERE user_id = target_user_id AND status = 'pending'
    FOR UPDATE;

    IF locked_request_id IS NULL THEN
        RAISE EXCEPTION 'No pending teacher registration request found for user ID: %', target_user_id;
    END IF;

    cleaned_reason := NULLIF(TRIM(p_rejection_reason), '');

    -- Atomic update: Mark request rejected with preserved reason
    UPDATE public.teacher_registration_requests
    SET status = 'rejected',
        rejection_reason = cleaned_reason,
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE id = locked_request_id AND status = 'pending';

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    IF v_rows_updated != 1 THEN
        RAISE EXCEPTION 'Concurrency error: Expected 1 request update, affected %', v_rows_updated;
    END IF;

    -- Atomic update: Set profile to student with is_approved TRUE
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
-- 8. Audited, Safe Backfill (Without Broad Approval)
-- ------------------------------------------------------------------------------
-- Step 8A: Backfill Clear Teacher Applicants (role = teacher, is_approved = FALSE)
INSERT INTO public.profiles (id, full_name, role, is_approved, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), SPLIT_PART(u.email, '@', 1), 'AttendAI User'),
    'teacher'::public.user_role,
    FALSE,
    u.created_at,
    TIMEZONE('utc'::TEXT, NOW())
FROM auth.users u
WHERE (
    LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'requested_role', ''))) = 'teacher'
    OR EXISTS (SELECT 1 FROM public.teacher_registration_requests trr WHERE trr.user_id = u.id)
)
ON CONFLICT (id) DO NOTHING;

-- Step 8B: Ensure pending request exists for unapproved teacher profiles lacking requests
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

-- Step 8C: Backfill Clear Students (explicit role = student, requested_role empty, no teacher requests)
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

-- Step 8D: Ambiguous Accounts (Missing or conflicting metadata)
-- Quarantined with is_approved = FALSE. Not approved as students.
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
