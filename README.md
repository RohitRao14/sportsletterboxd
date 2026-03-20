# Sports Letterboxd

A personal sports diary — log, rate, and review every game/match/race you watch across F1, Football, NFL, Cricket, and NBA. Inspired by Letterboxd.

## Stack

- **Next.js 14** (App Router)
- **PostgreSQL** via Neon (free tier)
- **Prisma 7** ORM
- **iron-session** auth (single password, 30-day cookie)
- **Tailwind CSS**
- **Vercel** deployment

---

## Setup

### 1. Create a Neon database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. From the project dashboard, get both connection strings:
   - **Pooled** → `DATABASE_URL`
   - **Direct** → `DATABASE_URL_UNPOOLED`

### 2. Configure environment variables

Fill in `.env`:

```
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
ADMIN_PASSWORD_HASH=""   # see step below
SESSION_SECRET="generate-a-random-32-plus-character-string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Generate your password hash:**
```bash
npm run gen-hash -- yourpassword
```
Paste the output into `ADMIN_PASSWORD_HASH`.

### 3. Update prisma.config.ts for migrations

For `prisma migrate`, point the datasource at the **unpooled** URL:
```ts
datasource: {
  url: process.env["DATABASE_URL_UNPOOLED"]!,
},
```

### 4. Run migration

```bash
npx prisma migrate dev --name init
```

Then apply the FTS extensions by running `prisma/migrations/001_initial/migration.sql` in the Neon SQL editor.

### 5. Seed

```bash
npm run seed
```

Loads F1, Football, Cricket, NFL, NBA data. Idempotent — safe to re-run.

### 6. Run locally

```bash
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to `/login`.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add env vars in Vercel dashboard (all 5 from `.env`)
4. Deploy — build command is `prisma generate && next build` (set in `vercel.json`)
5. After deploy, run seed against prod: `DATABASE_URL="..." npm run seed`

---

## Annual Season Refresh

```bash
npx ts-node scripts/refresh-season.ts --sport=F1 --from=2026 --to=2027
```

Creates template files in `seed/data/f1/`. Fill in dates, rename to `events.json`, re-seed.

---

## Commands

```bash
npm run dev          # Dev server
npm run db:studio    # Prisma Studio (visual DB browser)
npm run db:generate  # Regenerate Prisma client
npm run seed         # Seed database
npm run gen-hash     # Generate bcrypt hash for password
```
