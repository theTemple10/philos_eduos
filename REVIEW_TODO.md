# Review To-Do: Philos EduOS

This is a prioritized working list from the initial code review. Items marked **Fixed on this branch** are implemented here; the remaining items need a focused change and regression coverage.

## P1 — Correctness and account safety

- [ ] **Make invite redemption atomic.** In src/app/api/users/route.ts, membership is assigned and the invite marked used before validating/creating the student or teacher profile. A stale or cross-school classId, a database error, or concurrent redemption can leave an invite consumed and an incomplete account. Validate profile references first, then perform the membership/profile/invite changes in a database transaction; condition the invite update on usedAt IS NULL and confirm one row was changed.
- [ ] **Restrict payment initialization to the invoice owner.** handleInitializePayment in src/app/api/payments/route.ts checks that the invoice belongs to the tenant, but does not check that the signed-in parent/student is associated with that invoice. A tenant member who knows an invoice ID can start payment for another family. Permit only the linked parent/student (and explicitly chosen school roles), with an ownership check before creating a pending payment.
- [ ] **Make payment settlement trustworthy and idempotent.** handleVerifyPayment trusts a successful Paystack status without comparing returned amount/currency against the pending payment. It reads then updates payment and invoice separately, so concurrent verification can apply the same payment twice. Validate reference, amount, currency, and invoice state; settle atomically with a conditional pending-to-completed update. The route currently expects an authenticated app request with an action and does not implement Paystack webhook signatures; add signature-verified webhook handling if automatic webhook updates are required.
- [ ] **Use Supabase session state for dashboard protection.** src/middleware.ts checks a literal sb-access-token cookie even though the SSR client manages project-scoped auth cookies. Protect the route using the verified session from updateSession/auth.getUser, rather than assuming a cookie name. Confirm logged-in users and expired sessions behave correctly.
- [ ] **Make the auth callback same-origin and point failures at the real auth page.** src/app/api/auth/callback/route.ts redirects to the caller-provided next URL without checking its origin, and its error paths target /auth/login although the page is /auth. Allow only local return paths and redirect errors to /auth with a usable error state.

## P2 — Data integrity and scale

- [ ] **Add database constraints deliberately.** The Drizzle schema has no foreign-key declarations and relies on application checks; add foreign keys and appropriate uniqueness constraints (for example tenant-scoped student IDs and one attendance row per student/date) with a migration and an explicit plan for existing orphaned/duplicate data. Add deletion behavior only after choosing the product semantics for historical grades, invoices, and payments.
- [ ] **Paginate list endpoints and batch related reads.** Several handlers return all rows, and payment/transportation code loops over student IDs and queries each one. Introduce bounded pagination and replace per-student query loops with set-based queries.
- [ ] **Use a consistent database timestamp type.** Dates/timestamps are represented as text or millisecond real values across tables. Standardize on PostgreSQL timestamp/date types and plan a data migration before changing existing columns.
- [ ] **Run the supported Node version locally.** The current shell is Node 18.19, below package.json's Node 22+ requirement. Upgrade the local runtime and keep CI/Vercel on Node 22 or newer.
- [ ] **Add route and workflow regression coverage.** Prioritize tenant isolation, role checks, invite races/partial failures, and duplicate/out-of-order payment callbacks.

## P3 — Product completeness and maintainability

- [ ] Finish school settings and notification UI; notifications exists in the schema but is not surfaced as an implemented workflow.
- [ ] Reconcile the landing page's “every feature works today” statement with actual deployment requirements and optional integrations.
- [ ] Decide whether to wire `src/lib/email/resend.ts` into an explicit email workflow or remove it; currently it is unused, while the sign-in page sends OTP through Supabase Auth.
- [ ] Review remaining legacy auth helpers and remove duplicate auth paths once callers are migrated.

## Fixed on this branch

- **Drizzle CLI environment loading:** drizzle.config.ts now loads Next.js environment files, including .env.local, and gives a direct setup error when DATABASE_URL is absent. The reported command ran Drizzle Kit without that variable in its process environment; the local file contains a non-empty DATABASE_URL, so this addresses the observed mismatch.
- **Runtime database setup error:** src/lib/db/index.ts now reports a clear message instead of passing an undefined URL into postgres-js.
- **Supabase pooler compatibility:** postgres-js now disables prepared statements, which are unsupported by Supabase's transaction pooler on port 6543.
