# Running and Deploying Philos EduOS

## Prerequisites

- **Node.js >= 20.19** (Vite requires it; Node 22 LTS recommended). Check with `node -v`.
- A [Convex](https://convex.dev) account (free tier is enough to start).
- Optional: an [Anthropic](https://console.anthropic.com) API key (AI report comments) and a [Paystack](https://paystack.com) account (fee collection).

## Run locally

```bash
# 1. Upgrade Node to >= 20.19 (nvm install 22 && nvm use 22), then:

# 2. Fresh install (fixes the missing @tailwindcss/oxide native binding):
rm -rf node_modules package-lock.json && npm install

# 3. Start the Convex backend (local dev server, auto-deploys your code):
npx convex dev

# 4. In a second terminal, run the frontend:
npm run dev
```

Convex dev mode provides a local backend and a dashboard at `localhost:8181`.

**First-run flow:**
1. Open the app, click **Get Started**, and sign up with your email (one-time OTP).
2. The onboarding screen lets you **create a school** (you become its admin) or **redeem an invite**.
3. Explore each role's dashboard — staff/student/parent accounts are created via invites from the School Admin dashboard.

For local testing of AI report comments, set `ANTHROPIC_API_KEY` in the Convex dev dashboard's environment variables.

## Deploy for general access

The app has two parts:
- **Backend**: Convex (serverless data + auth + webhooks + AI actions).
- **Frontend**: a static site (Vite build) — deploy to Vercel, Netlify, or Cloudflare Pages.

### 1. Backend — Convex

```bash
npx convex login
npx convex deploy   # pushes schema + all functions; responds with your deployment URL
```

You'll get a URL like `https://joyful-lion-1234.convex.cloud`.

Then set environment variables in the Convex dashboard (`Deployment Settings → Environment Variables`):

| Variable             | Required | Purpose                                      |
| -------------------- | -------- | -------------------------------------------- |
| `ANTHROPIC_API_KEY`  | no       | AI-assisted report comments                  |
| `PAYSTACK_SECRET_KEY`| no       | Fee payments (sk_test_... / sk_live_...)     |
| `SITE_URL`           | yes      | Your frontend URL (see below)                |

### 2. Paystack webhook (no domain needed)

Convex gives every deployment a free public HTTPS domain: `https://<your-deployment>.convex.site`.

In your Paystack dashboard, set the **webhook URL** to:

```
https://<your-deployment>.convex.site/paystack-webhook
```

### 3. Frontend — Vercel (recommended)

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project**, import the repo. Vercel detects Vite automatically.
3. Add the env var `VITE_CONVEX_URL=https://<your-deployment>.convex.cloud` (in the project's Settings → Environment Variables, plus `VITE_SITE_URL` if referenced).
4. Deploy. Every push to the default branch redeploys automatically.

### 4. One-time bootstrapping

The `super_admin` (platform) role can never be granted through the app. Bootstrap it once:
- In the Convex dashboard, open the `users` table, find your user row, and set `role` to `"super_admin"` manually — **or**
- Run the `grantSuperAdmin` function from the Convex dashboard's function runner (requires an existing `super_admin`).

Platform-level management (tenants, users, `grantSuperAdmin`) is then available in the Admin dashboard.

## Add a custom domain later

No rework needed:
1. Add the domain in your Vercel project (Settings → Domains) and point the DNS CNAME at Vercel.
2. Update `SITE_URL` in the Convex dashboard environment variables.
3. Optionally configure a custom domain on the Convex deployment (`convex.cloud` custom domains) if you want the API/webhook URL to match.

## Troubleshooting

- **`npm install` fails on `@tailwindcss/oxide`**: happens on older Node/npm versions. Upgrade to Node 20.19+ / npm 10+, delete `node_modules` and `package-lock.json`, reinstall.
- **`npx convex dev` shows codegen errors**: `src/convex/_generated` is gitignored and generated on demand; don't commit it.
- **Payments not completing**: verify the webhook URL, the `PAYSTACK_SECRET_KEY`, and that the deployment's `SITE_URL` matches the frontend.