-- ==============================================================================
-- AttendAI Database Migration 4: Role Assignment, Approval Operations & Audited Backfill
-- Milestone 9.7 & Security Hardening
--
-- Security Rules & Business Logic:
-- 1. Student Registration: Assigned role = 'student', is_approved = TRUE.
-- 2. Teacher Registration: Assigned role = 'teacher', is_approved = FALSE,
--    and creates pending record in teacher_registration_requests.
-- 3. Atomic Admin Operations: admin_approve_teacher() & admin_reject_teacher().
-- 4. Audited, Safe Backfill: Quarantines ambiguous accounts with is_approved = FALSE.
-- ==============================================================================

-- 1. Automatic Profile Creation Trigger Function on auth.users
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

-- 2. Concurrency-Safe Atomic Teacher Approval Operation
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

    -- Strict fail-closed caller check: Non-null UID, authenticated role, verified admin profile
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

REVOKE ALL ON FUNCTION public.admin_approve_teacher(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_approve_teacher(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_teacher(UUID) TO authenticated;

-- 3. Concurrency-Safe Atomic Teacher Rejection Operation (with Optional Rejection Reason)
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

    -- Strict fail-closed caller check
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

    -- Atomic update: Transition profile to student with is_approved TRUE
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

REVOKE ALL ON FUNCTION public.admin_reject_teacher(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_reject_teacher(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_teacher(UUID, TEXT) TO authenticated;

-- 4. Audited, Safe Backfill for Existing Accounts (Preserving Existing Profiles)

-- Step 4A: Backfill Clear Teacher Applicants (role = teacher, is_approved = false)
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

-- Step 4B: Ensure pending request exists for unapproved teacher profiles
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

-- Step 4C: Backfill Clear Students (Explicit student metadata)
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

-- Step 4D: Retroactively update ONLY verified student accounts that explicitly registered as student
-- (Eliminates broad accidental approval of quarantined or unverified accounts)
UPDATE public.profiles
SET is_approved = TRUE,
    updated_at = TIMEZONE('utc'::TEXT, NOW())
WHERE role = 'student'
  AND id IN (
      SELECT u.id FROM auth.users u
      WHERE LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'role', ''))) = 'student'
        AND LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'requested_role', ''))) = ''
        AND NOT EXISTS (SELECT 1 FROM public.teacher_registration_requests trr WHERE trr.user_id = u.id)
  );

-- Step 4E: Ambiguous Accounts Handling (Quarantined with is_approved = FALSE)
-- Accounts with missing or unverified metadata are created with is_approved = FALSE
-- preventing unvetted dashboard access until an administrator reviews them.
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
