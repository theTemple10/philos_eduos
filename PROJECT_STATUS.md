# PROJECT STATUS — Philos EduOS

**Last Updated:** 2026-08-25
**Overall Status:** Build passes — ready for Supabase provisioning and deployment

---

## Migration Summary

Migrated from Convex (serverless backend + auth + freebuff.com email OTP) to:

| Layer | Before | After |
|-------|--------|-------|
| Framework | Vite + React Router v7 | Next.js 15 (App Router) |
| Backend | Convex (DB + functions + HTTP) | Next.js API routes + Drizzle ORM |
| Database | Convex (proprietary) | PostgreSQL via Supabase |
| Auth | Convex Auth + freebuff.com OTP | Supabase Auth (native email OTP) |
| Email | freebuff.com | Resend (100/day free) |
| Deployment | Vercel (frontend) + Convex (backend) | Vercel (full-stack) + Supabase (DB + Auth) |

---

## What's Done

### Core Infrastructure
- Next.js 15 App Router with TypeScript
- Drizzle ORM schema (19 tables, UUID PKs, PostgreSQL types)
- Supabase client setup (browser, server, middleware)
- Auth middleware (session refresh, route protection)
- Resend email integration
- Providers extracted for client/server boundary (`src/app/providers.tsx`)

### API Routes (16 endpoints)
`/api/users`, `/api/tenants`, `/api/classes`, `/api/students`, `/api/teachers`, `/api/attendance`, `/api/grades`, `/api/announcements`, `/api/materials`, `/api/messages`, `/api/tasks`, `/api/transportation`, `/api/payments`, `/api/report-comments`, `/api/auth/callback`

All routes use shared auth helpers from `src/lib/api/auth.ts` for role-based access control.

### Client-Side Hooks
15+ data hooks (`src/hooks/use-*.ts`) replacing Convex `useQuery`/`useMutation`/`useAction` patterns with fetch-based + Next.js API routes.

### Dashboards (6 roles)
- AdminDashboard (super_admin)
- SchoolAdminDashboard (admin)
- TeacherDashboard (teacher)
- StudentDashboard (student)
- ParentDashboard (parent)
- StaffDashboard (staff)

All migrated from Convex to Supabase/Fetch patterns. `react-router` imports replaced with `next/navigation`.

### Auth
- Supabase email OTP (replaces Convex Auth + freebuff.com)
- `/auth` page with OTP flow
- `useAuth()` hook for client-side auth state
- `requireAuth()`, `requireAdmin()`, etc. for API routes

### Pages
- Landing page (`/`)
- Auth page (`/auth`) — email OTP sign-in/sign-up
- Dashboard (`/dashboard`) — role-based routing
- 404 page

---

## Build Status

- **Compilation**: Passes
- **Lint**: Passes (all strict rules configured)
- **TypeScript**: Passes
- **Static Generation**: Passes (force-dynamic for Supabase-dependent pages)

---

## To Deploy

### 1. Create Supabase project
- Get `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### 2. Push database schema
```bash
npm run db:push
```

### 3. Set up Resend
- Get `RESEND_API_KEY` from resend.com

### 4. Configure Vercel
- Add all env vars to Vercel project settings
- Deploy

### 5. Bootstrap super_admin
- Sign up → find user in Supabase `users` table → set `role` to `super_admin`

See `DEPLOY.md` for detailed instructions.

---

## Known Issues / Future Work

- 12 npm vulnerabilities (4 moderate, 7 high) — not yet addressed
- No pagination on queries (all load full result sets)
- N+1 query optimization needed in payment/transportation queries
- Settings sections not yet implemented (planned)
- Notifications table wired to schema but not UI
- No delete cascade for related records

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│  Next.js 15 + React 19 + TypeScript + Tailwind v4  │
│  Shadcn UI + Framer Motion + Recharts               │
│                                                     │
│  Routes:                                             │
│  / → Landing page                                   │
│  /auth → Email OTP sign-in/sign-up                  │
│  /dashboard → Role-based dashboard router            │
│    ├── super_admin → AdminDashboard                 │
│    ├── admin → SchoolAdminDashboard                 │
│    ├── teacher → TeacherDashboard                   │
│    ├── student → StudentDashboard                   │
│    ├── parent → ParentDashboard                     │
│    └── staff → StaffDashboard                       │
│                                                     │
│  /api/* → 16 API route handlers                     │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────┐
│                SUPABASE                              │
│  PostgreSQL (19 tables) + Auth (email OTP) + Storage │
│  Drizzle ORM for schema management                  │
└─────────────────────────────────────────────────────┘
```

## Role-Based Access

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| super_admin | Manage all tenants/users platform-wide | Access school-specific data |
| admin (school) | Full CRUD for students/teachers/classes/fees/invites | Grant super_admin |
| teacher | Mark attendance, enter grades, draft AI comments, upload materials | Manage users or fees |
| student | View own grades/attendance/materials, send messages | Modify any data |
| parent | View children's data, pay fees, send messages | Modify academic data |
| staff | Manage tasks, view announcements, send messages | Manage students/grades |
