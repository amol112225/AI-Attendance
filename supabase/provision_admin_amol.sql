-- ==============================================================================
-- AttendAI: Provision AMOL Administrator Account
--
-- Security Guidelines:
-- 1. Do NOT create public Admin registration forms.
-- 2. Do NOT allow users to select Admin role in registration metadata.
-- 3. Do NOT expose Supabase service-role keys in frontend code.
-- 4. Do NOT store hardcoded passwords in version control.
-- 5. Email confirmation is a separate authentication decision and must be performed
--    via the official Supabase Authentication workflow, NOT through profile scripts.
-- 6. Require explicit verification of BOTH the target User UUID and Email before promotion.
-- 7. Prevent accidental promotion of unrelated active student or teacher accounts.
--
-- SETUP INSTRUCTIONS FOR SUPABASE ADMINISTRATOR:
--
-- Step 1 (Supabase Dashboard):
--   Go to Authentication -> Users -> Click "Add User" -> "Create User"
--   Enter:
--     Email: admin.amol@attendai.edu (or your configured VITE_DEMO_ADMIN_EMAIL)
--     Password: <Choose a strong temporary development password>
--     Confirm the user email according to your project authentication policies.
--   Copy the generated User UID from the user list.
--
-- Step 2 (Supabase SQL Editor):
--   Set the 'target_user_id' variable below to the exact UUID copied from Step 1.
--   Run this script in the SQL Editor.
-- ==============================================================================

DO $$
DECLARE
    -- EXPLICIT VERIFICATION REQUIRED:
    -- Paste the exact User UID generated in Supabase Authentication Dashboard:
    target_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- <-- REPLACE WITH AUTH USER UUID
    target_email   TEXT := 'admin.amol@attendai.edu';
    target_name    TEXT := 'AMOL';

    v_auth_user RECORD;
    v_existing_profile RECORD;
    v_has_teacher_requests BOOLEAN;
BEGIN
    -- 1. Enforce explicit UUID input
    IF target_user_id IS NULL OR target_user_id = '00000000-0000-0000-0000-000000000000'::UUID THEN
        RAISE EXCEPTION 'Setup required: Please set "target_user_id" to the exact UUID of the user created in Supabase Authentication dashboard.';
    END IF;

    -- 2. Verify target user exists in auth.users matching BOTH UID and email
    SELECT id, email, created_at 
    INTO v_auth_user
    FROM auth.users 
    WHERE id = target_user_id AND LOWER(TRIM(email)) = LOWER(TRIM(target_email));

    IF v_auth_user.id IS NULL THEN
        RAISE EXCEPTION 'Verification failed: No auth.users record found matching BOTH UUID % and email "%". Please verify the UID in Supabase Dashboard.', target_user_id, target_email;
    END IF;

    -- 3. Safeguard: Ensure this account has never submitted teacher registration requests
    SELECT EXISTS (
        SELECT 1 FROM public.teacher_registration_requests 
        WHERE user_id = target_user_id
    ) INTO v_has_teacher_requests;

    IF v_has_teacher_requests THEN
        RAISE EXCEPTION 'Security conflict: User % has teacher registration requests. Cannot promote a teacher applicant account to administrator.', target_email;
    END IF;

    -- 4. Check existing profile record
    SELECT role, is_approved, full_name
    INTO v_existing_profile
    FROM public.profiles
    WHERE id = target_user_id;

    IF FOUND THEN
        -- If already admin and approved, no-op notice
        IF v_existing_profile.role = 'admin' AND v_existing_profile.is_approved = TRUE THEN
            RAISE NOTICE 'User "%" (UUID: %) is already an active, approved Administrator.', target_email, target_user_id;
            RETURN;
        END IF;

        -- Safeguard: Do not accidentally promote an active, approved student account
        IF v_existing_profile.role = 'student' AND v_existing_profile.is_approved = TRUE THEN
            RAISE EXCEPTION 'Security safeguard: User "%" is currently an approved active student. Promoting active student accounts via this script is prohibited to prevent accidental account hijacking.', target_email;
        END IF;

        -- Safeguard: Do not accidentally promote an approved teacher account
        IF v_existing_profile.role = 'teacher' THEN
            RAISE EXCEPTION 'Security safeguard: User "%" has a teacher profile. Refusing to promote teacher account to administrator.', target_email;
        END IF;

        -- Safe promotion of unapproved / newly registered account
        UPDATE public.profiles
        SET full_name = target_name,
            role = 'admin'::public.user_role,
            is_approved = TRUE,
            updated_at = TIMEZONE('utc'::TEXT, NOW())
        WHERE id = target_user_id;

        RAISE NOTICE 'SUCCESS: Existing profile for "%" (UUID: %) updated to Administrator "%".', target_email, target_user_id, target_name;
    ELSE
        -- Profile does not exist yet; insert verified admin profile directly
        INSERT INTO public.profiles (
            id,
            full_name,
            role,
            is_approved,
            created_at,
            updated_at
        )
        VALUES (
            target_user_id,
            target_name,
            'admin'::public.user_role,
            TRUE,
            TIMEZONE('utc'::TEXT, NOW()),
            TIMEZONE('utc'::TEXT, NOW())
        );

        RAISE NOTICE 'SUCCESS: User "%" (UUID: %) provisioned as new Administrator "%".', target_email, target_user_id, target_name;
    END IF;
END $$;
