# AttendAI — Database Migrations, Security & Operational Architecture

This document details the database migrations, Row Level Security (RLS) policies, administrative functions, verification suites, and operational procedures for AttendAI.

---

## 1. Schema Overview & Administrative Approval Policy

The `public.profiles` table references Supabase's `auth.users(id)` and manages user identities, system roles, and administrative approval:

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key | References `auth.users(id)` with `ON DELETE CASCADE`. |
| `full_name` | `text` | Required | Trimmed non-empty full name of the student or teacher. |
| `role` | `user_role` (`student`, `teacher`, `admin`) | `'student'` | Application authorization role. |
| `is_approved` | `boolean` | `false` | Administrative approval flag. Default is `false`. |
| `created_at` | `timestamptz` | `NOW()` | Record creation timestamp. |
| `updated_at` | `timestamptz` | `NOW()` | Automatically refreshed on update via trigger. |

### Administrative Approval Security Model
In accordance with our **Administrative Approval** security model, Teacher privileges and elevated roles are never granted directly from client metadata:
1. Students who register publicly are created with `role = 'student'` and automatically approved (`is_approved = true`).
2. Teachers who register receive `role = 'teacher'` with `is_approved = false` and a pending entry in `teacher_registration_requests`.
3. Unverified or ambiguous registrations are quarantined with `is_approved = false`.
4. Administrator accounts can never be created through public registration; they require explicit provisioning.

---

## 2. Migration History & Architecture

The database migrations in `supabase/migrations/` track the architectural evolution of AttendAI:

| Migration File | Description |
|---|---|
| `20261030000000_profiles_roles_rls.sql` | Establishes `public.user_role` ENUM (`student`, `teacher`, `admin`), `public.profiles` table, automated profile creation trigger on `auth.users`, and base RLS policies. |
| `20261030010000_fix_profile_update_rls.sql` | Replaces recursive RLS update policy with non-recursive check (`auth.uid() = id`), tightens column grants, and introduces privilege escalation protection trigger. |
| `20261030020000_teacher_registration_requests.sql` | Introduces `public.teacher_registration_requests` table, status constraints (`pending`, `approved`, `rejected`), `rejection_reason` column, partial unique index, and request anti-tampering trigger. |
| `20261031000000_fix_student_approval_and_admin_role.sql` | Implements auto-approval for registered students (`is_approved = true`), administrative approval functions (`admin_approve_teacher`, `admin_reject_teacher`), and initial backfill. |
| `20261101000000_finalize_teacher_approval_and_security.sql` | **Final Security Forward Migration**: Corrects triggers to `SECURITY INVOKER`, hardens caller checks on admin functions, validates target status (rejects modifying admins, approved teachers, or active students), validates pending request uniqueness, revokes client insert on requests, executes audited reconciled backfill, and signals schema reload (`NOTIFY pgrst, 'reload schema'`). |

---

## 3. Migration Execution Strategies

### Strategy A: Fresh Database (New Project or Staging Environment)
When setting up a completely new Supabase instance where application tables do not exist yet:

1. **Step 1 (Pre-Migration Audit)**:
   Run [`supabase/tests/pre_migration_audit.sql`](./tests/pre_migration_audit.sql) in Supabase SQL Editor.
   *Confirms a clean slate without table or constraint errors.*
2. **Step 2 (Apply Migrations in Sequential Order)**:
   In the Supabase SQL Editor (or via `supabase db push`), execute each file in chronological sequence:
   - `supabase/migrations/20261030000000_profiles_roles_rls.sql`
   - `supabase/migrations/20261030010000_fix_profile_update_rls.sql`
   - `supabase/migrations/20261030020000_teacher_registration_requests.sql`
   - `supabase/migrations/20261031000000_fix_student_approval_and_admin_role.sql`
   - `supabase/migrations/20261101000000_finalize_teacher_approval_and_security.sql`
3. **Step 3 (Post-Migration Verification)**:
   Run [`supabase/tests/post_migration_verification.sql`](./tests/post_migration_verification.sql).
   *All 28 automated checks must report status `PASS`.*
4. **Step 4 (Admin Provisioning)**:
   Follow the instructions in [`supabase/provision_admin_amol.sql`](./provision_admin_amol.sql) to provision the verified administrator.

---

### Strategy B: Existing Database (Upgrading an Instance with Migrations 1–4 Already Applied)
When upgrading an existing database where Migrations 1–4 are already in place:

1. **Step 1 (Pre-Migration Audit & Anomaly Detection)**:
   Run [`supabase/tests/pre_migration_audit.sql`](./tests/pre_migration_audit.sql).
   *Review Query 2 for suspicious metadata claims, and Query 7 for any existing account anomalies.*
2. **Step 2 (Apply Forward Migration 5)**:
   Run [`supabase/migrations/20261101000000_finalize_teacher_approval_and_security.sql`](./migrations/20261101000000_finalize_teacher_approval_and_security.sql).
   *Migration 5 is idempotent; it replaces trigger functions, hardens RLS policies, locks admin functions, backfills missing accounts without altering existing records, and reloads the PostgREST schema cache.*
3. **Step 3 (Post-Migration Verification)**:
   Run [`supabase/tests/post_migration_verification.sql`](./tests/post_migration_verification.sql).
   *Confirm all 28 checks pass.*
4. **Step 4 (Manual Account Repairs, if needed)**:
   If the verification script identifies historical anomalies, apply the targeted repair blocks in [`supabase/manual_repairs.sql`](./manual_repairs.sql).
5. **Step 5 (Admin Provisioning)**:
   Run [`supabase/provision_admin_amol.sql`](./provision_admin_amol.sql) with explicit UUID verification.

---

## 4. How to Approve a Test Teacher Account Securely

In accordance with our **Administrative Approval** security model, Teacher privileges are granted only by authorized administrators:

### Method 1: Using the Callable Admin RPC Function (Recommended)
An authenticated Administrator can invoke:
```sql
SELECT public.admin_approve_teacher('<TARGET_USER_UUID>');
```
This safely locks the user's profile and pending request, verifies uniqueness, updates the request to `'approved'`, and sets the profile to `role = 'teacher'` with `is_approved = true`.

To reject a pending applicant with an optional reason:
```sql
SELECT public.admin_reject_teacher(
    '<TARGET_USER_UUID>', 
    'Incomplete teaching credential documentation submitted.'
);
```

### Method 2: Manual Database Synchronization
If performing manual testing in the Supabase Dashboard:
1. Locate the row in `public.teacher_registration_requests` for the user and change `status` from `'pending'` to `'approved'`.
2. Locate the row in `public.profiles` for the user and change `role` to `'teacher'` and `is_approved` to `true`.
3. When the user logs in, `AuthContext` will load their approved faculty status.

---

## 5. Security Safeguards

- **Row Level Security (RLS)**: Enforced on both `profiles` and `teacher_registration_requests`. Users can view only their own records.
- **Client Mutation Revocation**: Direct `INSERT`, `UPDATE`, and `DELETE` on `teacher_registration_requests` are revoked for client roles.
- **Invoker Anti-Tampering Triggers**: Direct client attempts to alter roles or approval flags fail with PostgreSQL security exceptions.
- **Admin Function Fail-Closed Gates**: Non-admin callers, unauthenticated callers, or calls targeting existing admins, approved teachers, or active students are immediately rejected.
