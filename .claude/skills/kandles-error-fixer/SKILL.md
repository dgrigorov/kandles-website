---
name: kandles-error-fixer
description: 'Autonomous error remediation loop for Kandles.bg. Pulls unresolved issues from Sentry, locates root cause in codebase, applies minimal fix, runs tests, commits. Use when errors accumulate in production or after deploy.'
---

# Kandles Error Fixer

**Goal:** Self-healing feedback loop — Sentry errors → code fix → tests → commit. Zero manual triage.

## Required Environment Variables

Before running, verify these exist (check `apps/admin/.env.local` or Vercel env):

```
SENTRY_AUTH_TOKEN     — User auth token (Settings → Auth Tokens, scope: project:read issues:read)
SENTRY_ORG            — Organization slug (e.g. "kandles-bg")
SENTRY_PROJECT_ADMIN  — Admin app project slug (e.g. "kandles-admin")
SENTRY_PROJECT_STOREFRONT — Storefront project slug (e.g. "kandles-storefront")
```

## On Activation

### Step 1: Fetch Unresolved Issues

Run both projects in parallel:

```bash
# Admin app errors
curl -s -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  "https://sentry.io/api/0/projects/$SENTRY_ORG/$SENTRY_PROJECT_ADMIN/issues/?query=is:unresolved&limit=20&sort=date" \
  | jq '[.[] | {id, title, culprit, count: .count, lastSeen, firstSeen, metadata}]'

# Storefront errors
curl -s -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  "https://sentry.io/api/0/projects/$SENTRY_ORG/$SENTRY_PROJECT_STOREFRONT/issues/?query=is:unresolved&limit=20&sort=date" \
  | jq '[.[] | {id, title, culprit, count: .count, lastSeen, firstSeen, metadata}]'
```

If env vars missing → stop, tell user which vars to add.

### Step 2: Triage and Prioritize

For each issue calculate priority score:
- `count > 100` → P1 (blocking)
- `count > 10` → P2 (high)
- `count <= 10` → P3 (low)

Filter out:
- Issues older than 30 days with count < 5 (likely stale)
- Issues with `culprit` pointing to `node_modules/` (dependency bug, not ours)
- Issues already assigned in Sentry

Present triage table to user:
```
| P | Count | Title | Culprit | Last Seen |
|---|-------|-------|---------|-----------|
| 1 | 847   | ...   | ...     | 2h ago    |
```

Ask: "Fix all P1 first, then P2? Or specific issue ID?"

Wait for user confirmation before proceeding.

### Step 3: Fetch Full Stack Trace per Issue

For each confirmed issue to fix:

```bash
# Get issue details with latest event
curl -s -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  "https://sentry.io/api/0/issues/$ISSUE_ID/events/latest/" \
  | jq '{exception: .exception, request: .request, tags: .tags, contexts: .contexts, breadcrumbs: .breadcrumbs}'
```

Extract from stack trace:
- Exact file path (map Sentry path to local: strip `/var/task/` prefix → project root)
- Line number
- Function name
- Variables in scope at point of failure
- Request context (URL, method, user agent)
- Breadcrumbs (what happened before the error)

### Step 4: Locate and Read Code

For each issue:

1. Read the failing file at the reported line ±30 lines
2. Read any imported functions/modules involved in the stack trace
3. Read the relevant Zod schema if it's a validation error
4. Check git blame for recent changes to that line: `git log -5 --oneline -- {file}`

### Step 5: Diagnose Root Cause

Reason through:
- What exactly threw? (TypeError, ZodError, PostgresError, etc.)
- Why at this line? (null access, wrong type, missing field, race condition)
- Is this a regression? (check git log — did this line change recently?)
- Is there a corresponding Zod schema gap?
- Is there a missing null check?
- Is there a missing `SELECT FOR UPDATE` for inventory?

**CRITICAL RULES:**
- Never apply a fix that touches more than 3 files unless root cause demands it
- Never suppress errors with try/catch without fixing the root cause
- Never add `|| null` / `?? undefined` as a band-aid if the real issue is missing validation
- If root cause is unclear after reading code → report to user, don't guess

### Step 6: Apply Minimal Fix

Apply the fix. Follow ALL patterns from architecture:
- Zod validation at API boundaries
- `ApiResponse<T>` return type from Server Actions
- `SELECT FOR UPDATE` for inventory mutations
- `[functionName]` log prefix on server
- No `any` types introduced

After fix, verify:
- No TypeScript errors: `pnpm --filter {app} typecheck`
- No linting errors: `pnpm --filter {app} lint`
- Run relevant unit tests: `pnpm --filter {package} test`

If tests fail → revert fix, report to user with diagnosis.

### Step 7: Mark as Resolved in Sentry

```bash
curl -s -X PUT \
  -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved"}' \
  "https://sentry.io/api/0/issues/$ISSUE_ID/"
```

Only mark resolved AFTER tests pass.

### Step 8: Commit

One commit per fixed issue:

```bash
git add {changed_files}
git commit -m "fix({scope}): {concise description of what was broken}

Sentry issue: {ISSUE_ID}
Root cause: {one line}
Fix: {one line}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

`{scope}` = `admin` | `storefront` | `db` | `types`

### Step 9: Report

After processing all issues, output summary:

```
## Error Fixer Run — {date}

### Fixed ({n} issues)
- {ISSUE_ID}: {title} → {fix summary} [{file}:{line}]

### Skipped
- {ISSUE_ID}: {title} → {reason (unclear root cause | node_modules | stale)}

### Failed (tests did not pass)
- {ISSUE_ID}: {title} → {what was attempted, what failed}
  Action needed: {specific recommendation}
```

## Axiom Log Query (bonus)

If Axiom is configured (`AXIOM_TOKEN`, `AXIOM_ORG_ID`), before Sentry fetch run:

```bash
# Pull last 1h of error logs from admin app
curl -s -H "Authorization: Bearer $AXIOM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apl": "kandles-admin | where level == \"error\" | sort by _time desc | limit 50",
    "startTime": "'$(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ)'",
    "endTime": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }' \
  "https://api.axiom.co/v1/datasets/_apl?format=tabular" \
  | jq '.matches[] | {time: ._time, msg: .data.msg, fn: .data.fn, err: .data.err}'
```

Cross-reference Axiom logs with Sentry issues for fuller context (breadcrumbs + structured log = much better diagnosis).

## Safety Rules

- **Never** push to remote — commits only, user pushes manually
- **Never** modify `packages/db/src/migrations/` — schema changes require human review
- **Never** touch `.env*` files
- **Never** fix more than 5 issues per run without user re-confirmation
- If fix requires a DB migration → report it, don't create migration automatically
