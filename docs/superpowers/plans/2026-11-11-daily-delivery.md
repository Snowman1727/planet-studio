# Daily Feature Delivery Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for setup and each daily task. Steps use checkbox (`- [ ]`) syntax for tracking. Execute inline; do not spawn agents by default.

**Goal:** Schedule one complete feature per day with tests and verified deployment.

**Architecture:** A native daily thread heartbeat reads a versioned feature
queue. GitHub Actions gates Pages deployment on unit tests and a production
build, then verifies the published commit marker.

**Tech Stack:** Existing JavaScript, Three.js, Vite, Node.js 24, Playwright CLI,
GitHub Actions/Pages, native Codex heartbeat.

**Spec:** `docs/superpowers/specs/2026-11-11-daily-delivery-design.md`.

## Global Constraints

- Schedule: 09:00 Asia/Shanghai, starting 2026-11-12.
- One complete new feature per run/local day; no partial-feature daily releases.
- Scope and individual acceptance: `DAILY_PLAN.md`; progress: `docs/daily-progress.json`.
- Only `Snowman1727/planet-studio`, not the author's blog.
- Preserve old JSON, offline exports, licenses, accessibility, and user changes.
- 2,000 objects, 40 undo steps, 2 MB imports unless explicitly authorized otherwise.
- Publish only passing work; never mark a push alone as a verified release.

## Review Focus

- Interrupted deployment must be resumed without implementing a feature twice.
- A failed feature must not be skipped on the following date.
- CDN staleness must not produce a false release claim; compare exact commits.
- A failed test/build must leave the previous production deployment in place.
- New document fields must migrate legacy data and survive standalone export.

## Task 1: Durable Daily Queue

**Files:** `DAILY_PLAN.md`, `docs/daily-progress.json`, this plan, and the spec.

**Interface:** Each progress task has `day`, `scheduledDate`, `feature`, `status`.
Published entries additionally record `completedDate`, `commit`, `workflowUrl`,
and `report`. Reports live at `docs/daily-reports/day-NN.md`.

- [x] Record the approved 30 features, dates, acceptance checks, and failure policy.
- [x] Validate JSON, unique consecutive day numbers, date order, and pending state.
- [x] Verify readme links and commit only project-scoped documents.

## Task 2: Tested Production Delivery

**Files:** `.github/workflows/pages.yml`, `README.md`, `README.zh-CN.md`.

**Interface:** Workflow `Test and deploy`; `build` must pass before `deploy`;
published `release.json` returns `{commit, builtAt}` for exact version checks.

- [x] Add PR test/build and main-only Pages upload/deployment, with minimal
  permissions and pinned official Actions.
- [x] Run `npm test`, `npm run build`, and `git diff --check` locally.
- [x] Enable Pages for this repository and push the setup/documents.
- [x] Wait for the actual Actions result, check the public marker against SHA,
  and inspect the real online editor with Playwright at desktop/mobile sizes.
- [x] A failure blocks the setup completion claim; repair and re-verify.

## Task 3: Native Recurring Execution

**Interface:** One active native thread heartbeat, daily 09:00 Asia/Shanghai.
Prompt explicitly selects the earliest due unfinished item, implements it,
tests it, commits, deploys, and verifies online; it is not a reminder.

- [x] Inspect existing automations and update a matching one instead of duplicating.
- [x] Create the heartbeat through the native automation tool; never edit
  automation storage or create system cron as a substitute.
- [x] Confirm its active state and daily 09:00 schedule. The tool does not return
  a next-run timestamp; the approved first eligible date is 2026-11-12.
- [x] Report the plan path, schedule, online address, and local-runtime caveat.

Setup evidence: `docs/daily-reports/setup-2026-11-11.md`.

## Daily Implementation Contract

Each daily feature is an independently shippable task, not a stage in a larger
unfinished implementation. At the start of each run, write a short technical
plan for that day's approved feature against the then-current codebase,
including exact files/interfaces, a failing regression test, implementation,
full verification, release, and report. All steps belong to that day's feature.

Do not attempt to prewrite all 30 implementation details against today's
interfaces. Days 8 onward change the model; later implementations must inspect
the evolved code and extend its migrations instead of overwriting prior work.
