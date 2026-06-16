# Deploy: GitHub → Vercel → Neon

This project uses **Neon** for Postgres (recommended for Prisma + Vercel).

## Quick connect (Neon AI setup)

From the project root, run:

```bash
npx neonctl@latest init
```

This will:
- Sign you in to Neon (browser OAuth)
- Create a Neon API key
- Configure the Neon MCP server in Cursor
- Install Neon agent skills
- Install the Neon Local Connect extension (Cursor/VS Code)

Then **restart Cursor** and in chat say:

```
Get started with Neon
```

Your agent can create a Neon project, write `DATABASE_URL` to `.env`, and walk you through schema setup.

---

## Overview

```
Local dev ──push──▶ GitHub ──import──▶ Vercel ──connects to──▶ Neon Postgres
                                      │
                                      └── Inngest Cloud (background jobs)
```

---

## Step 1 — Neon (database)

### Option A: AI-guided (fastest)

```bash
npx neonctl@latest init
# Restart Cursor → "Get started with Neon"
```

### Option B: Manual

1. Go to [console.neon.tech](https://console.neon.tech) → **New project**
2. Name it `fundraiser-os`
3. Open **Connection Details** and copy:

| Use | Neon connection type | Env var |
|-----|---------------------|---------|
| App + Vercel | **Pooled connection** | `DATABASE_URL` |
| Migrations / `db push` | **Direct connection** | `DIRECT_URL` |

4. Update `.env`:

```bash
cp .env.example .env
# Paste Neon URLs
```

5. Push schema and seed:

```bash
npx prisma db push
npm run db:seed
npm run db:seed:bulk
```

6. Optional: enable **pgvector** in Neon SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Step 2 — GitHub

```bash
git add .
git commit -m "Initial Fundraise OS"
git remote add origin https://github.com/YOUR_USER/fundraiser.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Vercel

1. [vercel.com](https://vercel.com) → **Import** your GitHub repo
2. Add environment variables:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon **pooled** connection string |
| `DIRECT_URL` | Neon **direct** connection string |
| `ENCRYPTION_KEY` | Random 32+ char string |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `AUTH_BYPASS_DEV` | `true` for demo; `false` with Clerk |

3. Deploy

**Tip:** Vercel has a native Neon integration — you can link your Neon project during import and it auto-injects `DATABASE_URL`.

---

## Step 4 — Post-deploy

```bash
# From your machine (with production DIRECT_URL)
npx prisma db push
npm run db:seed
npm run db:seed:bulk
```

### Inngest
- Create app at [inngest.com](https://www.inngest.com)
- Add `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` to Vercel
- Sync: `https://YOUR_APP.vercel.app/api/inngest`

### Clerk (when ready)
- Add Clerk keys to Vercel
- Set `AUTH_BYPASS_DEV=false`

---

## Neon vs what this app uses

| Need | Service |
|------|---------|
| Postgres | **Neon** |
| Auth | Clerk (not Neon) |
| Background jobs | Inngest |
| File storage | S3/R2 (optional) |

Neon only replaces the database — everything else stays the same.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `P1001 Can't reach database` | Wrong URL — use Neon strings, not localhost |
| `db push` fails on pooled URL | Use `DIRECT_URL` for migrations |
| MCP not working | Run `npx neonctl@latest init`, restart Cursor |
| Preview deploys need DB | Use Neon **branching** — one branch per Vercel preview |
