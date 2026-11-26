# Day 11 Mixed Ecology Brush Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline and one independent whole-change review. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Paint pine trees, flowers and rocks together with adjustable proportions, deterministic placement, safe spacing and whole-stroke history.

**Architecture:** Reuse the existing seeded Fibonacci candidate lattice, arc sampling and shared spatial index. The mixed brush uses one 16,000-point lattice, independently seeded type choices and density priorities; it emits existing object types. Three inline relative-weight sliders belong to temporary brush state. Saved objects need no schema change.

**Tech Stack:** Existing JavaScript, Three.js, Lucide, Vite, Node.js 24, Playwright CLI; no new dependency.

**Spec:** `DAILY_PLAN.md` Day 11 and `docs/superpowers/specs/2026-11-11-daily-delivery-design.md`.

## Design And Alternatives

The user delegates daily technical choices without repeated approval. Use a shared candidate stream rather than three sequential single-type strokes: sequential passes favor the first type and make one-stroke history awkward. A quota solver would promise exact counts that cannot always fit constrained space. Relative weights control candidate type probability; physical spacing may change realized counts. Default pine/flowers/rock weights are 60/25/15; each integer weight is 0..100, at least one nonzero, normalized for display and selection. Zero removes that type. All-zero disables painting with a bilingual inline error. Inputs cancel unfinished strokes; valid weights are copied at begin. Ratios are session-only, like radius/density; named persistent brush presets remain Day 12.

## Global Constraints

- Only standalone planet-studio; never edit the blog. Only Day 11 this run.
- Approved in-place main workflow; fresh remote checks and normal pushes.
- Keep 2,000 objects, 40 undo steps, 2 MB imports, schema 1/2 and MIT notices.
- Preserve all six single brushes, locked occupancy, typed erase and editing.
- Both locales, keyboard, touch, mobile, landscape and render failure.
- Full local checks, review, Actions, exact live SHA and online feature QA before published.

## Review Focus

- Zero/malformed ratios reject atomically without losing an active stroke or redo.
- Type and density randomness must be independent; repeated/re-sampled paths reproduce.
- Shared spacing and locked/imported IDs must remain safe as weights change.
- Composition controls must stay reachable in short and narrow tool panels.
- Existing JSON and real offline exports must preserve exact emitted object data.

## Task 1: Complete Mixed Ecology Brush

**Files:** new `prototype/studio/mixed-brush.js`, `tests/studio-mixed-brush.test.js`; modify model/main/i18n/style, index.html and both READMEs. QA scripts/logs remain ignored in `output/playwright/`.

**Interfaces:** `mixShares(weights=DEFAULT_MIX)` validates exactly tree/flowers/rock integer weights 0..100 and returns normalized shares, otherwise throws localized `invalidMix`. `store.begin(type,radius,density,eraseType='all',mix=DEFAULT_MIX)` adds transient type `mixed`; it validates before canceling, builds a seeded mixed candidate stream once and shares existing stamp/history logic. Mixed IDs are `eco:N`; saved types remain tree/flowers/rock. UI guards all-zero before pointer/keyboard begin, exposes three native ranges and normalized outputs, and cancels in-flight work when ratios change.

- [x] Add meaningful tests for deterministic mixture, proportional weights and zero types, density/area, sparse/dense paths, footprints/locked neighbors, invalid ratios atomically, whole-stroke cancel/undo/redo, caps, poles/gaps, old JSON and exact export data.
- [x] Run `node --test tests/studio-mixed-brush.test.js` with Node 24; expect missing mixed brush/validation failures. Observe missing control in production browser.
- [x] Implement model, native controls, bilingual states and README; same tests pass, solo placement unaffected.
- [x] Run full `npm test`, `npm run build`, `git diff --check`; expect pass, existing chunk-size warning allowed.
- [x] Run real production Chromium: pointer/touch/keyboard painting, ratios/zeros, deterministic replay, history/cancel, locks/spacing, typed erase, both locales at 1440x960/390x844/360x640/844x390, screenshots/WebGL, old JSON, JSON/recovery/library and actual downloaded network-blocked file:// HTML. Expect no errors/overflow and exact saved objects.
- [ ] Obtain independent read-only whole-change review; address important findings with a failing regression test.
- [ ] Commit feature, fresh fetch, normal main push, successful Actions, exact live SHA and real online QA.
- [ ] Only then record Day 11 published on 2026-11-26, report/evidence, commit records and verify final deployment. Do not start Day 12.
