# CIVINTELLIGENCE — authoritative engineering ledger

Owner: Curtis Charles Farrar / POWDER-RANGER
Control date: 2026-11-21 (America/Chicago)
Production branch: `deploy/render-public-web`
Render service: `srv-db1lhl49v7es73852lcg`
Operating rule: one coordination thread, milestone-driven, no competing hourly automation.
Update this ledger on material PR, release, or runtime state changes. Evidence is a requirement, not an inferred result.

## Release baseline (independently checked)

- Production Git SHA: `6e0a73d7910e2032906d768453ac9acfa21b7646`
- Render deploy: `dep-dc0p5vs0916s73ce1e20` / status `live`; service not suspended.
- HTTP /: 200 (444 ms); /globe: 200 (291 ms); /api/civint/sources: 200 (1,528 ms).
- /api/civint/records/search?limit=1: 200 (866 ms), one indexed result returned.
- /api/health: 200, `status=ok`, `database=available`. Provider still to be reconciled; no Render Postgres instance was listed in workspace.
- This is HTTP-level verification, not a browser, authentication, WebGL, or end-to-end evidence audit.
- Render app logs showed an earlier `ECONNRESET`/500 in the selected log window; route, frequency, and impact need investigation.

## Milestone ledger

| ID  | Milestone / objective                                           | Branch / PR                                    | Commit                                      | Verification / evidence                                                                                                                       | Engineering status                               | Deployed SHA / runtime                       | Blocker and next action                                                                                 |
| --- | --------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| R0  | Establish single-source baseline                                | `deploy/render-public-web` / #161 merged       | `6e0a73d`                                   | Render deployment + HTTP responses + health JSON                                                                                              | Deployed; partially runtime verified             | `6e0a73d`; HTTP routes verified, not browser | Authenticated journey, real data, WebGL, performance, database architecture                             |
| L1  | Public USGS source-backed API + globe coordinate navigation     | `feat/usgs-public-globe-20261121` / PR pending | based on `6e0a73d`                          | 26/26 targeted, 137 TypeScript, 237 platform tests passed; lint, typecheck, dev build passed; local API 200 with 2 source records; CI pending | Locally validated; CI and browser review pending | Not deployed                                 | Local preview logged PGLite bootstrap ENOENT; complete browser/CI verification; no production promotion |
| L2  | Reconcile offline USGS ingest with canonical public source path | `feat/civint-live-intelligence` / #123 draft   | Remote `92535e77` at audit; local `c3f2109` | Earlier 18 Python tests; no proven public API/globe integration                                                                               | Locally validated ingestion; integration pending | Not deployed                                 | Preserve PR branch and compare normalizer contracts; durable store and ingestion schedule               |
| N1  | Five native installable shells                                  | `feat/native-clients` / #121 draft             | `1dc9e040`                                  | Current HEAD native CI run `44927625185`: Windows/Linux/macOS/iOS/Android, artifact verifier and emulator all success                         | CI validated, not production-ready               | Not deployed                                 | Secure auth, offline evidence/workspace, physical-device runs, signing                                  |
| C1  | Historical malformed-error and length browser smoke patches     | #149, #150 draft                               | #149 `ba8c0ea`; #150 `0a518cf`              | Historical local tests; overlap likely with #158-#161                                                                                         | Audit/retirement pending                         | Later smoke fixes live                       | Diff each vs production and close only if no unique behavior                                            |
| D1  | Presentation typography                                         | #96, #97 draft                                 | Inspect on decision                         | Source-reviewed; CI/browser evidence missing                                                                                                  | Planned/review pending                           | Not deployed                                 | Compare to current design system before promote or retire                                               |
| O1  | Observability, performance budgets, release runbook             | Not assigned                                   | —                                           | One-off timings + Render events                                                                                                               | Planned                                          | —                                            | Define p95, availability, client errors and reproducible release gates                                  |

## Worktree and execution safeguards

- Dell Desktop Commander device `cd66fb2e-21de-4b1a-b3db-8695a0ae1f3e` was online. MSI offline at baseline.
- Inspected 17 Git worktrees. Native checkout has 8 untracked diagnostics/evidence paths; preserve them.
- Root worktree `C:\Users\Curtis\CivilianIntelligence` has modified generated `src/routeTree.gen.ts`; other auth/smoke worktrees contain changes. Do not discard.
- PR #123 local checkout was clean. Remote advertised a different tip from local; do not reset or overwrite either.
- Other signing-related Git processes were observed on Dell; use isolated branch/worktree, not the active root.
- The current L1 worktree was created separately from the exact deployed commit at `C:\Users\Curtis\ci-usgs-public-globe`.
- Dell available system disk at audit: about 10.65 GiB. Shared dependencies are linked for test/build to avoid redundant installs; do not remove the original dependency directory.
- Two historical hourly automations were already disabled according to owner handoff; do not restart.

## State vocabulary

Planned → Implemented → Locally validated → CI validated → Merged → Deployed → Runtime verified → Released.
A row may be deployed without meeting the full released criteria. Record actual SHA, CI run URL, environment, test outcome, and explicit shortcomings when advancing state.

## Release gates

1. Compare base/head, uncommitted work, required checks, and scope. No force pushes.
2. Validate success and failure modes; inspect production-like UI and network traces.
3. Confirm branch protection and review readiness before authorized merge.
4. Verify Render deployment SHA and `live` state; do not infer from auto-deploy.
5. Recheck /, /globe, affected API, source credibility, database health, authentication, and performance.
6. Document residual risks before marking released.

## Runtime evidence links

- [Production](https://civintelligence.onrender.com)
- [PR #121](https://github.com/POWDER-RANGER/CivilianIntelligence/pull/121)
- [PR #123](https://github.com/POWDER-RANGER/CivilianIntelligence/pull/123)
- [Native workflow successful run](https://github.com/POWDER-RANGER/CivilianIntelligence/actions/runs/44927625185)
- [Render dashboard](https://dashboard.render.com/web/srv-db1lhl49v7es73852lcg)
