-- ==============================================================================
-- AttendAI: Complete Schema Setup & Dummy Users Provisioning
--
-- This script:
-- 1. Sets up the full database schema (profiles, roles, teacher_registration_requests)
-- 2. Configures Row Level Security (RLS) policies and automatic registration triggers
-- 3. Provisions two verified dummy test accounts:
--    - Student: email "student@gmail.com" / password "amol" -> Redirects to Student Dashboard
--    - Teacher: email "teacher@gmail.com" / password "amol" -> Status "approved" -> Redirects to Teacher Dashboard
-- 4. Reloads the PostgREST schema cache to ensure immediate API availability (resolves HTTP 404)
--
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/mcxrdvsejyragcjufhlx
-- 2. Go to the "SQL Editor" in the left navigation.
-- 3. Paste and run this entire script.
-- ==============================================================================

-- Enable pgcrypto extension for bcrypt password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ------------------------------------------------------------------------------
-- 1. User Role ENUM Type
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'user_role'
    ) THEN
        CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'admin');
    END IF;
END$$;

-- ------------------------------------------------------------------------------
-- 2. Profiles Table & Indexes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'student',
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    CONSTRAINT chk_profiles_full_name_non_empty CHECK (LENGTH(TRIM(full_name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON public.profiles(is_approved);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. Teacher Registration Requests Table & Indexes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

ALTER TABLE public.teacher_registration_requests 
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_teacher_requests_user ON public.teacher_registration_requests(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_pending_requests 
    ON public.teacher_registration_requests(user_id) 
    WHERE status = 'pending';

ALTER TABLE public.teacher_registration_requests ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 4. Row Level Security Policies & Table Grants
-- ------------------------------------------------------------------------------
-- Profiles Policies
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

-- Teacher Registration Requests Policies
DROP POLICY IF EXISTS "Users can submit own teacher request" ON public.teacher_registration_requests;
DROP POLICY IF EXISTS "Users can view own teacher requests" ON public.teacher_registration_requests;
CREATE POLICY "Users can view own teacher requests"
    ON public.teacher_registration_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

GRANT SELECT ON public.teacher_registration_requests TO authenticated;
REVOKE ALL ON TABLE public.teacher_registration_requests FROM anon;

-- ------------------------------------------------------------------------------
-- 5. Automatic Profile Creation Trigger on auth.users
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
    raw_name := NEW.raw_user_meta_data->>'full_name';
    cleaned_name := TRIM(COALESCE(raw_name, ''));
    IF LENGTH(cleaned_name) = 0 THEN
        cleaned_name := TRIM(SPLIT_PART(NEW.email, '@', 1));
    END IF;
    IF LENGTH(cleaned_name) = 0 THEN
        cleaned_name := 'AttendAI User';
    END IF;

    meta_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', '')));
    meta_requested_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'requested_role', '')));

    -- Case 1: Explicit valid Teacher registration intent:
    IF meta_requested_role = 'teacher' AND (meta_role = 'student' OR meta_role = '') THEN
        is_valid_teacher_reg := TRUE;
    -- Case 2: Explicit valid Student registration intent:
    ELSIF meta_role = 'student' AND meta_requested_role = '' THEN
        is_valid_student_reg := TRUE;
    END IF;

    IF is_valid_teacher_reg THEN
        assigned_role := 'teacher'::public.user_role;
        should_approve := FALSE;
    ELSIF is_valid_student_reg THEN
        assigned_role := 'student'::public.user_role;
        should_approve := TRUE;
    ELSE
        assigned_role := 'student'::public.user_role;
        should_approve := FALSE;
    END IF;

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
-- 6. Provision Dummy Test Users (student@gmail.com & teacher@gmail.com)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_student_id UUID;
    v_teacher_id UUID;
    v_encrypted_pw TEXT;
BEGIN
    -- Generate standard bcrypt hash for password "amol"
    v_encrypted_pw := extensions.crypt('amol', extensions.gen_salt('bf', 10));

    -- ==========================================================================
    -- 6A. Student User: student@gmail.com (Password: amol)
    -- ==========================================================================
    SELECT id INTO v_student_id FROM auth.users WHERE LOWER(email) = 'student@gmail.com';

    IF v_student_id IS NULL THEN
        v_student_id := gen_random_uuid();

        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_student_id,
            'authenticated',
            'authenticated',
            'student@gmail.com',
            v_encrypted_pw,
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Student Amol","role":"student"}'::jsonb,
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );

        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            v_student_id::text,
            v_student_id,
            jsonb_build_object('sub', v_student_id::text, 'email', 'student@gmail.com'),
            'email',
            v_student_id::text,
            NOW(),
            NOW(),
            NOW()
        ) ON CONFLICT (provider, provider_id) DO NOTHING;
    ELSE
        -- Update password and confirm email for existing user
        UPDATE auth.users
        SET encrypted_password = v_encrypted_pw,
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            raw_user_meta_data = jsonb_build_object('full_name', 'Student Amol', 'role', 'student'),
            updated_at = NOW()
        WHERE id = v_student_id;
    END IF;

    -- Ensure public.profiles has student role and is_approved = true
    INSERT INTO public.profiles (id, full_name, role, is_approved, created_at, updated_at)
    VALUES (v_student_id, 'Student Amol', 'student', TRUE, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
    SET role = 'student',
        is_approved = TRUE,
        full_name = 'Student Amol',
        updated_at = NOW();

    -- ==========================================================================
    -- 6B. Teacher User: teacher@gmail.com (Password: amol, Approved)
    -- ==========================================================================
    SELECT id INTO v_teacher_id FROM auth.users WHERE LOWER(email) = 'teacher@gmail.com';

    IF v_teacher_id IS NULL THEN
        v_teacher_id := gen_random_uuid();

        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_teacher_id,
            'authenticated',
            'authenticated',
            'teacher@gmail.com',
            v_encrypted_pw,
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Teacher Amol","role":"teacher","requested_role":"teacher"}'::jsonb,
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );

        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            v_teacher_id::text,
            v_teacher_id,
            jsonb_build_object('sub', v_teacher_id::text, 'email', 'teacher@gmail.com'),
            'email',
            v_teacher_id::text,
            NOW(),
            NOW(),
            NOW()
        ) ON CONFLICT (provider, provider_id) DO NOTHING;
    ELSE
        -- Update password and confirm email for existing user
        UPDATE auth.users
        SET encrypted_password = v_encrypted_pw,
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            raw_user_meta_data = jsonb_build_object('full_name', 'Teacher Amol', 'role', 'teacher', 'requested_role', 'teacher'),
            updated_at = NOW()
        WHERE id = v_teacher_id;
    END IF;

    -- Ensure public.profiles has teacher role and is_approved = true
    INSERT INTO public.profiles (id, full_name, role, is_approved, created_at, updated_at)
    VALUES (v_teacher_id, 'Teacher Amol', 'teacher', TRUE, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
    SET role = 'teacher',
        is_approved = TRUE,
        full_name = 'Teacher Amol',
        updated_at = NOW();

    -- Ensure public.teacher_registration_requests has approved status
    IF NOT EXISTS (
        SELECT 1 FROM public.teacher_registration_requests WHERE user_id = v_teacher_id
    ) THEN
        INSERT INTO public.teacher_registration_requests (user_id, status, created_at, updated_at)
        VALUES (v_teacher_id, 'approved', NOW(), NOW());
    ELSE
        UPDATE public.teacher_registration_requests
        SET status = 'approved',
            updated_at = NOW()
        WHERE user_id = v_teacher_id;
    END IF;

    RAISE NOTICE 'SUCCESS: Both student@gmail.com and teacher@gmail.com provisioned with password amol.';
END $$;

-- ------------------------------------------------------------------------------
-- 7. Reload PostgREST Schema Cache
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

