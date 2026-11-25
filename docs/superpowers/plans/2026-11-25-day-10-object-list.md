# Day 10 Object List Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, then one independent whole-change review. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Find objects by type and literal ID search, then select and locate them on the globe, including hidden and locked objects.

**Architecture:** Add a compact native dialog beside the view controls. A pure query helper returns at most 24 rows per page; explicit pagination avoids rendering 2,000 nodes and stays keyboard/touch friendly. A pure view helper accounts for the existing XYZ rotation and fixed -0.04 roll. The list delegates selection to the existing inspector and only changes the saved view, never object data or history.

**Tech Stack:** Existing JavaScript, Three.js, Lucide, Vite, Node.js 24 and Playwright CLI; no new dependencies.

**Spec:** `DAILY_PLAN.md` Day 10 and `docs/superpowers/specs/2026-11-11-daily-delivery-design.md`.

## Design And Alternatives

The user has approved daily implementation choices without repeated approval.
Use a paginated modal rather than a permanent sidebar (which crowds mobile)
or a virtualized ARIA listbox (unnecessary complexity for 2,000 items).
List rows are native buttons in a semantic list, with full IDs available in
their accessible names and wrapped visible IDs. Search is case-insensitive,
trimmed, literal substring matching and combines with the type filter.
Filters persist while reopening; project replacement clears them.
Selecting closes the dialog, exits preview, enters Select, freezes rotation,
centers the object's anchor as closely as the existing ±1.5 pitch bound allows,
keeps zoom, persists the view and focuses the canvas. Locked objects remain locked.
No schema migration: search, page and selection are temporary editor state.
No object-list UI is embedded in exported HTML.

## Global Constraints

- Work only in standalone planet-studio; never modify the blog.
- Only Day 10 today; do not implement mixed brushes or other scheduled features.
- Keep 2,000 objects, 40 undo steps, 2 MB imports, schema 1/2 and MIT notices.
- Both languages, keyboard, touch, mobile/landscape and render-failure states.
- Existing approved in-place main workflow, fresh remote checks and normal push.
- Full tests/build/browser/review before release; mark published only after online QA.

## Review Focus

- Locating polar/backside objects must account for fixed roll and preserve zoom/data.
- Filters and pagination must remain correct after deletion, undo and project replacement.
- Long IDs and markup-like IDs must remain literal and reachable on narrow screens.
- A modal opened during gestures/preview must not commit unfinished object edits.
- Empty and 2,000-object lists must be usable with bounded DOM and disabled failure actions.

## Task 1: Complete Object List

**Files:** new `prototype/studio/object-list.js`, `object-list-ui.js`,
`tests/studio-object-list.test.js`; modify `main.js`, `i18n.js`, `style.css`,
`prototype/index.html`, both READMEs; ignored `output/playwright/verify-day10-*.cjs`.

**Interfaces:** `objectPage(objects, {type='all', query='', page=0}={})` returns
`{objects,total,page,pages}` with 24-row pages, original order and clamped page.
`objectView(direction, zoom)` returns a schema-valid `{x,y,zoom}` matching
the existing XYZ world rotation. `bindObjectList({getObjects,getLocale,
getSelected,enabled,onOpen,onSelect})` returns `{render,reset}`.
`onSelect(id)` validates against current data, centers view and delegates
to `inspector.select(id)`; stale IDs never select a different object.

- [x] Add tests for intersected type/ID filtering, literal special characters,
  order/nonmutation, page clamping/bounds, 2,000 objects, polar/backside/roll
  targeting, schema validity, saved-view/JSON/HTML preservation and history.
- [x] Run Node.js 24 `node --test tests/studio-object-list.test.js`.
  Expected: failures for missing query/view helpers. Observe missing UI controls
  in real production browser before implementing.
- [x] Implement helpers, modal, selection integration, locales and README.
  Expected: same tests pass, list selection never changes poses, locks or history.
- [x] Run full `npm test`, `npm run build`, `git diff --check`.
  Expected: green; pre-existing chunk-size warning allowed.
- [x] Run production Chromium desktop/mobile in both languages, 360px and
  landscape: real list search/filter/page/keyboard/touch selection, backside
  and pole targeting, lock/edit/undo, replacement reset, empty/2,000 states,
  hostile long IDs, preview, render failure, actual JSON, recovery/library,
  downloaded network-blocked file:// HTML, screenshots and WebGL pixels.
  Expected: all assertions pass, bounded DOM, no overflow or console errors.
- [x] Obtain one independent read-only review; fix important findings with TDD.
- [x] Commit `feat(editor): browse and locate planet objects`, fresh fetch,
  normal main push; verify Actions, exact live SHA and real online browser QA.
- [x] Only then record Day 10 published on 2026-11-25 with feature SHA,
  evidence and report. Do not start Day 11.

Release evidence: `docs/daily-reports/day-10.md`. Commit these records and verify
their deployment before notifying; that final revision is checked after this
document is committed, without adding a self-referential release-record commit.
