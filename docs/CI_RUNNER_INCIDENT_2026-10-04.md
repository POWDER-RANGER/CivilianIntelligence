# CI/CD Runner Incident — 2026-10-04

## Status

**Architecturally aligned → merged core → CI/CD validation blocked.**

Application workflow definitions were inspected directly on `main`. The current evidence does **not** identify an application-code failure. The strongest observed fault boundary is GitHub Actions job initialization / hosted-runner execution and log availability.

This document intentionally freezes speculative workflow churn until the runner executes at least the first setup/checkout phase and produces usable logs.

## Reproduction

### CivilianIntelligence

- PR CI run: `37178949184`
- PR job: `111367378279`
- Post-merge CI run: `37179425105`
- Post-merge CI job: `111368777501`
- Pages run: `37179401137`
- Pages job: `111368710308`

Observed pattern:

`job created → completed/failure within ~4 seconds → zero reported steps → no usable job logs`

### civwatch-watchtower

- PR CI run: `37178951215`
- PR job: `111367384263`
- Post-merge CI run/retry: `37179131159`
- Post-merge CI job: `111368723414`

Observed pattern:

`job created → completed/failure → zero reported steps → no usable job logs`

Watchtower dependency/security automation has also demonstrated that GitHub Actions can execute successfully in the same repository, further reducing the probability of a repository-wide Actions outage.

## Workflow review

### CivilianIntelligence

```yaml
runs-on: ubuntu-24.04
steps:
  - uses: actions/checkout@v7
  - uses: actions/setup-node@v7
```

The workflow then runs `npm ci`, typecheck, lint, tests, and build.

### Watchtower

```yaml
runs-on: ubuntu-latest
steps:
  - uses: actions/checkout@v7
  - uses: pnpm/action-setup@v4
  - uses: actions/setup-node@v7
```

The workflow then runs `pnpm install` and typecheck.

No shared YAML defect explains both failures, and neither repository reaches an application step before failing.

## Platform status check

At the time of this incident review, GitHub Status reports **Actions operational** and no unresolved Actions incident. GitHub's history records a resolved **October 1, 2026 Actions Job Delays** incident involving degraded performance for some hosted runners due to throttling in an upstream Azure dependency. The current repository evidence therefore indicates a reproducible job-level problem but does not prove that today's failures are the same incident.

Status reference: https://www.githubstatus.com/

## Current technical conclusion

**Do not rewrite the workflow definitions solely to address this incident.**

The reproducible evidence is consistent with a runner/job provisioning or workflow-log infrastructure problem, but the exact GitHub-internal root cause remains unproven from repository-level telemetry alone.

The next trustworthy milestone is a run that records the setup phase and at least the first checkout/setup step. Only then should application-level CI failures be interpreted.

## Escalation

Central tracking issue: https://github.com/POWDER-RANGER/CivilianIntelligence/issues/4

Watchtower tracking issue: https://github.com/POWDER-RANGER/civwatch-watchtower/issues/3

GitHub Support: https://support.github.com/contact

Provide Support the repository names, run IDs, job IDs, approximate four-second runtime, zero-step observation, and `BlobNotFound` log retrieval failure. Ask them to inspect hosted-runner/job-service state, runner-pool assignment, repository/account limits, permissions/environments, and log artifact creation for the cited jobs.

## Release posture

- Architecture: **aligned**
- Core integration: **merged**
- Documentation/Pages: **aligned**
- Automated validation: **blocked**
- Production readiness: **not established**
