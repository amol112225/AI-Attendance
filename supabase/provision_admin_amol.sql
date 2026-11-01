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
--
-- SETUP INSTRUCTIONS FOR SUPABASE ADMINISTRATOR:
--
-- Step 1 (Supabase Dashboard):
--   Go to Authentication -> Users -> Click "Add User" -> "Create User"
--   Enter:
--     Email: admin.amol@attendai.edu (or your configured VITE_DEMO_ADMIN_EMAIL)
--     Password: <Choose a strong temporary development password>
--     Confirm the user email according to your project authentication policies.
--
-- Step 2 (Supabase SQL Editor):
--   Run the block below in the SQL Editor to provision the user's profile with
--   Administrator role ('admin'::public.user_role) and verified status (is_approved = TRUE).
-- ==============================================================================

DO $$
DECLARE
    target_user_id UUID;
    -- Change this email if you configured a different VITE_DEMO_ADMIN_EMAIL in frontend/.env
    admin_email TEXT := 'admin.amol@attendai.edu';
BEGIN
    -- Locate the user created in Step 1
    SELECT id INTO target_user_id FROM auth.users WHERE email = admin_email;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User "%" not found in auth.users. Please create the user in the Supabase Authentication dashboard first.', admin_email;
    END IF;

    -- Upsert/Update the profile with Administrator privileges
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
        'AMOL',
        'admin'::public.user_role,
        TRUE,
        TIMEZONE('utc'::TEXT, NOW()),
        TIMEZONE('utc'::TEXT, NOW())
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = 'AMOL',
        role = 'admin'::public.user_role,
        is_approved = TRUE,
        updated_at = TIMEZONE('utc'::TEXT, NOW());

    RAISE NOTICE 'SUCCESS: User "%" (UUID: %) has been provisioned as Administrator "AMOL".', admin_email, target_user_id;
END $$;
