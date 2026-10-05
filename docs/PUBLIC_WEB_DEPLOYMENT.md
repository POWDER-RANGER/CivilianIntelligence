# Public web deployment

CIVINTELLIGENCE is the web system of record for the CIVWATCH ecosystem. This
deployment path is intentionally web-first so the public platform can be
shared before native Windows, Linux, macOS, Android, iOS, and Kali clients are
released.

## Target

- **Web runtime:** Render Web Service
- **Database:** Neon Postgres
- **Source:** `POWDER-RANGER/CivilianIntelligence`
- **Deployment:** Git-backed, automatic deploys from the selected branch
- **Application runtime:** Nitro Node server
- **Public data:** fetched from configured live sources; no synthetic production data

Render's free web service is suitable for a public preview/launch surface, but
it spins down after 15 minutes of inactivity. The first request after idle can
take about a minute. This is a hosting constraint, not an application health
signal.

Neon's current Free plan provides 1 GB of Postgres storage per project. Use a
dedicated Neon project for CIVINTELLIGENCE and keep the database connection
string in Render as a secret environment variable.

## Required Render environment

Set:

- `CIVINT_DEPLOYMENT=production`
- `DATABASE_URL=<Neon pooled Postgres connection string>`

If `DATABASE_URL` is absent, a public production deployment is rejected
rather than silently falling back to the in-process PGLite database.

## Optional authentication

Before enabling user sign-in, configure the production Better Auth variables
documented by the repository's auth reference:

- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `GROK_AUTH_ISSUER`
- `GROK_AUTH_CLIENT_ID`
- `GROK_AUTH_CLIENT_SECRET`

Do not commit secrets. Read-only public intelligence can be exposed without
turning on user accounts.

## Deployment sequence

1. Create the Neon Postgres project.
2. Copy its pooled Postgres connection string.
3. Connect the GitHub repository to Render.
4. Create a Blueprint/Web Service from `render.yaml`.
5. Supply `DATABASE_URL` as a secret.
6. Deploy the branch and verify the health path.
7. Verify public pages, live source indicators, pillar health, and database-backed
   state.
8. Promote the deployment branch to `main` only after those checks pass.

## Launch invariant

A green deployment is not sufficient evidence of production readiness. The
public site must show truthful live/degraded/unavailable states and must never
use fake telemetry, seeded demo records, or an in-memory database to make the
system appear healthy.
