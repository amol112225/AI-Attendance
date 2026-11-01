-- ==============================================================================
-- AttendAI — Manual Account Repair Script for Administrators (SEPARATE FROM MIGRATIONS)
--
-- IMPORTANT SAFETY INSTRUCTIONS:
-- 1. This file contains intentional, human-reviewed administrative repair operations.
-- 2. Do NOT run this script as an automated migration.
-- 3. Replace all '<TARGET_USER_UUID>' placeholders with actual UUID values from
--    supabase/tests/pre_migration_audit.sql before executing any repair.
-- 4. Each repair runs in an atomic, validated block to prevent partial updates.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- REPAIR 1: Release a Verified Student from Quarantine
-- Context: An ambiguous account was quarantined with is_approved = FALSE during backfill.
-- The administrator has manually confirmed that this user is a legitimate student.
-- ------------------------------------------------------------------------------
/*
DO $$
DECLARE
    target_uuid UUID := '<TARGET_USER_UUID>'; -- Replace with actual user UUID
    v_rows INT;
BEGIN
    UPDATE public.profiles
    SET is_approved = TRUE,
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE id = target_uuid
      AND role = 'student'
      AND is_approved = FALSE;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows != 1 THEN
        RAISE EXCEPTION 'Repair 1 failed: Expected 1 profile to be updated, affected %', v_rows;
    END IF;
    RAISE NOTICE 'SUCCESS: User % released from quarantine as approved student.', target_uuid;
END $$;
*/

-- ------------------------------------------------------------------------------
-- REPAIR 2: Reclassify a Teacher Applicant with an Existing Inconsistent Profile
-- Context: Under earlier milestone triggers, a teacher applicant was assigned
-- role = 'student' in public.profiles. This operation converts them to an unapproved
-- teacher and ensures their pending request exists in teacher_registration_requests.
-- ------------------------------------------------------------------------------
/*
DO $$
DECLARE
    target_uuid UUID := '<TARGET_USER_UUID>'; -- Replace with actual user UUID
    v_rows INT;
BEGIN
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

    RAISE NOTICE 'SUCCESS: User % reclassified as Pending Teacher with pending request.', target_uuid;
END $$;
*/

-- ------------------------------------------------------------------------------
-- REPAIR 3: Synchronize Inconsistent Approved Teacher Profile with Request
-- Context: An administrator previously approved a teacher profile, but the corresponding
-- teacher_registration_requests row was left in pending or missing status.
-- This operation validates and synchronizes both tables transactionally.
-- ------------------------------------------------------------------------------
/*
DO $$
DECLARE
    target_uuid UUID := '<TARGET_USER_UUID>'; -- Replace with actual user UUID
    v_rows INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_uuid) THEN
        RAISE EXCEPTION 'Target user profile % not found in public.profiles.', target_uuid;
    END IF;

    -- 1. Ensure profile is approved teacher
    UPDATE public.profiles
    SET role = 'teacher'::public.user_role,
        is_approved = TRUE,
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE id = target_uuid;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows != 1 THEN
        RAISE EXCEPTION 'Failed to update profile for user %.', target_uuid;
    END IF;

    -- 2. Synchronize request record: update existing pending request, or insert approved record if missing
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
-- Context: A teacher application was rejected, but the profile was not synchronized
-- to student role. This operation updates request to rejected and sets profile to
-- student with is_approved = TRUE so the user can continue student attendance.
-- ------------------------------------------------------------------------------
/*
DO $$
DECLARE
    target_uuid UUID := '<TARGET_USER_UUID>'; -- Replace with actual user UUID
    v_reason TEXT := 'Application rejected after administrative review.';
    v_rows INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_uuid) THEN
        RAISE EXCEPTION 'Target user profile % not found in public.profiles.', target_uuid;
    END IF;

    -- 1. Update request status
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

    -- 2. Transition profile to approved student
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
