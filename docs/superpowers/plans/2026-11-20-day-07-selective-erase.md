# Selective Eraser Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. The approved daily contract authorizes implementation and main releases without another approval pause. Steps use checkbox syntax for tracking.

**Goal:** Erase all objects or exactly one of six types within a spherical stroke.

**Architecture:** Extend `store.begin(type, radius, density, eraseType = 'all')`
with an immutable per-stroke filter. Keep it editor-only: schema 2, library
snapshots, and the offline player continue to store final placements.
Show a native select instead of the disabled density control in eraser mode.

**Tech Stack:** Existing JavaScript, Three.js, Vite, Node.js 24, Playwright CLI.

**Spec:** `DAILY_PLAN.md` Day 07 and
`docs/superpowers/specs/2026-11-11-daily-delivery-design.md`.

## Global Constraints

- Only the standalone planet-studio repository, not the blog.
- One whole feature per local day; earliest unfinished due item.
- Preserve old JSON, offline exports, licenses, accessibility, and user changes.
- Limits remain 2,000 objects, 40 undo steps, and 2 MB imports.
- Both languages, pointer and keyboard editing, cancellation and mobile reachability.
- Normal push only; exact Actions and online release-marker verification.

## Review Focus

- Invalid filter must not erase anything or interrupt an existing valid stroke.
- Missing target type must not add history or invalidate redo.
- Filter/mode changes, Escape, blur and pointer cancellation restore full strokes.
- Both pointer and Enter must use the selected filter.
- Protected objects retain exact poses through undo, redo, recovery and export.

## Task 1: Complete Selective Erasing

**Files:** `prototype/studio/model.js`, `main.js`, `i18n.js`, `style.css`,
`prototype/index.html`, `tests/studio-erase.test.js`, both READMEs.

**Interfaces:** `begin(type, radius, density, eraseType = 'all')` accepts
`'all'` or an own key of `BRUSHES` for erase mode; unknown values throw
`invalidBrush` before mutation. `stamp` removes only matching anchors within
the existing angular radius. No project fields or exported player changes.

- [x] Add real-model regressions for six individual types, default/all, radius,
  no-match redo, invalid targets, one-stroke history/cancel, event-frequency
  invariance, gaps, and subsequent repaint occupancy.
- [x] Run Node 24 tests; observe selective eraser failures before implementing.
  Expected: protected objects incorrectly removed by the current model.
- [x] Add the stroke filter and localized native select. Hide it outside erase,
  replace density only while erasing, cancel in-progress strokes on change,
  use the filter for pointer and keyboard stamping; disable it on render failure.
- [x] Run full `npm test`, `npm run build`, `git diff --check`.
  Expected: all pass, only existing build size warning.
- [x] Production browser checks at 1440x960, 390x844, 360x640, 844x390 in
  both languages: actual mixed placements, pointer/Enter, undo/redo/no-match,
  filter/mode/Escape/pointer cancellation, native keyboard select, real pixels,
  overflow/reachability, recovery, actual downloaded JSON roundtrip/library,
  schema 1 and downloaded offline HTML with blocked network.
- [ ] Fresh read-only whole-feature review; fix important findings with
  failing regressions first. Commit only feature files with authorized author.
- [ ] Fresh fetch, normal push main; wait successful Actions, exact SHA marker,
  real online selective-eraser and WebGL checks.
- [ ] Record actual Nov 20 publication in day-07 report/progress with evidence;
  commit records and verify their deployment. Close only own QA processes.

## Decisions

The approved scope leaves implementation details to the implementer.
A per-stroke filter avoids changing projects merely by choosing a tool;
replacing disabled density uses the existing compact two-column mobile layout.
No object selection, locks or mixed brushes are included in Day 07.
