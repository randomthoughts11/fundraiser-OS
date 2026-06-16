# Fundraise OS

**The fundraising intelligence and execution platform for U.S. startups raising pre-seed, seed, and Series A.**

## Architecture

- **App:** Next.js 16 monolith + TypeScript + Tailwind
- **Auth:** Clerk (dev bypass when `AUTH_BYPASS_DEV=true` without Clerk keys)
- **Database:** Neon Postgres (Prisma 7)
- **Jobs:** Inngest (deck extraction, matching, EDGAR ingestion, reply classification)
- **AI:** OpenAI structured outputs (deck extraction, email drafts, reply classifier)
- **Storage:** S3/R2 for pitch decks
- **Cache/Rate limits:** Upstash Redis
- **Analytics:** PostHog

## Modules

| Module | Route / Path |
|--------|----------------|
| Founder onboarding | `/onboarding` |
| Readiness scoring | `src/lib/readiness/scoring.ts` |
| Investor matching v2 | `src/lib/matching/engine.ts` |
| Deck upload + extraction | `POST /api/companies/[id]/deck` |
| Pipeline CRM | `/dashboard/[fundraiseId]/pipeline` |
| Outreach drafts | `/dashboard/[fundraiseId]/outreach` |
| Warm intro mapping | `src/lib/intro/path-finder.ts` |
| Compliance QC | `src/lib/compliance/qc-engine.ts` |
| EDGAR ingestion | Inngest cron + `src/lib/ingestion/edgar/` |
| Admin ingestion | `/admin` |
| Learning loop | Inngest weekly + `MatchWeightSnapshot` |

## Setup (Neon — no local Postgres)

```bash
npm install
cp .env.example .env
# Option 1: npx neonctl@latest init → restart Cursor → "Get started with Neon"
# Option 2: paste Neon DATABASE_URL + DIRECT_URL from console.neon.tech
npx prisma db push
npm run db:seed
npm run db:seed:bulk
npm run dev
```

## Deploy

**GitHub → Vercel → Neon** — full walkthrough in [DEPLOY.md](./DEPLOY.md).

Quick Neon setup:

```bash
npx neonctl@latest init
# Restart Cursor, then ask: "Get started with Neon"
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run db:seed` | Seed 5 sample firms + dev admin |
| `npm run db:seed:bulk` | Seed 200+ investor firms |

## API Routes

- `POST /api/onboarding` — create company + readiness
- `GET /api/matches?fundraiseId=` — investor matches (DB first, `?refresh=true` to recompute)
- `POST /api/companies/[id]/deck` — upload pitch deck
- `GET /api/pipeline?fundraiseId=` — pipeline board data
- `POST /api/messages/draft` — generate cited email draft
- `POST /api/messages/[id]/approve` — founder approval + compliance log
- `POST /api/replies` — classify investor reply
- `GET /api/admin/ingestion` — ingestion stats (admin)
- `GET /api/integrations/gmail/connect` — Gmail OAuth

## Deployment

See **[DEPLOY.md](./DEPLOY.md)** for the full GitHub → Vercel → Supabase flow.

Minimum Vercel env vars: `DATABASE_URL`, `DIRECT_URL`, `ENCRYPTION_KEY`, `NEXT_PUBLIC_APP_URL`.

## Compliance

This platform helps founders organize fundraising research and manage their own outreach. It does not raise capital on behalf of startups, charge success fees, or act as a placement agent.
