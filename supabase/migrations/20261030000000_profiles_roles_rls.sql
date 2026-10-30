-- ==============================================================================
-- AttendAI Database Migration: Profiles, Roles & Row Level Security (RLS)
-- Milestone 8.5: Database Profiles, Roles & RLS
--
-- Security-critical migration establishing:
-- 1. public.profiles table referencing auth.users(id)
-- 2. Role constraints ('student', 'teacher', 'admin') with safe default ('student')
-- 3. Administrative approval workflow (is_approved default false)
-- 4. Automatic profile creation trigger with SECURITY DEFINER and search_path protection
-- 5. Strict Row Level Security (RLS) policies:
--    - Users can only read their own profile
--    - Users can only update their own full_name (role, is_approved, id, created_at locked)
--    - Arbitrary profile inserts and deletes are strictly prohibited for client roles
-- ==============================================================================

-- 1. Create User Role ENUM Type (or text check constraint)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
    END IF;
END$$;

-- 2. Create public.profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),

    -- Data integrity constraints:
    -- Ensure full_name is non-empty after trimming whitespace
    CONSTRAINT chk_profiles_full_name_non_empty CHECK (LENGTH(TRIM(full_name)) > 0)
);

-- Index for role lookup performance (e.g., administrative queries & attendance listings)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Trigger Function: updated_at auto-refresh
CREATE OR REPLACE FUNCTION public.handle_profiles_updated_at()
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

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profiles_updated_at();

-- 4. Trigger Function: Automatic Profile Creation on auth.users insert
--
-- Security Rules:
-- - Runs with SECURITY DEFINER to write to public.profiles safely.
-- - Fixed search_path to prevent malicious path hijacking.
-- - Always defaults role to 'student' regardless of any client metadata.
-- - Always defaults is_approved to false (Administrative Approval Policy).
-- - Validates that full_name extracted from metadata is valid and non-empty.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    raw_name TEXT;
    cleaned_name TEXT;
BEGIN
    -- Extract full_name from auth.users metadata safely
    raw_name := NEW.raw_user_meta_data->>'full_name';
    cleaned_name := TRIM(COALESCE(raw_name, ''));

    -- Fallback to local part of email if name is missing or empty
    IF LENGTH(cleaned_name) = 0 THEN
        cleaned_name := TRIM(SPLIT_PART(NEW.email, '@', 1));
    END IF;

    -- Final safety fallback: Ensure a non-empty name is guaranteed
    IF LENGTH(cleaned_name) = 0 THEN
        cleaned_name := 'AttendAI Student';
    END IF;

    -- Insert profile with strict default privileges:
    -- Never trust user metadata for role or approval status.
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

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Re-raise exception to ensure user registration and profile creation remain atomic.
        -- In Supabase, if handle_new_user fails, auth.users insert will be rolled back,
        -- preventing orphaned Auth records without profile rows.
        RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1 (SELECT): An authenticated user can read ONLY their own profile.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy 2 (UPDATE): An authenticated user can update ONLY their own row.
-- Furthermore, prevent role or is_approved elevation at the policy level.
DROP POLICY IF EXISTS "Users can update own profile name" ON public.profiles;
CREATE POLICY "Users can update own profile name"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
        AND is_approved = (SELECT p.is_approved FROM public.profiles p WHERE p.id = auth.uid())
    );

-- Policy 3: Extra defense-in-depth trigger preventing role / is_approved modification by users
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Check if client session is an authenticated user (not service_role)
    IF auth.role() = 'authenticated' THEN
        -- Prevent role tampering
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Permission denied: Cannot alter user role.';
        END IF;

        -- Prevent approval status tampering
        IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
            RAISE EXCEPTION 'Permission denied: Cannot alter approval status.';
        END IF;

        -- Prevent primary key or creation timestamp alteration
        IF NEW.id IS DISTINCT FROM OLD.id THEN
            RAISE EXCEPTION 'Permission denied: Cannot alter profile ID.';
        END IF;
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

-- Policy 4 (INSERT): Explicitly reject ordinary client-side inserts.
-- Profile creation MUST only happen via the trusted on_auth_user_created trigger.
-- (By default in RLS, no INSERT policy means client INSERT is denied).

-- Policy 5 (DELETE): Deny client-side profile deletion.
-- Profiles cascade-delete automatically when auth.users record is removed.
-- (By default in RLS, no DELETE policy means client DELETE is denied).

-- 6. Permissions and Grants
GRANT SELECT, UPDATE(full_name) ON public.profiles TO authenticated;
REVOKE ALL ON TABLE public.profiles FROM anon;
