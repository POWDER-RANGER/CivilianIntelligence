# CIVWATCH Work Ledger

Single record of work for the CIVWATCH ecosystem, per the *CIVWATCH A+ Execution Roadmap*.
Per-repo `STATUS.md` files summarize from this file and must never claim more than it does.

Every entry states what was **observed**. A result that was not run is recorded as not run.

**Status classes:** Verified Complete · Implemented, Verification Pending · Partially Implemented ·
Blocked by External Dependency · Not Implemented · Failed Verification

Last updated: 2026-10-24

---

## Repository inventory (observed 2026-10-24)

Identity, default branch and push permission confirmed through the GitHub REST API.

| Repo | Default | `main` head | Open PRs | Role (per roadmap) |
|---|---|---|---|---|
| CivilianIntelligence | `main` | `27bbdd69` | 1 (#91, other session) | Hub, system of record |
| civwatch-cell-titan | `main` | `fe110a32` | 0 | RF telemetry + hash-chained evidence |
| civwatch-watchtower | `main` | `3c7ff698` | 0 | Geospatial API + dashboard |
| civwatch-app | `main` | `765bab80` | 0 | Flutter client |
| CIVWATCH | `main` | `22f7567c` | 0 | Legacy project site / security workflows |
| civwatch-v3 | `main` | `f06bd204` | 0 | Archive candidate |
| civwatch-powder-ranger | `main` | `e625b6de` | 0 | Community docs |
| civwatch-ruby-gem | `main` | `9dd719d7` | 0 | Not Implemented (scaffold) |

Not found: `civwatch-ruby` (named in the execution mandate) is not reachable anonymously.
Not checked yet: `civiliaintelligence` (empty duplicate named in the roadmap).

## Hub baseline — `main` @ `30d75666` (before P0-1a)

Local run, Node 22.23.4, `npm ci --ignore-scripts` from lockfile.

| Check | Exit | Result |
|---|---|---|
| `npm run typecheck` | 0 | pass |
| `npm run lint` | 0 | 0 errors, 2 warnings |
| `npm test` | 0 | 106/106 + 1/1 |
| `npm run test:platform` | 1 | 188/197 — 8 in `grok-pwa-plugin.test.mjs`, 1 in `migration-plan.test.mjs` |

`test:platform` is not run in CI. CI (`ci.yml`, `validate.yml`) runs typecheck, lint, `npm test`, build.

## Work items

| ID | Phase | Repo | Title | Status | Evidence |
|---|---|---|---|---|---|
| P0-1a | 0 | CivilianIntelligence | Remove unused Neon Functions scaffold + stray files; rename package | Verified Complete¹ | PR #90 → `4f1fa548`; CI + Validate green on PR and on `main` |
| P0-1b | 0 | CivilianIntelligence | Replace `AGENTS.md`; decide fate of `.grok/` agent tooling | Blocked — owner decision | See note A |
| P0-1c | 0 | CivilianIntelligence | Fix 8 failing grok-pwa OG injector tests | Implemented, Verification Pending³ | `agent/p0-hub-hygiene` PR; `test:platform` 197/197 |
| P2-4 | 2 | CivilianIntelligence | Run `test:platform` and `pytest ingest` in CI | Implemented, Verification Pending | `agent/p0-hub-hygiene` PR |
| P2-5 | 2 | CivilianIntelligence | Fix failing ingest test (`test_normalize_atlas_row`: records lacked license provenance) | Implemented, Verification Pending | `agent/p0-hub-hygiene` PR; ingest pytest 7/7 |
| P2-6 | 2 | CivilianIntelligence | Lint blocking with zero warnings | Implemented, Verification Pending | `agent/p0-hub-hygiene` PR |
| P0-2 | 0 | CivilianIntelligence | Create this ledger | Implemented, Verification Pending | This PR |
| P0-3 | 0 | all | Full baseline across repos | Partially Implemented | Hub only; other repos not yet run |
| P0-4 | 0 | all | Correct disproved claims in docs | Not Implemented | |
| P0-5 | 0 | v3, powder-ranger, ruby-gem | Prepare consolidation (human executes) | Not Implemented | |
| P1-1/2/4/5 | 1 | CivilianIntelligence | Security headers, API method contract, validated proxies, rate/size limits | Implemented, Verification Pending² | PR #91 @ `ea3a243`; fix response on PR #91 |
| P1-3 | 1 | civwatch-cell-titan | Ed25519-signed evidence (schema v2), `/api/evidence/pubkey` | Implemented, Verification Pending | civwatch-cell-titan PR #15; pytest 199 passed; CI green 3.11/3.12 |
| P2-2/P2-3 | 2 | civwatch-watchtower | Persist features/reports in PostGIS; first test suite with coverage gate | Implemented, Verification Pending | civwatch-watchtower PR #14; 36 tests, 90.5% lines; restart-persistence check |

² PR #91 was opened by a separate session. Independent verification passed headers, JSON 405/404,
400 on malformed bodies and the 32 KiB cap, but the rate limiter keys on the client-controlled
leftmost `X-Forwarded-For` entry (Render appends to that header), so rotating it bypasses 429
entirely (40/40 accepted). Not merged. **Update:** fixed in `ea3a243` (right-to-left hop walk,
`TRUSTED_PROXY_HOPS`, oldest-bucket eviction); the same reproduction now yields 30×400 then 10×429.
Production hop count still needs one real-request check after deploy.

³ Root cause was the tests, not production code: `normalizeHeadContext()` reads
`src/lib/og/site.json` from `process.cwd()` when no `site` is passed, so template-default tests run
from this repo picked up the deliberate CIVWATCH branding (`title: CIVWATCH`, `card: custom`).
The test file now runs from an empty temp directory; production OG output is unchanged.

¹ Low-risk change self-merged under the owner's policy for small changes (no auth, migration,
infrastructure or contract changes). Production deploy is **not verified**: see blocker B-1.

### P0-1a detail

- Removed `hello.ts`, `neon.ts`, `@neon/config` (Neon Functions hello-world, no importers).
  Neon **Postgres** (`DATABASE_URL`, `src/lib/db.ts`, `neon-preview.yml`) is unchanged.
- Removed unreferenced `attachments/`, `artifacts/`, `screenshots/app-builder-*`.
- Package `app-builder-workspace` → `civintelligence`. No workflow, deploy config or doc used the old name.
- `scripts/migration-plan.test.mjs`: stale assertion required `migrations/` to be empty; now asserts
  the opt-in auth schema is not auto-applied.
- Observed after change: typecheck 0, lint 0, `npm test` 106/106, `test:platform` 189/197, build 0.

### Note A — why P0-1 was split

The roadmap's P0-1 treated all Grok/Neon files as dead scaffolding. Inspection showed:

- `server/middleware/grok-pwa.ts` + `scripts/grok-pwa-*` are **live in production**: Nitro global
  middleware injecting OG/share tags, serving the web manifest and the iOS install page.
  Deleting them would remove social metadata from the live site. Kept.
- `AGENTS.md` is pinned by `scripts/brand-check.test.mjs`, together with `.grok/skills/og/SKILL.md`.
  Replacing it breaks passing tests unless the Grok Build tooling (`.grok/`, `brand-check*`,
  `browser-smoke*`) is removed or rewritten at the same time. That depends on whether Grok Build
  is still used — an owner decision.

## Roadmap corrections (observed contradicts roadmap)

| Roadmap claim | Observed |
|---|---|
| P0-1: delete grok-pwa as scaffolding | Production OG/manifest middleware — see Note A |
| P0-1: removing grok-pwa clears all 9 platform failures | 8 are grok-pwa; 1 was a stale migration-plan assertion (fixed in P0-1a) |
| P0-1: `vite-plugin-manus-runtime` dependency in hub | Not in hub `package.json`; only match is in committed `.vercel/output/` build files |
| P2-1 / X-5: Watchtower CI blocked since 2026-10-04 | Watchtower CI on `main` green on 2026-10-20 (last 5 runs succeeded) |

## Other findings (not yet ledger items)

- `.vercel/output/` — 63 committed build-output files in the hub.
- Hub: no CSP / HSTS / X-Frame-Options strings in `src/` or `server/` (consistent with P1-1).
- All workflow `uses:` lines in the hub are pinned to commit SHAs.
- Watchtower PR #10 (Dependabot: axios 1.20.0, vite 7.3.7, vitest 3.2.6, postcss, nanoid, pnpm):
  merged as `3c7ff698`. Verified on the merge result before merging: frozen-lockfile install 0,
  `pnpm check` 0, `pnpm build` 0. `pnpm audit --prod`: 84 → 48 findings (high 20 → 6, critical
  1 → 1). `main` CI green on `3c7ff698`. Watchtower has no deploy config of its own; nothing deployed.
- Watchtower has no `test` script and 0 test files (P2-3 still open).
- Code-scanning alerts API returns 403 for this session's token; alert state not observed.

## Blockers

| ID | Blocker | Needed from |
|---|---|---|
| B-1 | Production deploy of `4f1fa548` not verified: Render requires workspace selection; public probe of `civintelligence.onrender.com` refused from this session; `/api/health` does not report a commit SHA | Owner: confirm Render workspace |
| B-2 | P0-1b scope: is Grok Build still used for this repo? | Owner decision |
| B-3 | Code-scanning alerts not readable with current token | Owner / GitHub permissions |
