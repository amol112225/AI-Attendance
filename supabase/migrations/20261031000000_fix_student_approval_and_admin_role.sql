-- ==============================================================================
-- AttendAI Database Migration: Fix Student Approval Policy & Admin Provisioning
--
-- Root Cause:
-- Previously, handle_new_user() unconditionally inserted is_approved = FALSE
-- for ALL registrations. While Teachers require administrative verification,
-- Students do NOT require approval and must be granted immediate access.
--
-- Access Policy:
-- - Student: Approval required = NO (Immediate access upon registration)
-- - Teacher: Approval required = YES (Requires admin approval)
-- - Admin:   Approval required = NO (Immediate access upon trusted provisioning)
-- ==============================================================================

-- 1. Update the handle_new_user() trigger function
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
    should_approve BOOLEAN;
BEGIN
    -- Extract full_name safely from auth.users metadata
    raw_name := NEW.raw_user_meta_data->>'full_name';
    cleaned_name := TRIM(COALESCE(raw_name, ''));

    -- Fallback to email username if empty
    IF LENGTH(cleaned_name) = 0 THEN
        cleaned_name := TRIM(SPLIT_PART(NEW.email, '@', 1));
    END IF;

    -- Final safety fallback
    IF LENGTH(cleaned_name) = 0 THEN
        cleaned_name := 'AttendAI User';
    END IF;

    -- Inspect requested_role to distinguish standard Student from Teacher applicants
    requested_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'requested_role', '')));

    -- Students do NOT require administrative approval; Teachers DO require approval.
    IF requested_role = 'teacher' THEN
        should_approve := FALSE;
    ELSE
        should_approve := TRUE;
    END IF;

    -- Insert profile with appropriate approval status
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
        should_approve,
        TIMEZONE('utc'::TEXT, NOW()),
        TIMEZONE('utc'::TEXT, NOW())
    );

    -- If registration requested teacher privileges, create pending approval request
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

-- 2. Retroactively update existing student profiles that do not have pending teacher requests
UPDATE public.profiles
SET is_approved = TRUE,
    updated_at = TIMEZONE('utc'::TEXT, NOW())
WHERE role = 'student'
  AND id NOT IN (
      SELECT user_id 
      FROM public.teacher_registration_requests 
      WHERE status = 'pending'
  );

