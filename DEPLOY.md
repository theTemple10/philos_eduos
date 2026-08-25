# Deploying Philos EduOS

## Prerequisites

- Node.js >= 20
- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account (free tier works)
- A [Resend](https://resend.com) account (free tier: 100 emails/day)

Optional: [Paystack](https://paystack.com) for payments, [Anthropic](https://console.anthropic.com) for AI report comments.

---

## 1. Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Note your **Project URL** and **Anon Key** from Settings → API.
3. Go to Settings → Database → Connection string → **URI** and copy the pooler URL (port 6543).
   Replace `[YOUR-PASSWORD]` with your database password.
4. Go to Authentication → Providers → **Email** and ensure it's enabled (OTP is on by default).

## 2. Set Up the Database

```bash
# Copy env vars
cp .env.example .env.local

# Fill in .env.local with your Supabase credentials:
#   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
#   DATABASE_URL=postgresql://postgres.xxxx:xxxx@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Push the Drizzle schema to your Supabase Postgres database
npm run db:push
```

This creates all 19 tables (users, tenants, students, teachers, classes, attendance, grades, etc.).

## 3. Set Up Resend (Email OTP)

1. Sign up at [resend.com](https://resend.com) and create an API key.
2. Add `RESEND_API_KEY=re_xxxxx` to `.env.local`.

Note: Supabase Auth handles sending OTP codes natively. Resend is used for transactional emails (announcements, notifications). If you just want to test, Supabase's built-in email works out of the box.

## 4. Deploy to Vercel

1. Push this repo to GitHub.
2. In [vercel.com/new](https://vercel.com/new), import the repository.
3. Vercel auto-detects Next.js. Framework preset: **Next.js**.
4. Add environment variables in Vercel project settings:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `DATABASE_URL` | `postgresql://postgres.xxxx:...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (from Supabase Settings → API → service_role) |
| `RESEND_API_KEY` | `re_xxxxx` |
| `SITE_URL` | `https://your-app.vercel.app` |
| `PAYSTACK_SECRET_KEY` | `sk_test_xxxxx` (if using payments) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (if using AI comments) |

5. Deploy. Every push to the default branch triggers automatic redeployment.

## 5. Configure Supabase Auth Redirects

In your Supabase dashboard → Authentication → URL Configuration:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: Add `https://your-app.vercel.app/auth/callback`

## 6. Bootstrap the First Admin

The `super_admin` role cannot be granted through the app. Set it manually:

1. After signing up, go to the Supabase dashboard → Table Editor → `users` table.
2. Find your user row and set `role` to `super_admin`.

You can now manage tenants and users from the Admin Dashboard.

## 7. Paystack Webhook (Optional)

If using payments:
1. Set your Paystack webhook URL to `https://your-app.vercel.app/api/payments`
2. Set `PAYSTACK_SECRET_KEY` in both `.env.local` and Vercel env vars.

---

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your credentials
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Custom Domain

1. Add the domain in Vercel project settings → Domains.
2. Update DNS as instructed by Vercel.
3. Update `SITE_URL` in Vercel env vars.
4. Update Supabase Auth redirect URLs.

## Troubleshooting

- **Build fails with Supabase errors**: Ensure `.env.local` exists with valid credentials. The app needs env vars at build time for type checking.
- **OTP emails not arriving**: Check Supabase Auth → Email provider is enabled. For production, configure a custom SMTP provider in Supabase.
- **Database connection errors**: Use the pooler URL (port 6543), not the direct connection (port 5432). The pooler is designed for serverless environments.
- **`npm run db:push` fails**: Verify `DATABASE_URL` uses the correct password and pooler endpoint.
