-- ==============================================================================
-- AttendAI Database Migration: Teacher Registration Requests & Security
-- Milestone 8.7: Teacher Registration and Approval Request
--
-- Security Rules & Architecture:
-- 1. public.teacher_registration_requests table referencing auth.users(id).
-- 2. Status constraint: ('pending', 'approved', 'rejected') with default 'pending'.
-- 3. Unique partial index to strictly prevent duplicate pending requests per user.
-- 4. RLS Policies:
--    - Authenticated users can view ONLY their own requests (auth.uid() = user_id).
--    - Authenticated users can INSERT only for their own user_id with status = 'pending'.
--    - Authenticated users CANNOT UPDATE or DELETE requests (revoked at grant & policy level).
--    - Anonymous users have zero access (REVOKE ALL).
-- 5. Anti-Tampering Trigger:
--    - Rejects any client attempt to modify requests or elevate status to 'approved'.
-- 6. Trigger handle_new_user() enhancement:
--    - Profiles ALWAYS default to 'student' and is_approved = FALSE.
--    - If raw_user_meta_data->>'requested_role' = 'teacher', automatically creates
--      a pending request in teacher_registration_requests.
-- ==============================================================================

-- 1. Create teacher_registration_requests Table
CREATE TABLE IF NOT EXISTS public.teacher_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_teacher_requests_user ON public.teacher_registration_requests(user_id);

-- Index for administrative filtering by status
CREATE INDEX IF NOT EXISTS idx_teacher_requests_status ON public.teacher_registration_requests(status);

-- Prevent duplicate pending requests: At most ONE pending request per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_pending_requests 
    ON public.teacher_registration_requests(user_id) 
    WHERE status = 'pending';

-- 2. Trigger Function: updated_at auto-refresh
CREATE OR REPLACE FUNCTION public.handle_teacher_request_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_teacher_request_updated_at ON public.teacher_registration_requests;
CREATE TRIGGER trigger_teacher_request_updated_at
    BEFORE UPDATE ON public.teacher_registration_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_teacher_request_updated_at();

-- 3. Security Trigger: Prevent Authenticated Client Modification / Self-Approval
CREATE OR REPLACE FUNCTION public.prevent_teacher_request_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    jwt_role TEXT;
BEGIN
    jwt_role := NULLIF(current_setting('request.jwt.claim.role', true), '');

    -- If updated by an authenticated web client, block all modifications
    IF (jwt_role = 'authenticated' OR auth.role() = 'authenticated')
       AND current_user NOT IN ('postgres', 'supabase_admin') THEN
        RAISE EXCEPTION 'Security violation: Authenticated users cannot modify teacher registration requests.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_teacher_request_tampering ON public.teacher_registration_requests;
CREATE TRIGGER trigger_prevent_teacher_request_tampering
    BEFORE UPDATE ON public.teacher_registration_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_teacher_request_tampering();

-- 4. Row Level Security (RLS) Configuration
ALTER TABLE public.teacher_registration_requests ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon
REVOKE ALL ON TABLE public.teacher_registration_requests FROM anon;

-- Policy 1: Authenticated users can view ONLY their own requests
DROP POLICY IF EXISTS "Users can view own teacher requests" ON public.teacher_registration_requests;
CREATE POLICY "Users can view own teacher requests"
    ON public.teacher_registration_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can insert their own request with status 'pending'
DROP POLICY IF EXISTS "Users can submit own teacher request" ON public.teacher_registration_requests;
CREATE POLICY "Users can submit own teacher request"
    ON public.teacher_registration_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND status = 'pending'
    );

-- Strict column grants: authenticated cannot update or delete
REVOKE UPDATE, DELETE ON public.teacher_registration_requests FROM authenticated;
GRANT SELECT, INSERT ON public.teacher_registration_requests TO authenticated;

-- 5. Enhanced handle_new_user() Trigger Function
-- Ensures:
-- - Profiles are ALWAYS initialized with role = 'student' and is_approved = FALSE
-- - If raw_user_meta_data->>'requested_role' = 'teacher', creates pending request
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    raw_name TEXT;
    cleaned_name TEXT;
    requested_role TEXT;
BEGIN
    -- Extract full_name safely
    raw_name := NEW.raw_user_meta_data->>'full_name';
    cleaned_name := TRIM(COALESCE(raw_name, ''));

    -- Fallback to email username if empty
    IF LENGTH(cleaned_name) = 0 THEN
        cleaned_name := TRIM(SPLIT_PART(NEW.email, '@', 1));
    END IF;

    -- Final fallback
    IF LENGTH(cleaned_name) = 0 THEN
        cleaned_name := 'AttendAI User';
    END IF;

    -- Strict default: ALWAYS student and NOT approved
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
        'student'::user_role,
        FALSE,
        TIMEZONE('utc'::TEXT, NOW()),
        TIMEZONE('utc'::TEXT, NOW())
    );

    -- Check if registration requested teacher approval
    requested_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'requested_role', '')));
    IF requested_role = 'teacher' THEN
        INSERT INTO public.teacher_registration_requests (
            user_id,
            status,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            'pending',
            TIMEZONE('utc'::TEXT, NOW()),
            TIMEZONE('utc'::TEXT, NOW())
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;
