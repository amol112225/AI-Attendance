-- ==============================================================================
-- AttendAI — Manual Account Repair Script for Administrators (SEPARATE FROM MIGRATIONS)
--
-- IMPORTANT SAFETY INSTRUCTIONS:
-- 1. This file contains intentional, human-reviewed administrative repair operations.
-- 2. Do NOT run this script as an automated migration.
-- 3. Replace all '<TARGET_USER_UUID>' placeholders with actual UUID values from
--    supabase/tests/pre_migration_audit.sql or post_migration_verification.sql.
-- 4. Each repair runs in an atomic, validated block with built-in safeguards:
--    - Rejects null or default template UUIDs.
--    - Strictly prevents altering Administrator profiles.
--    - Enforces expected role and approval state preconditions.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- REPAIR 1: Release a Verified Student from Quarantine
--
-- WHEN APPROPRIATE:
-- An account was quarantined with role = 'student' and is_approved = FALSE during
-- backfill or registration because of incomplete/ambiguous metadata. An administrator
-- has confirmed the user's identity and verified that they are a legitimate student.
--
-- SAFEGUARDS:
-- - Rejects default placeholder UUID.
-- - Strictly refuses to alter administrator accounts.
-- - Fails if the user is already approved.
-- - Fails if the user has any submitted teacher registration requests.
-- ------------------------------------------------------------------------------
/*
DO $$
DECLARE
    target_uuid UUID := '00000000-0000-0000-0000-000000000000'; -- <-- REPLACE WITH ACTUAL USER UUID
    v_rows INT;
BEGIN
    IF target_uuid IS NULL OR target_uuid = '00000000-0000-0000-0000-000000000000'::UUID THEN
        RAISE EXCEPTION 'Safety check failed: Please replace target_uuid with a valid user UUID.';
    END IF;

    -- Safeguard: Never modify an administrator
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_uuid AND role = 'admin') THEN
        RAISE EXCEPTION 'Safety violation: Target user % is an administrator. Cannot modify admin via Repair 1.', target_uuid;
    END IF;

    -- Safeguard: Ensure user has no teacher requests
    IF EXISTS (SELECT 1 FROM public.teacher_registration_requests WHERE user_id = target_uuid) THEN
        RAISE EXCEPTION 'Safety violation: Target user % has teacher registration requests. Cannot release as student via Repair 1.', target_uuid;
    END IF;

    UPDATE public.profiles
    SET is_approved = TRUE,
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE id = target_uuid
      AND role = 'student'
      AND is_approved = FALSE;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows != 1 THEN
        RAISE EXCEPTION 'Repair 1 failed: Expected exactly 1 unapproved student profile to be updated, affected %', v_rows;
    END IF;

    RAISE NOTICE 'SUCCESS: User % released from quarantine as verified approved student.', target_uuid;
END $$;
*/

-- ------------------------------------------------------------------------------
-- REPAIR 2: Reclassify a Teacher Applicant with an Inconsistent Student Profile
--
-- WHEN APPROPRIATE:
-- Under legacy milestone triggers, an educator registered with requested_role = 'teacher',
-- but the system assigned them role = 'student' in public.profiles. This operation
-- converts them to an unapproved teacher and guarantees a pending request exists.
--
-- SAFEGUARDS:
-- - Rejects default placeholder UUID.
-- - Strictly refuses to alter administrator accounts.
-- - Refuses to alter users who are already approved teachers.
-- ------------------------------------------------------------------------------
/*
DO $$
DECLARE
    target_uuid UUID := '00000000-0000-0000-0000-000000000000'; -- <-- REPLACE WITH ACTUAL USER UUID
    v_rows INT;
BEGIN
    IF target_uuid IS NULL OR target_uuid = '00000000-0000-0000-0000-000000000000'::UUID THEN
        RAISE EXCEPTION 'Safety check failed: Please replace target_uuid with a valid user UUID.';
    END IF;

    -- Safeguard: Never modify an administrator
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_uuid AND role = 'admin') THEN
        RAISE EXCEPTION 'Safety violation: Target user % is an administrator.', target_uuid;
    END IF;

    -- Safeguard: Never modify an already approved teacher
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_uuid AND role = 'teacher' AND is_approved = TRUE) THEN
        RAISE EXCEPTION 'Safety violation: Target user % is already an approved teacher.', target_uuid;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_uuid) THEN
        RAISE EXCEPTION 'Target user profile % not found in public.profiles.', target_uuid;
    END IF;

    UPDATE public.profiles
    SET role = 'teacher'::public.user_role,
        is_approved = FALSE,
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE id = target_uuid;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows != 1 THEN
        RAISE EXCEPTION 'Failed to update profile for user %.', target_uuid;
    END IF;

    INSERT INTO public.teacher_registration_requests (
        user_id,
        status,
        rejection_reason,
        created_at,
        updated_at
    )
    VALUES (
        target_uuid,
        'pending',
        NULL,
        TIMEZONE('utc'::TEXT, NOW()),
        TIMEZONE('utc'::TEXT, NOW())
    )
    ON CONFLICT (user_id) WHERE status = 'pending' DO NOTHING;

    RAISE NOTICE 'SUCCESS: User % reclassified as Pending Teacher with active pending request.', target_uuid;
END $$;
*/

-- ------------------------------------------------------------------------------
-- REPAIR 3: Synchronize Inconsistent Approved Teacher Profile with Request
--
-- WHEN APPROPRIATE:
-- An administrator approved a teacher profile in public.profiles, but the corresponding
-- teacher_registration_requests row remained in pending status (identified by Check 26
-- in post_migration_verification.sql). This operation synchronizes both tables.
--
-- SAFEGUARDS:
-- - Rejects default placeholder UUID.
-- - Strictly refuses to alter administrator accounts.
-- - Refuses to alter student profiles.
-- ------------------------------------------------------------------------------
/*
DO $$
DECLARE
    target_uuid UUID := '00000000-0000-0000-0000-000000000000'; -- <-- REPLACE WITH ACTUAL USER UUID
    v_rows INT;
BEGIN
    IF target_uuid IS NULL OR target_uuid = '00000000-0000-0000-0000-000000000000'::UUID THEN
        RAISE EXCEPTION 'Safety check failed: Please replace target_uuid with a valid user UUID.';
    END IF;

    -- Safeguard: Never modify an administrator
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_uuid AND role = 'admin') THEN
        RAISE EXCEPTION 'Safety violation: Target user % is an administrator.', target_uuid;
    END IF;

    -- Safeguard: Never alter an active student via this teacher sync
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_uuid AND role = 'student') THEN
        RAISE EXCEPTION 'Safety violation: Target user % is a student profile.', target_uuid;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_uuid) THEN
        RAISE EXCEPTION 'Target user profile % not found in public.profiles.', target_uuid;
    END IF;

    -- 1. Ensure profile is confirmed approved teacher
    UPDATE public.profiles
    SET role = 'teacher'::public.user_role,
        is_approved = TRUE,
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE id = target_uuid;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows != 1 THEN
        RAISE EXCEPTION 'Failed to update profile for user %.', target_uuid;
    END IF;

    -- 2. Synchronize request record: update existing pending request to approved, or insert approved record if missing
    UPDATE public.teacher_registration_requests
    SET status = 'approved',
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE user_id = target_uuid
      AND status = 'pending';

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        IF NOT EXISTS (SELECT 1 FROM public.teacher_registration_requests WHERE user_id = target_uuid AND status = 'approved') THEN
            INSERT INTO public.teacher_registration_requests (
                user_id,
                status,
                rejection_reason,
                created_at,
                updated_at
            )
            VALUES (
                target_uuid,
                'approved',
                NULL,
                TIMEZONE('utc'::TEXT, NOW()),
                TIMEZONE('utc'::TEXT, NOW())
            );
        END IF;
    END IF;

    RAISE NOTICE 'SUCCESS: User % synchronized as Approved Teacher across profiles and requests.', target_uuid;
END $$;
*/

-- ------------------------------------------------------------------------------
-- REPAIR 4: Synchronize Inconsistent Rejected Teacher Profile with Request
--
-- WHEN APPROPRIATE:
-- An educator's teacher application was rejected, but their profile was left with
-- role = 'teacher' (identified by Check 28 in post_migration_verification.sql).
-- This operation marks the request as rejected with justification and transitions
-- their profile to role = 'student' with is_approved = TRUE so they can continue
-- attending classes as a student.
--
-- SAFEGUARDS:
-- - Rejects default placeholder UUID.
-- - Strictly refuses to alter administrator accounts.
-- - Correct syntax with separate GET DIAGNOSTICS and IF check.
-- ------------------------------------------------------------------------------
/*
DO $$
DECLARE
    target_uuid UUID := '00000000-0000-0000-0000-000000000000'; -- <-- REPLACE WITH ACTUAL USER UUID
    v_reason TEXT := 'Application rejected after administrative review.';
    v_rows INT;
BEGIN
    IF target_uuid IS NULL OR target_uuid = '00000000-0000-0000-0000-000000000000'::UUID THEN
        RAISE EXCEPTION 'Safety check failed: Please replace target_uuid with a valid user UUID.';
    END IF;

    -- Safeguard: Never modify an administrator
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_uuid AND role = 'admin') THEN
        RAISE EXCEPTION 'Safety violation: Target user % is an administrator.', target_uuid;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_uuid) THEN
        RAISE EXCEPTION 'Target user profile % not found in public.profiles.', target_uuid;
    END IF;

    -- 1. Update request status to rejected
    UPDATE public.teacher_registration_requests
    SET status = 'rejected',
        rejection_reason = v_reason,
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE user_id = target_uuid
      AND status = 'pending';

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        IF NOT EXISTS (SELECT 1 FROM public.teacher_registration_requests WHERE user_id = target_uuid AND status = 'rejected') THEN
            INSERT INTO public.teacher_registration_requests (
                user_id,
                status,
                rejection_reason,
                created_at,
                updated_at
            )
            VALUES (
                target_uuid,
                'rejected',
                v_reason,
                TIMEZONE('utc'::TEXT, NOW()),
                TIMEZONE('utc'::TEXT, NOW())
            );
        END IF;
    END IF;

    -- 2. Transition profile to approved student (Correct syntax)
    UPDATE public.profiles
    SET role = 'student'::public.user_role,
        is_approved = TRUE,
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE id = target_uuid;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows != 1 THEN
        RAISE EXCEPTION 'Failed to update profile for user %.', target_uuid;
    END IF;

    RAISE NOTICE 'SUCCESS: User % synchronized as Rejected Teacher (Student access preserved).', target_uuid;
END $$;
*/
