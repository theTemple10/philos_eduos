# Philos EduOS

Multi-tenant school management platform for Nigerian educational institutions.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM
- **Auth**: Supabase Auth (email OTP)
- **Email**: Supabase Auth email OTP (the Resend helper is not currently wired into sign-in)
- **Payments**: Paystack
- **AI**: Anthropic Claude via `@anthropic-ai/sdk` (Claude Opus 5.5 drafts report comments; teachers approve them)
- **Deployment**: Vercel + Supabase

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # 16 API route handlers
│   ├── auth/               # Auth page (Supabase OTP)
│   ├── dashboard/          # Dashboard pages
│   └── layout.tsx          # Root layout with providers
├── components/
│   ├── dashboards/         # Role-based dashboards
│   ├── ui/                 # Shadcn primitives
│   └── *.tsx               # Shared components (DashboardRouter, etc.)
├── hooks/                  # Client-side data fetching hooks
├── lib/
│   ├── api/                # Server-side auth helpers
│   ├── db/                 # Drizzle schema + connection
│   ├── email/              # Resend integration
│   └── supabase/           # Supabase client setup
└── middleware.ts           # Auth session refresh + route protection
```

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase, Resend, etc. credentials

# 3. Push the database schema to Supabase
npm run db:push

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Drizzle schema to Supabase |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Dependency Overrides

`package.json` contains `overrides` that patch security advisories in
transitive dependencies (issue #20). Remove an override only when the parent
package ships the fix itself; then check `npm audit` still reports no issues.

| Override | Why |
|---|---|
| `next` → `postcss ^8.5.26` | Next 15 pins `postcss@8.4.31` (XSS and source-map file-disclosure advisories). The build output is byte-identical with the patched version. Drop when upgrading to a Next release that bundles a fixed PostCSS. |
| `minimatch@3` → `brace-expansion 1.1.21` | ESLint's `minimatch@3` pulls `brace-expansion` ≤1.1.20 (CPU denial-of-service advisories). Development only. |
| `standardwebhooks` → `1.1.1` | `@anthropic-ai/sdk` 1.8.0 accepts `^1.0.0`, which resolved to 1.3.0, published under 14 days before install. We only install versions at least two weeks old. Drop once 1.3.x is older than that (any time after 2026-12-01). |

Known and accepted: `drizzle-kit` (development only) bundles an old `esbuild`
with a dev-server advisory. drizzle-kit never starts that server, and npm's
suggested "fix" is a downgrade to an older drizzle-kit.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Supabase pooler) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (API routes) |
| `RESEND_API_KEY` | No | Resend helper key; current OTP flow sends through Supabase Auth |
| `PAYSTACK_SECRET_KEY` | No | Paystack secret key for payments |
| `ANTHROPIC_API_KEY` | No | Anthropic API key for AI report comments |
| `SITE_URL` | Yes | Public site URL (for Paystack redirects) |

## Roles

| Role | Capabilities |
|------|-------------|
| `super_admin` | Platform-wide tenant & user management |
| `admin` | School admin: students, teachers, classes, fees, invites |
| `teacher` | Attendance, grades, materials, AI comments |
| `student` | View own grades, attendance, materials, messages |
| `parent` | View children's data, pay fees, messages |
| `staff` | Tasks, announcements, messages |

## First-Run Flow

1. Open the app and sign in with your email (OTP verification)
2. Create a school (you become its admin) or redeem an invite
3. Staff, student, and parent accounts are created via invites from the School Admin dashboard

## License

Private — Philos EduOS
