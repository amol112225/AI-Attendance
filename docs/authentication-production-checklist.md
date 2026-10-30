# AttendAI — Authentication Production Deployment Checklist

**Milestone 8.12: Authentication Security Audit and Production Readiness**

This document serves as the operational runbook and verification checklist required before deploying AttendAI authentication to staging or production environments.

---

## 1. Required Environment Variables

All frontend environment variables prefixed with `VITE_` are embedded into the client bundle at build time. **Never place private keys, database passwords, or Supabase `service_role` keys in any frontend file.**

| Variable Name | Environment | Purpose | Security Requirement |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Local / Staging / Prod | FastAPI backend base URL | Publicly accessible HTTPS endpoint (or localhost in dev) |
| `VITE_SUPABASE_URL` | Local / Staging / Prod | Supabase Project URL | Must use HTTPS protocol (e.g. `https://<project-ref>.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Local / Staging / Prod | Supabase Anon / Publishable API Key | **Public key only**. Service role keys are strictly prohibited by client guards |

> [!CAUTION]
> If a Supabase `service_role` key is accidentally configured in `VITE_SUPABASE_PUBLISHABLE_KEY`, frontend validation in `config.js` will immediately abort client initialization with a critical security violation.

---

## 2. Required Supabase Auth URL Configuration

Configure the following in the **Supabase Dashboard** under **Authentication** $\rightarrow$ **URL Configuration**:

### Site URL
- **Local Development**: `http://localhost:5173`
- **Staging / Production**: `https://<production-domain>`

### Redirect URLs Whitelist
Ensure every potential authentication callback and recovery path is explicitly whitelisted:
- `http://localhost:5173/reset-password`
- `http://localhost:5173/**`
- `https://<production-domain>/reset-password`
- `https://<production-domain>/**`

---

## 3. Email Confirmation Requirements

Under **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **Email**:
1. **Confirm Email**:
   - For **Production**: Recommended **Enabled**. Unconfirmed users cannot establish sessions.
   - For **Development/Preview**: May be disabled for rapid manual verification.
   - The AttendAI frontend code dynamically supports both modes (`isConfirmationRequired: true` vs immediate session).
2. **Email Templates**:
   - **Confirm signup**: Ensure link directs to `{{ .ConfirmationURL }}`.
   - **Reset Password**: Ensure redirect URL is configured to `{{ .SiteURL }}/reset-password`.

---

## 4. Password Policy Configuration

Under **Authentication** $\rightarrow$ **Security**:
1. **Minimum Password Length**: At least 6 characters (AttendAI client and service layers enforce $\ge 6$).
2. **Password Reuse Policy**: AttendAI's `formatAuthError` handles Supabase's `different from the old password` constraint.
3. **Rate Limiting**: AttendAI's client gracefully maps HTTP 429 and `rate limit` errors to user-friendly messages without disclosing IP or internal quota details.

---

## 5. Required Database Migrations

Apply the following migrations in sequential order using the Supabase CLI (`supabase db push`) or the Supabase SQL Editor:

1. `supabase/migrations/20261030000000_profiles_roles_rls.sql`
   - Defines `user_role` ENUM (`'student'`, `'teacher'`, `'admin'`).
   - Creates `public.profiles` table with foreign key `auth.users(id) ON DELETE CASCADE`.
   - Attaches `handle_new_user()` trigger to `auth.users` to initialize all profiles to `role: 'student'` and `is_approved: false`.
   - Enables RLS on `public.profiles`.
2. `supabase/migrations/20261030010000_fix_profile_update_rls.sql`
   - Eliminates recursive RLS evaluation by decoupling the UPDATE policy into `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`.
   - Restricts authenticated column grants: `GRANT SELECT, UPDATE(full_name) ON public.profiles TO authenticated`.
   - Attaches `prevent_profile_privilege_escalation()` trigger before UPDATE to block client modifications to `role`, `is_approved`, `id`, and timestamps.
3. `supabase/migrations/20261030020000_teacher_registration_requests.sql`
   - Creates `public.teacher_registration_requests` table with status constraint (`'pending'`, `'approved'`, `'rejected'`).
   - Creates partial unique index `uq_teacher_pending_requests` on `(user_id) WHERE status = 'pending'`.
   - Enables RLS; restricts authenticated role to `SELECT` and `INSERT` (status must be `'pending'`). Revokes `UPDATE` and `DELETE`.
   - Attaches `prevent_teacher_request_tampering()` trigger.
   - Enhances `handle_new_user()` to automatically create pending teacher requests when `raw_user_meta_data->>'requested_role' = 'teacher'`.

---

## 6. Database RLS Verification Steps

Before opening the application to end users, execute the verification script:

1. Open **Supabase Dashboard** $\rightarrow$ **SQL Editor**.
2. Run [`supabase/tests/milestone_8_10_verification.sql`](file:///a:/sem%205/AI%20Attendance/supabase/tests/milestone_8_10_verification.sql).
3. Confirm that all 8 automated database security tests pass without exceptions:
   - Test 1: RLS enabled on `profiles` and `teacher_registration_requests`.
   - Test 2: Non-recursive RLS policy architecture.
   - Test 3: Column privilege boundaries (`UPDATE(full_name)` only).
   - Test 4: Default `student` role on `auth.users` insert.
   - Test 5: Teacher intent & duplicate pending request prevention.
   - Test 6: Role escalation attack prevention (4 attacks blocked).
   - Test 7: Cross-user read isolation.
   - Test 8: Administrative workflow execution.

---

## 7. Teacher Approval Procedure

Teachers register via `/register/teacher`. Their profile role remains `student` and `is_approved: false`. To approve a pending Teacher:

### Option A: Via Supabase SQL Editor (Administrative)
```sql
-- 1. Identify pending applicant
SELECT r.id, r.user_id, p.full_name, u.email, r.created_at
FROM public.teacher_registration_requests r
JOIN public.profiles p ON p.id = r.user_id
JOIN auth.users u ON u.id = r.user_id
WHERE r.status = 'pending';

-- 2. Approve applicant request and elevate profile atomically
BEGIN;
  UPDATE public.teacher_registration_requests
  SET status = 'approved', updated_at = NOW()
  WHERE user_id = '<target-user-uuid>';

  UPDATE public.profiles
  SET role = 'teacher'::user_role, is_approved = TRUE, updated_at = NOW()
  WHERE id = '<target-user-uuid>';
COMMIT;
```

### Option B: To Reject a Teacher Request
```sql
UPDATE public.teacher_registration_requests
SET status = 'rejected', updated_at = NOW()
WHERE user_id = '<target-user-uuid>';
```
*(The user retains their account as a Student and can sign in via Student Login, but is denied Faculty Portal access.)*

---

## 8. Admin Account Provisioning Procedure

There is **no public Admin registration route** in AttendAI. Administrator accounts must be manually provisioned:

1. User registers normally as a Student via `/register`.
2. A database administrator promotes the user in the Supabase SQL Editor:
```sql
UPDATE public.profiles
SET role = 'admin'::user_role, is_approved = TRUE, updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@yourinstitution.edu');
```

---

## 9. Pre-Deployment Automated Tests

The following automated test commands must pass cleanly in CI/CD before any deployment:

```bash
# 1. Code quality and syntax linting (0 errors, 0 warnings required)
npm --prefix frontend run lint

# 2. Comprehensive foundation, integration, and security test suite
npm --prefix frontend test

# 3. Production Vite asset compilation
npm --prefix frontend run build
```

---

## 10. Outstanding Risks and Manual Actions

| Risk / Action | Impact | Remediation / Manual Step |
| :--- | :--- | :--- |
| **Live Database Verification** | High | Live SQL execution against the production database must be performed using `milestone_8_10_verification.sql`. |
| **Email Service Quotas** | Medium | Supabase free tier enforces an hourly limit on Auth emails. For production, connect custom SMTP (e.g. SendGrid, Resend, AWS SES) under **Auth** $\rightarrow$ **SMTP Settings**. |
| **Admin UI Dashboard** | Low | Administrative approvals are currently performed via direct SQL or service-role API. An Admin Dashboard is planned for a future milestone. |

