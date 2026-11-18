# Day 05 Example Templates Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. Steps use checkbox syntax for tracking.

**Goal:** Offer three distinct, fully editable forest, village and desert example planets without overwriting unsaved work.

**Architecture:** `templates.js` builds fixed, deterministic compositions through the existing `createStore` brush placement engine. The editor exposes a template picker and routes selection through the existing replacement guard. Templates are ordinary schema 2 projects, so JSON, recovery, PNG and standalone HTML need no parallel format.

**Tech Stack:** Existing JavaScript, Three.js/Vite, Node.js 24 and Playwright Chromium.

**Spec:** `DAILY_PLAN.md` Day 05 and `docs/superpowers/specs/2026-11-11-daily-delivery-design.md`.

## Constraints

- Work only in `/Users/doufu/Documents/ChatGPT/planet-studio`; never edit the blog repository.
- 2026-11-18 Asia/Shanghai: Day 04 is published; Day 05 is the earliest due unpublished task. Do not develop Day 06 or 07.
- Keep 2,000 object, 40 undo, 2 MB import limits; no schema change or backend.
- Preserve both languages, legacy JSON, browser recovery, PNG, offline HTML and accessible/mobile controls.
- Publish only after local and online browser evidence and exact release SHA.

## Review Focus

- Every template should have a recognizable composition and enough real editable objects, not just a theme change.
- Repeated construction must yield identical IDs, positions and settings and respect collision/size limits.
- Selecting a template must not alter an unsaved project before confirmation; cancelling must leave it exact.
- A template chosen from preview must return to an editable view after confirmation.
- Import/export and local recovery must preserve all generated placements without a template-specific format.

## Task 1: Build And Ship Templates

**Files:** `prototype/studio/templates.js`, `main.js`, `i18n.js`, `style.css`, `prototype/index.html`, `README.md`, `README.zh-CN.md`, `tests/studio-templates.test.js`, this plan. Optional template thumbnails are actual renderer captures in `prototype/assets/templates/`.

**Interfaces:** `TEMPLATE_IDS` is a fixed three-ID list; `createTemplate(id, locale)` returns a fresh validated schema 2 project with localized title, fixed seed/environment/view and curated object clusters. The editor `requestReplace`/`replaceProject` flow protects unsaved work and resets editing state.

- [x] Write tests for IDs, deterministic distinct projects, real object populations, collision/limits, independent copies and JSON/HTML export; observe RED.
- [x] Implement compositions and the picker, bilingual copy, selection/confirmation behavior, mobile layout and README; observe GREEN.
- [x] Run Node.js 24 full `npm test`, `npm run build` and `git diff --check`.
- [x] Verify production build in Playwright on desktop/mobile: picker, all three real WebGL worlds, confirm/cancel/save-first, edit/undo/redo, JSON and local recovery, old JSON, PNG, downloaded offline HTML with network blocked, console and screenshots.
- [x] Review whole feature and address important issues with regression evidence.
- [x] Commit only Day 05 files and normally push `main`.
- [x] Wait for successful `Test and deploy`, exact live feature SHA, and online browser checks; only then mark `published`, write Day 05 report and confirm report deployment.

## Execution Ledger

- Base: `107e7a82262cc795e316bfa478b91f5121607458`, clean and equal to `origin/main` after fetch.
- Ruling: approved Day 05 scope and the user's “继续” authorize implementation and release; the generation recipe is fixed rather than user-seeded so it does not preempt Day 19's one-click generator.
- RED: `tests/studio-templates.test.js` failed for missing `templates.js`; first GREEN: 3/3 feature tests. Forest, village and desert yield 69, 46 and 32 collision-free objects, respectively. The desert cabin was moved from the rim to the visible front after inspecting actual renderer captures.
- Visual assets are 2x PNG crops of the actual 1200×900 local WebGL canvas, not invented template art. Pickers were inspected at 390×844 and 360×640, with desktop and landscape screenshots also retained under ignored `output/playwright/`.
- Final local production QA: 44 Playwright checks cover all templates, English/Chinese, image loading, unsaved-work cancellation and save-first, editing/undo/redo, preview exit, schema 1 import, JSON reimport, local recovery, actual opened PNG pixels, downloaded network-blocked HTML with changed WebGL pixels, desktop/mobile/narrow/landscape rendering and no console errors. Whole-feature review found no blocking issue.
- Feature commit `c157158a44c64bd55d62d0d8e50d9e333cb3e140` was normally pushed to `main`; `Test and deploy` run 44224558864 passed build, deploy and verify. Live `release.json` matched that exact SHA. Live Chromium passed 15 checks for thumbnails, all three WebGL worlds, editing, JSON, recovery and mobile layout with zero JS/console errors; online desktop/mobile screenshots are in ignored `output/playwright/`. Day 06 was not started.
