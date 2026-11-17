# Day 04 Saved Views Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. Steps use checkbox syntax for tracking.

**Goal:** Save up to eight named camera views per project and let people revisit or delete them in the editor and standalone player.

**Architecture:** Store bookmarks in the project document alongside the current view, with validated `{ name, view: { x, y, zoom } }` records. A small editor dialog handles naming and selection; exported HTML exposes a compact view menu. Navigation changes never enter the brush undo stack.

**Tech Stack:** Existing JavaScript, Three.js, Vite, Lucide, Node.js 24, Playwright Chromium.

**Spec:** `DAILY_PLAN.md` Day 04 and `docs/superpowers/specs/2026-11-11-daily-delivery-design.md`.

## Global Constraints

- Work only in `/Users/doufu/Documents/ChatGPT/planet-studio`; no blog changes.
- 2026-11-16 Asia/Shanghai: Day 03 shipped yesterday, so Day 04 is the earliest unfinished feature. Do not start Day 05 today.
- Preserve the 2,000-object, 40-undo, 2 MB import and existing schema 1/2 support.
- Keep both languages, JSON, local recovery, PNG and network-free HTML playback functional.
- Push main only after full local tests and browser checks; publish only after exact online SHA and browser verification.

## Design Decisions

- Use optional schema 2 `bookmarks`, defaulting to `[]` for legacy files. Reject explicit malformed collections, duplicate names, invalid views or over-eight lists. Keep schema version 2 because the addition is optional.
- Names are trimmed, nonempty and at most 40 UTF-16 code units; case-insensitive duplicates are rejected. Each bookmark stores a copy of x/y/zoom. Object undo/redo retains current bookmarks.
- Use a stage-top Bookmark icon and an editor dialog: text input plus save command, list of named view buttons and trash icons. The dialog fits desktop and mobile without crowding the existing top bar. Loading a view closes the dialog and persists the current view.
- Opening the dialog from preview returns to edit mode at the visible orientation. The offline player offers the saved views in a select menu and pauses motion on jump so the chosen view remains visible. Player choices do not edit embedded project data.
- Existing JSON and HTML exports include bookmark data; PNG captures the current camera as before. Changing bookmarks does not change the image or object positions.

## Review Focus

- Reject corrupt bookmark input rather than silently discarding views.
- Keep bookmark lists and zoom unchanged through JSON, local recovery and standalone HTML.
- A named view must restore exact x/y/zoom, including after a mobile resize.
- Saving/deleting/jumping must preserve brush redo history and existing objects.
- The player must render imported names as inert text, without script injection.

## Task 1: Complete Saved Views

**Files:** `prototype/studio/model.js`, `main.js`, `player.js`, `export.js`, `i18n.js`, `style.css`, `prototype/index.html`, `tests/studio-bookmarks.test.js`, both READMEs, this plan.

**Interfaces:** `createStore(project).addBookmark(name, view)` validates and appends; `.removeBookmark(index)` removes or returns false. `parseProject` normalizes optional `bookmarks`. Editor dialog uses `scene.view()`, `scene.setView()`, `refresh()` and `persist()`; player select applies embedded bookmarks.

- [x] Write model/export tests for migration, validation, capacity, duplicates, independent history, JSON and escaped standalone HTML; observe expected RED.
- [x] Implement validated storage and the editor/player controls, accessible labels, localization and README instructions; observe GREEN.
- [x] Run Node.js 24 full `npm test`, `npm run build`, and `git diff --check`.
- [x] Verify production build in Playwright on desktop/mobile, narrow/landscape and both locales: real WebGL, save/jump/delete, capacity/error states, JSON, legacy import, recovery, undo/redo, PNG, and downloaded offline HTML with network blocked.
- [x] Review the whole feature and address blocking issues with regression evidence.
- [x] Commit with the authorized noreply identity; fetch and normally push main.
- [x] Wait for successful `Test and deploy`, check exact feature SHA in live `release.json`, then verify the online feature in a real browser.
- [x] Only afterward mark Day 04 `published`, write the report, commit records and confirm their deployment.

## Execution Ledger

- Base: `d25d66f2cb153c1100a06f10ac8ca0b17c9e5418`, clean and equal to origin/main after fetch.
- Ruling: the approved daily feature spec authorizes implementation, tests, push and deploy. No additional product approval is needed for this scoped design.
- RED: all five new model/export tests failed before implementation for missing `bookmarks`, store methods, validation and offline menu. First GREEN: 52/52 unit tests.
- Browser QA found repeated Lucide warnings when rebuilding list icons. Scoped dynamic icon replacement to `data-bookmark-icon`, then reran the production build and 61 main browser checks without console warnings or errors.
- Final local production verification: 52/52 unit tests; Vite build success with existing bundle-size warning; `git diff --check` clean. Playwright: 61 primary assertions, 12 brush-history/preview assertions and four context-loss/JSON-rescue assertions. Real WebGL checked at 1440×960, 390×844, 360×640 and 844×390; EN/ZH, schema 1/2, JSON download/import, recovery and downloaded HTML with all HTTP(S) blocked. Visually inspected mobile, landscape and offline-player screenshots.
- 2026-11-17 review: remote main remains at the clean base. Reviewed model validation, history, HTML escaping, editor/player controls and failure states. Found that the standalone player's native select could not choose the same bookmark again after changing the camera. Reproduced the selected-value failure in Playwright, reset the placeholder after each jump, then rebuilt and verified repeat selection, 52/52 unit tests, 61 production-browser checks and clean diff. No blocking issue remains.
- Feature commit `600eae0fe40ce55cd1040df53c620bc090fb7793` was pushed normally and `Test and deploy` run 43992526795 passed build, deploy and verify. Live release marker matched that exact SHA. Live Chromium passed 10 checks covering WebGL, desktop/mobile layout, saved-view navigation, JSON and recovery with zero console errors; screenshots are in ignored `output/playwright/`. The report and progress entry record the delayed 2026-11-17 publication; Day 05 was not started.
