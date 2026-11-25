# Deploying Philos EduOS

## Prerequisites

- Node.js >= 22 (matches package.json)
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
# Copy env vars (Drizzle Kit and Next.js both load .env.local)
cp .env.example .env.local

# Fill in .env.local with your Supabase credentials:
#   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
#   DATABASE_URL=postgresql://postgres.xxxx:xxxx@aws-0-us-east-1.pooler.supabase.com:6543/postgres
# Use a Supabase pooler URI. The app disables prepared statements for
# compatibility with transaction pooler connections.

# Push the Drizzle schema to your Supabase Postgres database
npm run db:push
```

This creates all 19 tables (users, tenants, students, teachers, classes, attendance, grades, etc.).

## 3. Configure Sign-in Email

Sign-in is passwordless. `/auth` calls Supabase `signInWithOtp` with
`emailRedirectTo` set to `/api/auth/callback` on the current site.

**With Supabase's built-in mailer (no custom SMTP):**
- The email contains a **link** only. The link completes sign-in when opened
  **in the same browser** that requested it (PKCE).
- Supabase's built-in mailer only delivers reliably to members of your Supabase
  organisation and is limited to a few emails per hour. That's fine for testing,
  but not for real users.
- Email templates can't be edited until custom SMTP is configured.

**With custom SMTP (required before inviting real users, see issue #14):**

1. Supabase → Authentication → **Emails → SMTP Settings** → enable custom SMTP.
   - *Interim (no domain yet):* a dedicated Gmail account with 2-Step
     Verification and an **App password**. Host `smtp.gmail.com`, port `465`,
     username = the Gmail address, password = the app password, sender = the
     same address. Suitable for pilot volumes (~500 emails/day).
   - *With a domain:* Resend (`smtp.resend.com`, port `465`, user `resend`,
     password = API key) after verifying the domain's SPF/DKIM records.
2. Raise **Rate Limits → emails per hour** to fit your expected sign-ins.
3. Authentication → **Emails → Templates**. Use this body for **Magic Link**
   (and adapt it for **Confirm signup**, using `type=signup`):

   ```html
   <h2>Sign in to Philos EduOS</h2>
   <p>Your sign-in code is: <strong>{{ .Token }}</strong></p>
   <p>Or open this link on any device:</p>
   <p><a href="{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=email">Sign in</a></p>
   <p>If you didn't request this, you can ignore this email.</p>
   ```

   The `token_hash` link works across devices, and the code can be typed into
   the sign-in page.

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
| `RESEND_API_KEY` | Optional; currently unused by the sign-in flow |
| `SITE_URL` | `https://your-app.vercel.app` |
| `PAYSTACK_SECRET_KEY` | `sk_test_xxxxx` (if using payments) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (if using AI comments) |

5. Deploy. Every push to the default branch triggers automatic redeployment.

## 5. Configure Supabase Auth Redirects

In your Supabase dashboard → Authentication → **URL Configuration**:
- **Site URL**: `https://your-app.vercel.app` (never leave it as `http://localhost:3000`
  in production, because emails fall back to it).
- **Redirect URLs**: add
  - `https://your-app.vercel.app/**`
  - `http://localhost:3000/**` (local development)
  - `https://*-<your-vercel-team>.vercel.app/**` if you test sign-in on preview deployments

The app sends links to `/api/auth/callback`. If a redirect isn't on the allow
list, Supabase sends the user to the Site URL instead, and middleware forwards
`/?code=…` to the callback as a safety net.

## 6. Bootstrap the First Admin

The `super_admin` role cannot be granted through the app.

1. Sign in once with the platform owner's email. The app creates the profile
   row in `public.users` on first sign-in.
2. In Supabase → **SQL Editor**, run:

   ```sql
   update public.users set role = 'super_admin'
   where email = lower('owner@example.com');
   ```

3. Reload `/dashboard`.

(Planned in RFC #15: a dedicated platform console at `/admin/login` and a
script for this step.)

## 7. Paystack (Optional)

Parents pay invoices through Paystack checkout. Use **test** keys until you are ready to take real money.

1. In the Paystack dashboard → **Settings → API Keys & Webhooks**, copy the
   **Secret key** (`sk_test_…` while testing, `sk_live_…` in production).
2. Set it as `PAYSTACK_SECRET_KEY` in Vercel (and in `.env.local` for local
   work), together with `SITE_URL`. Redeploy.
3. On the same Paystack page, set the **Webhook URL** to
   `https://<your-site>/api/payments/webhook`. Test and live modes have
   separate webhook settings; set the one that matches your key.

### How a payment is confirmed

1. **Pay Now** creates a `pending` payment with a random reference. It then
   sends the parent to Paystack checkout in the same tab.
2. Paystack returns the parent to `/dashboard?reference=…`. The dashboard
   asks the server to verify, and shows the outcome.
3. Independently, Paystack calls the webhook. Its `x-paystack-signature`
   (HMAC SHA-512 of the body with the secret key) must be valid, or it is
   rejected.

Both paths ask Paystack's verify API for the real status, amount and
currency. They settle in one transaction that moves the payment from
`pending` to `completed` only once. Whichever arrives second changes
nothing. If the amount or currency doesn't match the invoice, the payment
becomes `needs_review` and the invoice is left alone for the school to
check.

Only a school admin, or the student's linked parent or the student, can
start, verify or look up a payment.

`PAYSTACK_API_BASE` exists only for tests (pointing at a local stand-in).
Never set it in Vercel.

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
- **Sign-in email not arriving**: Supabase's built-in mailer only delivers to organisation members and is rate-limited. Configure custom SMTP (section 3).
- **Sign-in link opens `localhost`**: the Supabase **Site URL** is still the default. Set it as in section 5, then request a new link (old emails keep the old URL).
- **Link says it expired, or lands back on `/auth`**: links are single-use and short-lived, and with the default template they must be opened in the browser that requested them. Request a new one.
- **Database connection errors**: Use the pooler URL (port 6543), not the direct connection (port 5432). The pooler is designed for serverless environments.
- **`npm run db:push` fails**: Verify `DATABASE_URL` uses the correct password and pooler endpoint.
