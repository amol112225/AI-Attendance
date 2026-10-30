-- ==============================================================================
-- AttendAI Database Migration: Fix Profile UPDATE Policy & Security Audit
-- Milestone 8.5 Security Audit and Verification
--
-- Audit Findings & Fixes:
-- 1. Eliminates Recursive RLS Evaluation:
--    The previous policy in 20261030000000 contained a subquery:
--      AND role = [subquery on public.profiles]
--    When executing an UPDATE with RLS enabled, evaluating a subquery against the
--    same table (public.profiles) invokes the table's SELECT RLS policy.
--    In certain Postgres/Supabase setups, this causes infinite recursion or performance
--    degradation.
--
-- 2. Clean, Non-Recursive RLS Architecture:
--    - The RLS UPDATE policy simply enforces row ownership:
--        USING (auth.uid() = id) WITH CHECK (auth.uid() = id)
--    - Column-level permission controls:
--        GRANT SELECT, UPDATE(full_name) ON public.profiles TO authenticated;
--        REVOKE UPDATE(role, is_approved, id, created_at, updated_at) ...
--      ensures ordinary authenticated users cannot physically modify protected columns.
--    - Defense-in-depth trigger:
--        trigger_prevent_profile_privilege_escalation executes BEFORE UPDATE ON public.profiles.
--        It compares NEW.role IS DISTINCT FROM OLD.role and NEW.is_approved IS DISTINCT FROM OLD.is_approved.
--        Because triggers execute with access to OLD and NEW record values directly,
--        no subquery against public.profiles is needed, completely avoiding recursion!
--
-- 3. Trusted Administrative Operation Support:
--    Administrative actions (e.g. Supabase Dashboard, migrations, trusted service roles)
--    bypass or satisfy the check because the trigger specifically restricts:
--        current_user NOT IN ('postgres', 'supabase_admin')
--        AND NULLIF(current_setting('request.jwt.claim.role', true), '') = 'authenticated'
--    This prevents normal web client sessions from elevating privileges while allowing
--    the Supabase Dashboard / SQL editor / administrative processes to manage roles and approvals.
-- ==============================================================================

-- 1. Redefine the UPDATE RLS policy without table subqueries
DROP POLICY IF EXISTS "Users can update own profile name" ON public.profiles;

CREATE POLICY "Users can update own profile name"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. Strengthen column grants: Authenticated clients may only update full_name
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE(full_name) ON public.profiles TO authenticated;

-- 3. Enhance Privilege Escalation Prevention Trigger
-- Uses OLD vs NEW directly (no subqueries) and cleanly distinguishes
-- client web requests (request.jwt.claim.role = 'authenticated') from administrative sessions.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    jwt_role TEXT;
BEGIN
    -- Extract the JWT role from the current request context (set by PostgREST/Supabase)
    jwt_role := NULLIF(current_setting('request.jwt.claim.role', true), '');

    -- If this update is initiated by a web client authenticated session (or auth.role() = 'authenticated')
    -- and NOT by an internal system/superuser session:
    IF (jwt_role = 'authenticated' OR auth.role() = 'authenticated') 
       AND current_user NOT IN ('postgres', 'supabase_admin') THEN

        -- 1. Prevent Role Elevation / Tampering
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Security violation: Authenticated users cannot alter user role.';
        END IF;

        -- 2. Prevent Self-Approval / Approval Tampering
        IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
            RAISE EXCEPTION 'Security violation: Authenticated users cannot alter approval status.';
        END IF;

        -- 3. Prevent Primary Key Tampering
        IF NEW.id IS DISTINCT FROM OLD.id THEN
            RAISE EXCEPTION 'Security violation: Authenticated users cannot alter profile ID.';
        END IF;

        -- 4. Prevent Timestamp Manipulation
        IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Security violation: Authenticated users cannot alter created_at timestamp.';
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
