# Daily Feature Delivery

Status: approved by the user on 2026-11-11.

## Intent

Deliver one complete new Planet Studio feature each day, including tests,
browser verification, a Git commit, and a verified production deployment.
Do not split one feature into infrastructure/UI/test days. The approved
30-feature scope and feature-level acceptance criteria live in `DAILY_PLAN.md`.

## Approach

Use a daily Codex thread heartbeat for development and a GitHub Actions
workflow for deterministic tests, production build, and GitHub Pages release.
This preserves the current conversation and avoids a new task for every run.
The user has authorized daily implementation and releases within this scope.

A reminder alone would not implement features. A scheduled build alone cannot
design or implement them. The heartbeat implements; Actions tests and deploys.
All work remains in the standalone public repository, never in the blog.

## Constraints

- Schedule: 09:00 Asia/Shanghai, starting 2026-11-12.
- One whole feature per day; select the earliest due unfinished feature.
- No skipping failures or quietly reducing approved acceptance criteria.
- Preserve legacy projects, offline HTML exports, MIT notices, and accessibility.
- Use Node.js 24, existing Three.js/Vite architecture, and focused additions.
- Do not overwrite unknown changes, force-push, leak credentials, or add a backend.
- Current limits remain unless a specifically approved feature requires changing
  them: 2,000 objects, 40 undo steps, and 2 MB imports.
- A complete feature includes both editor languages and its relevant save/export
  paths; changing the JSON schema requires explicit migrations and tests.
- A schedule is a development target, not permission to publish failing work.

## Release Evidence

Deployment requires a green unit-test and production-build job. A public
`release.json` contains the exact Git commit served by Pages. The daily
implementer also runs real-browser production checks, feature-specific tests,
and offline-export checks where applicable before and after deployment.

Only mark a task published after checking the deployed commit and feature.
Persist progress and evidence in the repository to survive interrupted runs.
Recover interrupted publication before starting another feature.

## End Condition

After all 30 tasks are published, do not invent additional features or make
new commits. Notify once and wait for another approved iteration list.
