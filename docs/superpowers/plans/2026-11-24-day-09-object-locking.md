# Day 09 Object Locking Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, then one independent whole-change review. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Lock and unlock a selected object, protecting its pose and existence while preserving undo, persistence and offline exports.

**Architecture:** Extend schema 2 with an optional boolean `locked`; canonical output includes only `locked: true`, with missing/false meaning unlocked. Existing schema 1/2 objects migrate without changing poses. Enforce protection in the store, not only in controls. Add a labeled native checkbox above the inspector's disabled transform fieldset.

**Tech Stack:** Existing JavaScript, Three.js, Lucide, Vite, Node.js 24 and Playwright CLI.

**Spec:** `DAILY_PLAN.md` Day 09 and `docs/superpowers/specs/2026-11-11-daily-delivery-design.md`.

## Global Constraints

- Work only in the standalone repository; keep the blog unchanged.
- Only Day 09 today; no object list or mixed brush implementation.
- Preserve 2,000 objects, 40 undo steps, 2 MB imports, legacy projects and MIT notices.
- Include both locales, keyboard/touch, recovery/library, JSON and offline HTML.
- Existing approved in-place main workflow; fresh fetch, normal push, no configuration changes.
- No new dependencies; tests, browser QA and review must pass before publishing.

## Design Decisions

Lock is editing protection, not a security boundary. It prevents direct move,
rotation, resize, deletion and all selective/global erasing. Locked objects
remain in the spatial index and block overlapping paint or other object moves.
They remain selectable so they can be unlocked. New/replacement/template project
operations remain explicit whole-project replacement, not selective editing.
Undo/redo intentionally restores full object snapshots, including locks; each
lock/unlock is one step. No-op/invalid/missing-ID calls preserve redo.
The checkbox is disabled without selection or in preview/render failure, but
remains enabled for a locked selection. Transform and delete controls are disabled.
This additive schema 2 extension follows the existing optional zoom/bookmark
convention. Older builds may drop locks when re-saving, so current builds are
required to retain editing protection.

## Review Focus

- Locked frontmost objects must stay selectable without permitting drag or delete.
- Lock changes must cancel incomplete strokes before recording their one history step.
- Erasing mixed locked/unlocked types must preserve exact protected poses and ordering.
- Optional lock validation must survive parser, library, recovery, JSON and HTML.
- Mobile scrolling, translated checkbox state and preview/render failure must stay coherent.

## Task 1: Complete Object Locking

**Files:** `prototype/studio/model.js`, `object-inspector.js`, `main.js`, `i18n.js`,
`style.css`, `prototype/index.html`, both READMEs, new `tests/studio-object-lock.test.js`,
ignored `output/playwright/verify-day09-*.cjs`.

**Interfaces:** `store.setObjectLocked(id, locked): boolean`, invalid nonboolean
throws `invalidObjectLock`; missing IDs/noops return false. `beginEdit` and
`deleteObject` return false for locked objects. `edit` never changes a lock.
Checkbox `#object-locked` owns the selected object's lock state.

- [x] Add tests for validated lock persistence, exact lock/unlock history,
  protected editing/erasing, painting footprint, transactional cancellation,
  no-op/invalid redo preservation, legacy migration, JSON/HTML and 40-step limit.
- [x] Run Node.js 24 `node --test tests/studio-object-lock.test.js`.
  Expected: failures for missing lock persistence/protection/API.
- [x] Implement store protection and checkbox with bilingual feedback.
  Expected: same regression suite passes; existing tests remain green.
- [x] Run full `npm test`, `npm run build`, `git diff --check`.
  Expected: all green, existing chunk-size warning allowed.
- [x] Run production Chromium checks on desktop/mobile, both languages;
  real mouse/touch lock selection, blocked drag/Delete/erase, unlock/edit,
  undo/redo, paint occupancy, preview, old JSON, recovery/library, downloaded
  JSON and actual file:// HTML with HTTP(S) blocked, screenshot/WebGL checks.
  Expected: all assertions green, no console/JS errors, no overflow.
- [x] Obtain one fresh read-only review. Fix important findings with RED→GREEN tests.
- [x] Commit `feat(editor): protect locked planet objects`, fresh fetch, normal
  main push, wait Actions, exact release marker, real online browser verification.
- [x] Only then record Day 09 published on 2026-11-24 with feature SHA, report and
  evidence.

Release evidence: `docs/daily-reports/day-09.md`. Commit these records and verify
their deployment before notifying; that final revision is checked after this
document is committed, without adding a self-referential release-record commit.
