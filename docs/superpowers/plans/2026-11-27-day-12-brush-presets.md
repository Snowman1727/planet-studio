# Day 12 Brush Presets Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline and one independent whole-change review. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Save, name, apply, rename and safely delete reusable brush configurations, retained across reloads.

**Architecture:** A dedicated version-1 browser collection stores named snapshots of painting mode, radius in degrees, density percentage and raw relative mix weights. A small storage module mirrors the existing library's exclusive Web Locks and optimistic revision checks; a native dialog binds management to current editor controls. Presets never become project or player data.

**Tech Stack:** Existing JavaScript, Three.js, Lucide, Vite, Node.js 24 and Playwright CLI; no new dependency.

**Spec:** `DAILY_PLAN.md` Day 12 and `docs/superpowers/specs/2026-11-11-daily-delivery-design.md`.

## Design And Alternatives

The user explicitly delegates daily technical choices. Project-embedded presets would unnecessarily change every saved world and offline player; a global browser collection is consistent with the existing local library. A native management dialog keeps a maximum of 24 entries out of the narrow editing panel. Store the six single painting modes plus mixed, radius integer 7..35 degrees, density integer 10..100 in steps of 5, and all three mix integer weights 0..100 with at least one nonzero. Names trim to 1..40 characters and are case-insensitively unique. Collection size is at most 64 KiB. Save always adds a new named snapshot, never silently overwrites; rename is explicit and delete requires confirmation. Nonpainting tools can open/apply/manage, but cannot save a new preset; render failure still permits rename/delete but not save/apply. Storage, validation, lock and concurrent-revision errors preserve collection and current project. Applying cancels unfinished work, switches to the saved painting mode and changes only tool controls, not objects/history. Opening the manager exits preview through the established editor path. Browser-origin storage is not synced or embedded in project JSON/HTML; final painted objects remain exactly exportable.

## Global Constraints

- Only standalone planet-studio; never edit the blog. Only Day 12 this run, 2026-11-27 Asia/Shanghai.
- Honor the approved in-place main workflow, fresh fetch and normal pushes; preserve unknown work.
- Preserve 2,000 objects, 40 undo steps, 2 MB imports, schema 1/2 and MIT notices.
- Both locales, keyboard, touch, narrow/landscape layouts, render and storage failure.
- Full tests/build, real production-browser local/online checks, independent review, exact live SHA and report gates.

## Review Focus

- Malformed/oversized stored collections and invalid names/settings never get overwritten or applied partially.
- Cross-tab or queued operations must not overwrite another writer; missing Web Locks must fail explicitly.
- Applying/opening cancels uncommitted strokes without removing prior history or changing finalized objects.
- Long and markup-like names remain literal text, with usable controls in short/narrow dialogs.
- Preset state stays separate from recovery/library/JSON/HTML, while objects painted with applied settings round-trip exactly.

## Task 1: Complete Brush Presets

**Files:** create `prototype/studio/brush-presets.js`, `prototype/studio/brush-presets-ui.js`, `tests/studio-brush-presets.test.js`; modify main/i18n/style, index.html and both READMEs. QA artifacts remain ignored in `output/playwright/`.

**Interfaces:** `PRESETS_KEY='planet-studio:brush-presets:v1'`, `PRESET_LIMIT=24`; `validateBrushSettings(config)` returns a detached validated `{mode,radius,density,mix}` or localized `invalidPresetSettings`. `createBrushPresets(storage,locks=navigator.locks)` exposes `list()`, `get(id)`, async `save(name,config)`, `rename(id,name)`, `remove(id)`, returning detached snapshots. Errors use dedicated localized keys. `bindBrushPresets({storage,getLocale,getSettings,canSave,canApply,onOpen,onApply,announce})` exposes `render()` and handles dialogs, safe DOM rendering, busy/focus/error states and storage changes. Main integration captures raw controls, validates before assigning, updates mode/labels/sliders and ring, and never serializes presets into projects.

- [x] Write tests for detached save/reload/apply settings, all seven modes, exact weight preservation and deterministic painting; name/ratio/range/density validation, duplicates/limit, corrupt/oversized collections, unavailable/quota storage, missing locks, queued cross-tab conflicts, missing IDs, rename/delete, old projects and exact JSON/HTML without presets.
- [x] Run focused tests on Node24 and observe missing-module RED; observe absent manager control in baseline production browser.
- [x] Implement storage, complete native dialog workflows, main integration and bilingual docs; focused tests pass.
- [x] Run `npm test`, `npm run build`, `git diff --check`; expected all pass, existing bundle warning only.
- [x] Real production Chromium: save/name/rename/apply/delete confirm/cancel, reload, native keyboard/touch, all modes and invalid configurations, cross-tab failures, unfinished stroke cancellation/history, both locales at 1440x960/390x844/360x640/844x390, screenshot/WebGL, old JSON/recovery/library and downloaded network-blocked offline HTML. Expected exact objects, no errors or overflow.
- [ ] Independent read-only whole-change review; fix important findings with RED/GREEN tests.
- [ ] Commit, fresh fetch, normal main push, successful Actions and exact feature SHA; repeat real online feature verification.
- [ ] Only then record Day12 published and evidence, commit records and verify final deployment. Do not start Day13.
