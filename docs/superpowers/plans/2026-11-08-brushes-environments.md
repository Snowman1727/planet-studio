# Brushes and Environments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add four region brushes and three whole-world environments without losing existing work or offline export.

**Architecture:** A shared catalog owns brush bounds and environment palettes. Extend the pure document model, procedural instanced renderer, then the existing UI. The editor and offline player continue to share the renderer.

**Tech Stack:** Existing JavaScript, Three.js, Lucide, Vite/Rolldown, node:test, Playwright CLI.

**Spec:** `docs/superpowers/specs/2026-11-08-brushes-environments-design.md`.

## Global Constraints

- Only the standalone repository; no blog edits or new dependencies.
- No commit, push, deploy, or new worktree. Use the in-place feature branch.
- Preserve object placements and generator 1; schema 2 accepts legacy schema 1.
- Maximum 2,000 objects, 40 undo steps, 2 MB JSON imports.
- Low-poly procedural art; shared editor/player; offline HTML and MIT notices retained.

## Review Focus

- Old JSON/local drafts migrate to snow without losing exact poses.
- Six brush types coexist without clipping each other's physical footprints.
- Switching themes during a stroke cancels it, not earlier completed work.
- Invalid environment/type data is rejected without replacing current work.
- Short/narrow screens expose all tools and settings without canvas overlap.

### Task 1: Document and Catalog

**Files:** Create `prototype/studio/catalog.js`; modify `model.js`, `tests/studio-model.test.js`, `tests/studio-export.test.js`.

**Interfaces:** Catalog exports `BRUSHES`, `ENVIRONMENTS`. Document schema 2 adds `settings.environment: 'snow'|'grass'|'desert'`. Object types extend with `broadleaf`, `flowers`, `rock`, `mushroom`. Existing store methods remain unchanged.

- [x] Add tests: legacy normalization; six-type exact JSON and HTML round trips; invalid/missing schema-2 themes and unsupported types; duplicate-free deterministic new strokes; radius/density, mixed-type spacing and history preserving environment.
- [x] Run `npm test`; expect new cases fail against current implementation.
- [x] Implement catalog, schema validation/normalization, generalized candidates and maximum-neighbor footprint spacing without changing legacy candidates.
- [x] Run `npm test`; expect all cases pass.

### Task 2: Shared Scene and Editor

**Files:** Create `assets.js`, `tests/studio-assets.test.js`; modify `scene.js`, `main.js`, `prototype/index.html`, `style.css`; create ignored `output/playwright/verify-environments.cjs`.

**Interfaces:** `createScene` and existing controller API remain unchanged. Catalog is consumed by model and renderer. Native `[name="environment"]` controls update document environment and cancel unfinished strokes.

- [x] Prepare browser checks for all six tools, three visually distinct themes, environment-preserved poses, legacy import, history, recovery, screenshots and responsive controls.
- [x] Run initial browser checks; expect missing new brush/environment controls.
- [x] Add procedural instanced brush geometries and palette/lighting/material switching; keep identical terrain shape and object transforms across environments.
- [x] Add compact brush controls, swatch radios, complete counts, responsive reachable settings; wire persistence, import/replace fields, and environment-aware snow control.
- [x] Run browser checks and `npm test`; expect six successful region brushes and three nonblank distinct scenes, old project recovery, desktop/mobile without overflow.

### Task 3: Export and Final Verification

**Files:** Update `README.md`, `docs/preview.png`, test/browser artifacts as required.

- [x] Verify JSON and offline local HTML preserve all six types and each environment; block network, check real pixels and no JS errors.
- [x] Inspect screenshots at 1440x960, 390x844, 360x640, and 844x390; verify reduced motion and stroke interruption.
- [x] Update README with actual brushes, environment behavior, schema compatibility, and unchanged limits.
- [x] Run `npm test`, `npm run build`, `git diff --check`.
- [x] Request one independent read-only whole-change review; fix important findings with reproducing RED/GREEN tests.
- [x] Leave a local server running and provide the exact URL; keep changes uncommitted.
