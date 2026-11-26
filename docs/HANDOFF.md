# Handoff: state of the project and how to pick it up

Last updated: 2026-11-26 (contact details added, #43). Read this first when you continue on a new machine
or in a new AI-assistant session; nothing from earlier sessions carries over
except what's in this repo and its GitHub issues.

## Where things stand

| Milestone | Status |
|---|---|
| M1 · Working sign-in | ✅ Sign-in works end to end (#21). **Open: #14**, custom SMTP. Until it's set, Supabase's built-in mailer only reaches project members, so invited users get no email. |
| M3 · Broken features | ✅ Fee payments (#35), record ids (#36), 405s, AI drafting and invites (#38), material uploads (#39). **Open: #40** (comment bank), in PR #41. |
| M4 · Hardening | ✅ Dependency advisories (#24), landing page (#33). Open: #7 (FK/pagination plan). |
| M2 · Roles & school onboarding | **Next.** RFC #15 (decisions are in its comments), #27 sessions/terms, #28 student sign-in, #5 atomic invites, #23 launch scope. |
| M5 / M6 | Planned: #29 learning hub, #30 school profile, #31 branded documents. #32 is the overall roadmap. |

Live: https://philoseduos-sepia.vercel.app (Vercel deploys `main`).

### Verified in production
- Sign-in (email link and code).
- The Paystack webhook is configured: a bad signature gets 401. A real test-mode payment still needs a parent account with an invoice, which arrives with M2 invites.
- The `materials` storage bucket exists (private, 25 MB, 14 types).

### Not yet verified (no accounts of these roles exist yet)
- Clicking through as a teacher, parent, student or staff member. This waits on M2 invites.

## Next steps, in order
1. Merge PR #41 (comment bank).
2. **#14 SMTP:** a dedicated Gmail account with an app password, set in Supabase → Authentication → Emails → SMTP Settings (DEPLOY.md §3). Then set up the Magic Link template and test a sign-in.
3. **M2 (#15):**
   - schema: memberships, permissions, sessions/terms (#27), parent–student links;
   - routes: `/admin` console, `/s/<slug>` portal, invite-only onboarding, student credentials (#28).
   - There is **no staging database** (free plan). Write it as one reviewed SQL migration, back up first, and share the plan with the owner before running it.
4. ~~Landing page contact channel~~: done in #43 (WhatsApp and email, defined in `src/lib/contact.ts`).

## Owner decisions to respect
- **Onboarding:** invite-only. The super-admin provisions schools; there's no self-serve sign-up.
- **Roles:** distinct permissions per role, so no one can go past their authorisation. Multi-school support comes later but must not be blocked.
- **Grading:** every term, plus a cumulative session result.
- **Report comments:** a free comment bank. AI drafting (Claude via `@anthropic-ai/sdk`) shows only when `ANTHROPIC_API_KEY` is set. There's no AI budget yet.
- **Honesty on public pages:** only claim what works; everything else is labelled "Coming soon".
- **Marketing** (pitch deck, demo, videos) lives in the separate private repo `philos_eduos-marketing`.

## How we work
- **Issues:** open a GitHub issue before fixing anything. Use labels (`P0–P2`, `area: …`) and milestones.
- **Branches and commits:** small, well-described commits that reference the issue (`fix(x): … (#N)`). One branch and one PR per issue group; PRs say `Closes #N` and include a Verification section.
- **Merging:** the owner reviews and merges. Don't merge your own PRs.
- **Supply chain:** don't install package versions published in the last 14 days. Pin with `overrides` if a dependency pulls one in (see README → Dependency Overrides).
- **Checks before a PR:** `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.

## Setting up a new machine
```bash
# Node 22 (see .nvmrc); npm test needs Node ≥ 22.18 for built-in TypeScript support
nvm install && nvm use
git clone https://github.com/theTemple10/philos_eduos.git && cd philos_eduos
npm ci
gh auth login          # GitHub CLI, used for issues/PRs
cp .env.example .env.local   # then fill in the values below
npm run dev
```

`.env.local` is never committed. Get the values from the dashboards:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page, `service_role` (server only; never expose it) |
| `DATABASE_URL` | Supabase → Connect → Transaction pooler (port 6543) |
| `PAYSTACK_SECRET_KEY` | Paystack → Settings → API Keys & Webhooks (test key while developing) |
| `SITE_URL` | `http://localhost:3000` locally |
| `ANTHROPIC_API_KEY` | Optional; leave empty (AI drafting stays hidden) |

You can also copy them from Vercel → Project → Settings → Environment
Variables. With the Vercel CLI, `npx vercel link` followed by
`npx vercel env pull .env.local` writes them for you.

Low-memory machines: if `npm run build` is killed, run
`NODE_OPTIONS=--max-old-space-size=1536 npm run build`.

**Local database caution:** `.env.local` points at the **production**
database, because there is only one Supabase project. Scripts and manual
tests must use throwaway rows (for example, a random tenant id) and clean
up after themselves.
