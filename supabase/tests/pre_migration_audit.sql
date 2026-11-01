-- ==============================================================================
-- AttendAI — Pre-Migration Database Audit Script (READ-ONLY)
--
-- Instructions:
-- Run this script in the Supabase SQL Editor BEFORE applying migrations.
-- It performs comprehensive read-only inspections without modifying data.
-- ==============================================================================

-- 1. All existing Auth users and their registration role metadata
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' AS meta_full_name,
    u.raw_user_meta_data->>'role' AS meta_role,
    u.raw_user_meta_data->>'requested_role' AS meta_requested_role,
    u.created_at,
    CASE 
        WHEN LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'requested_role', u.raw_user_meta_data->>'role', ''))) = 'teacher' 
            THEN 'Clear Teacher Applicant'
        WHEN LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'role', ''))) = 'student' 
             AND LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'requested_role', ''))) != 'teacher'
            THEN 'Clear Student'
        WHEN u.raw_user_meta_data IS NULL OR u.raw_user_meta_data = '{}'::jsonb 
            THEN 'Ambiguous (Missing Metadata)'
        ELSE 'Ambiguous (Unverified Metadata)'
    END AS user_classification
FROM auth.users u
ORDER BY u.created_at ASC;

-- 2. Auth users missing profile records in public.profiles
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' AS full_name,
    u.raw_user_meta_data->>'requested_role' AS requested_role,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 3. Profiles with conflicting role metadata in auth.users
SELECT 
    p.id,
    p.full_name,
    p.role AS db_profile_role,
    p.is_approved AS db_is_approved,
    u.raw_user_meta_data->>'role' AS meta_role,
    u.raw_user_meta_data->>'requested_role' AS meta_requested_role
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE (p.role = 'student' AND LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'requested_role', ''))) = 'teacher')
   OR (p.role = 'teacher' AND LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'role', ''))) = 'student' AND LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'requested_role', ''))) != 'teacher');

-- 4. Teacher profiles with pending requests
SELECT 
    p.id,
    p.full_name,
    p.role,
    p.is_approved,
    trr.status AS request_status,
    trr.created_at AS requested_at
FROM public.profiles p
JOIN public.teacher_registration_requests trr ON trr.user_id = p.id
WHERE p.role = 'teacher' AND trr.status = 'pending';

-- 5. Approved Teacher profiles with pending requests (Anomaly check)
SELECT 
    p.id,
    p.full_name,
    p.role,
    p.is_approved,
    trr.status AS request_status
FROM public.profiles p
JOIN public.teacher_registration_requests trr ON trr.user_id = p.id
WHERE p.role = 'teacher' AND p.is_approved = TRUE AND trr.status = 'pending';

-- 6. Teacher profiles with rejected requests
SELECT 
    p.id,
    p.full_name,
    p.role,
    p.is_approved,
    trr.status AS request_status,
    trr.rejection_reason
FROM public.profiles p
JOIN public.teacher_registration_requests trr ON trr.user_id = p.id
WHERE trr.status = 'rejected';

-- 7. Student profiles with pending or approved Teacher requests
SELECT 
    p.id,
    p.full_name,
    p.role,
    p.is_approved,
    trr.status AS request_status
FROM public.profiles p
JOIN public.teacher_registration_requests trr ON trr.user_id = p.id
WHERE p.role = 'student' AND trr.status IN ('pending', 'approved');

-- 8. Teacher profiles without request records (Anomaly check)
SELECT 
    p.id,
    p.full_name,
    p.role,
    p.is_approved
FROM public.profiles p
LEFT JOIN public.teacher_registration_requests trr ON trr.user_id = p.id
WHERE p.role = 'teacher' AND trr.id IS NULL;

-- 9. Teacher requests without corresponding profile records (Anomaly check)
SELECT 
    trr.id,
    trr.user_id,
    trr.status,
    trr.created_at
FROM public.teacher_registration_requests trr
LEFT JOIN public.profiles p ON p.id = trr.user_id
WHERE p.id IS NULL;

-- 10. Duplicate pending requests (Should be 0)
SELECT 
    user_id, 
    COUNT(*) AS pending_count
FROM public.teacher_registration_requests
WHERE status = 'pending'
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 11. Existing Database Roles, Grants, and RLS Policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'teacher_registration_requests');

-- 12. Function execution privileges on Admin functions
SELECT 
    p.proname, 
    pg_get_userbyid(p.proowner) AS owner,
    p.prosecdef AS is_security_definer,
    p.proacl AS access_control_list
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname IN ('admin_approve_teacher', 'admin_reject_teacher', 'handle_new_user');

-- 13. Enum definitions and table structure
SELECT 
    t.typname, 
    e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'teacher_registration_requests')
ORDER BY table_name, ordinal_position;
