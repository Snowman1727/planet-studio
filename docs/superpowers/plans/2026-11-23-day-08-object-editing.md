# Day 08 Object Editing Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Execute inline, with one final independent review. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Select a single decoration and move, rotate, resize or delete it without losing spherical grounding, safe spacing, history or portable exports.

**Architecture:** Extend the existing store transaction/history with object edits; do not change schema 2. Three.js raycasts pick visible instances, including terrain occlusion. A compact inline inspector replaces brush settings in Select mode; dragging moves across the surface, while numeric latitude/longitude, heading and scale provide keyboard and mobile precision.

**Tech Stack:** Existing JavaScript, Three.js, Lucide, Vite, Node.js 24 and Playwright CLI.

**Spec:** `DAILY_PLAN.md` Day 08 and `docs/superpowers/specs/2026-11-11-daily-delivery-design.md`.

## Global Constraints

- Only the standalone repository; keep the blog unchanged.
- One complete feature today; no Day 09 locking or Day 10 object list.
- Preserve schema 1/2, offline HTML, MIT notices, both locales and reduced motion.
- Keep 2,000 objects, 40 undo steps, 2 MB JSON, scale 0.75–1.2 and heading 0–2π.
- Approved main development and normal push; fetch before publication.
- Publish only after full tests, production build, browser QA and independent review.

## Design Decisions

Direct surface dragging plus a numeric inspector fits the existing editor better
than 3D gizmos, which obscure this miniature and are difficult on touch screens.
Click selects; drag has a 4px threshold and transports the original anchor by
the ray's spherical rotation, avoiding a jump from canopy to ground.
Off-globe or occupied samples keep the last safe pose. Escape, cancellation,
blur, mode changes and navigation restore the entire unfinished drag.
Numeric edits apply as one undoable operation; Delete is independently undoable.
Rotation and shrinking an already overlapping imported decoration are allowed
because neither increases its conservative footprint. Moving or growing must fit.
Selection is transient and is absent from project data, PNG and HTML.

## Review Focus

- Raycast instance IDs after mixed-type deletion/reordering, hidden snow parts and terrain occlusion.
- Pointer capture, pinch, Escape, preview, replacement and stale selection during edits.
- Numeric no-ops must preserve exact unrounded values and redo; heading edits must not move anchors.
- Occupancy after moves, cancellations, deletes and undo; deterministic brush IDs remain unique.
- Mobile scrolling, localized field labels, keyboard-only selection and offline exports.

## Task 1: Complete Single-Object Editing

**Files:** `model.js`, new `object-edit.js` and `object-inspector.js`, `scene.js`,
`main.js`, `i18n.js`, `style.css`, `prototype/index.html`, bilingual READMEs,
`tests/studio-object-edit.test.js`, ignored browser QA scripts.

**Interfaces:** `store.beginEdit(id): boolean`, `store.edit(patch): boolean`
(false when occupied, throws `invalidObjectEdit` for malformed patches),
`store.deleteObject(id): boolean`, existing `commit/cancel/undo/redo`.
`object-edit.js` supplies geographic conversions and Three.js spherical drag
transport. `scene.pickObject(x,y): id|null` uses current instance mapping;
`scene.select(id|null)` renders a surface outline.
`bindObjectInspector` owns selected ID, numeric form, validation and rendering,
using store plus callbacks for cancellation, completion and localized status.

- [x] Write regression tests for exact move/rotate/resize/delete, transaction
  history/cancel/noops/invalid input, collision/self-exclusion, poles/seams,
  legacy projects, persistence/export and painting after edits.
- [x] Run `node --test tests/studio-object-edit.test.js`; expect missing edit
  behavior failures before implementing.
- [x] Implement store transactions, geographic helpers, selection raycasts,
  surface outline and bilingual inspector; integrate pointer/keyboard behavior.
- [x] Run `npm test`; expect all tests green. Run `npm run build` and
  `git diff --check`; expect success (existing chunk-size warning allowed).
- [x] Run production browser QA at 1440×960, 390×844, 360×640 and 844×390
  in both locales. Cover Review Focus plus actual JSON download/reimport,
  local recovery/library, legacy import, highlight-free PNG and downloaded
  HTML with network blocked; inspect screenshots and real WebGL pixels.
- [ ] Obtain one fresh read-only whole-change review; important fixes require
  reproducing RED→GREEN tests and a green full suite.
- [ ] Commit as `feat(editor): edit individual planet objects`, fresh fetch,
  normal push; verify Actions, exact public marker and online interactions.
- [ ] Record Day 08 as published on the actual date, with feature SHA and
  evidence; commit report/progress and verify the record deployment too.
