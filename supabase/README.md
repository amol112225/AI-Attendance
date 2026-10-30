# AttendAI — Database Profiles, Roles & Row Level Security (RLS)

This document explains the architecture, security safeguards, and manual execution instructions for the `profiles` table, automated trigger, and RLS policies defined in `supabase/migrations/20261030000000_profiles_roles_rls.sql`.

---

## 1. Schema Overview

The `public.profiles` table references Supabase's `auth.users(id)` and manages user identities, system roles, and administrative approval:

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key | References `auth.users(id)` with `ON DELETE CASCADE`. |
| `full_name` | `text` | Required | Trimmed non-empty full name of the student or teacher. |
| `role` | `user_role` (`student`, `teacher`, `admin`) | `'student'` | Application authorization role. |
| `is_approved` | `boolean` | `false` | Administrative approval flag. Default is `false`. |
| `created_at` | `timestamptz` | `NOW()` | Record creation timestamp. |
| `updated_at` | `timestamptz` | `NOW()` | Automatically refreshed on update via trigger. |

---

## 2. Automated Profile Creation Trigger

When a user signs up via `supabase.auth.signUp()`, an event occurs on `auth.users`:

1. The `public.handle_new_user()` trigger function executes automatically with `SECURITY DEFINER` and `SET search_path = public, pg_temp`.
2. It extracts `full_name` from `raw_user_meta_data->>'full_name'`. If missing or whitespace, it safely falls back to the user's email prefix.
3. It unconditionally sets `role = 'student'` and `is_approved = false`. **User-supplied metadata cannot influence role or approval.**
4. If the trigger fails for any reason, the transaction is rolled back, preventing orphaned authentication records.

---

## 3. Row Level Security (RLS) Policies

Row Level Security is enabled on `public.profiles`:

1. **Read Access (`SELECT`)**: Authenticated users can only read their own profile row (`auth.uid() = id`).
2. **Update Access (`UPDATE`)**:
   - Authenticated users can update their own row, but only the `full_name` column (`GRANT UPDATE(full_name)`).
   - The `trigger_prevent_profile_privilege_escalation` trigger raises an immediate PostgreSQL exception if any user session attempts to alter `role`, `is_approved`, `id`, or `created_at`.
3. **Insert Access (`INSERT`)**: No INSERT policy is granted to `authenticated` or `anon`. Profiles can **only** be created by the trusted `on_auth_user_created` trigger.
4. **Delete Access (`DELETE`)**: No DELETE policy is granted to users. Deletions cascade when an account is removed from `auth.users`.
5. **Anonymous Access (`anon`)**: All privileges revoked.

---

## 4. How to Apply the Migrations

### Option A: Using the Supabase Dashboard SQL Editor (Recommended for Cloud Projects)
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your AttendAI project (`mcxrdvsejyragcjufhlx`).
3. Click on the **SQL Editor** tab in the left navigation sidebar.
4. If you have not yet applied the initial migration, run:
   [`supabase/migrations/20261030000000_profiles_roles_rls.sql`](./migrations/20261030000000_profiles_roles_rls.sql)
5. To apply the non-recursive RLS policy update and privilege escalation trigger fix, run:
   [`supabase/migrations/20261030010000_fix_profile_update_rls.sql`](./migrations/20261030010000_fix_profile_update_rls.sql)
6. Ensure the message states `Success. No rows returned`.

### Option B: Using the Supabase CLI (Local Development)
```bash
supabase db push
```

---

## 5. Security Test Suite

We have provided a comprehensive SQL security verification suite in [`supabase/tests/security_verification.sql`](./tests/security_verification.sql).
Run this script in the Supabase SQL Editor to test:
- Schema and constraint validation
- RLS policy structure
- Trigger execution on user creation
- Role escalation blocking
- Self-approval blocking
- Permitted name updates

---

## 5. How to Verify the Schema and RLS Policies

Run this verification query in the Supabase SQL Editor:

```sql
-- 1. Verify table definition and RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 2. Verify active RLS policies
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 3. Verify triggers attached to auth.users and public.profiles
SELECT tgname, relname 
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname IN ('users', 'profiles');
```

---

## 6. How to Approve a Test Teacher Account Securely

In accordance with our **Administrative Approval** security model, Teacher privileges are never granted from client metadata. To approve a Teacher:

1. Have the user register through the AttendAI registration page (`/register`). They will receive `role: student` and `is_approved: false`.
2. Go to the **Supabase Dashboard** -> **Table Editor** -> **public.profiles**.
3. Locate the row corresponding to the teacher's email address.
4. Change `role` from `student` to `teacher`.
5. Change `is_approved` from `false` to `true`.
6. Click **Save**.
7. When the user logs in or reloads their page, `AuthContext` will immediately load `role = 'teacher'` and `isApproved = true`.

Alternatively, run this SQL query in the SQL Editor:
```sql
UPDATE public.profiles 
SET role = 'teacher', is_approved = true, updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'teacher@attendai.edu');
```

---

## 7. How to Verify Role Tampering Prevention

To verify that ordinary users cannot elevate their role or approve themselves via the client API, execute this test in the browser console while signed in as a normal student:

```javascript
// Test 1: Attempt to elevate role to teacher
const { data, error } = await supabase
  .from('profiles')
  .update({ role: 'teacher' })
  .eq('id', (await supabase.auth.getUser()).data.user.id);

console.log('Role tamper result:', error ? 'Blocked safely: ' + error.message : 'FAILED (tamper succeeded)');

// Test 2: Attempt to self-approve
const { error: approveError } = await supabase
  .from('profiles')
  .update({ is_approved: true })
  .eq('id', (await supabase.auth.getUser()).data.user.id);

console.log('Approve tamper result:', approveError ? 'Blocked safely: ' + approveError.message : 'FAILED (tamper succeeded)');
```
Both queries will fail with PostgreSQL RLS violation / permission denied exceptions.

