# Day 01: Editor Language Implementation Plan

> Execute inline using superpowers:executing-plans and test-driven-development.

**Goal:** Complete English/Simplified Chinese switching throughout the editor
and standalone HTML, without changing saved planet data or losing old drafts.

**Architecture:** A small shared translation module owns messages, locale
normalization, and safe preference persistence. The editor localizes marked
DOM nodes and renders dynamic state from message keys. Locale is an editor
preference, not a planet-schema change. HTML export receives the selected
locale and the standalone player reads its document language.

**Spec:** Day 01 acceptance in `DAILY_PLAN.md`; approved daily delivery design.

## Decisions

- Native language select in the existing toolbar; no new panel or dependency.
- Default remains Simplified Chinese. Store explicit choice separately from
  `snowman:planet-studio:v1`; blocked storage must not prevent switching.
- Never translate or overwrite project names, filenames, imported user text,
  object poses, view, history, or project JSON.
- Existing status/error state re-renders in the new language, not just new events.
- Export HTML lang, controls, accessibility names and errors use export locale;
  JSON schema remains 2, including when importing schema 1.
- Keep module errors machine-readable by code, with existing Chinese messages
  retained for backward compatibility outside the localized UI.
- Header and short brush labels must fit 360px mobile and 844px landscape.

## Task 1: Translation and Export Contract

- [x] Add failing tests to existing export API for English HTML/iframe controls,
  invalid locale fallback, and unchanged escaped project data.
- [x] Run tests and observe missing-language behavior failures.
- [x] Add `prototype/studio/i18n.js`: `normalizeLocale`, `t`, `loadLocale`,
  `saveLocale`, `errorMessage`; test parity, formatting, persistence failure.
- [x] Extend `buildHTML(project, runtime, locale)` and `embedCode(path, locale)`;
  localize standalone player and code-based scene/model errors.
- [x] Run all tests green, preserving all existing export safety tests.

## Task 2: Editor Integration

- [x] Add failing real-browser check for language selector and English labels.
- [x] Mark static text/attributes in `prototype/index.html` for localization;
  add the native select and narrowly scoped responsive CSS.
- [x] Localize dynamic state, dialogs, status announcements, errors, environment
  names, playback, export counts, embed code and language preference persistence.
- [x] Verify live switching preserves composition, undo/redo, active preview,
  custom names, open-dialog values and locale across reload.
- [x] Update both README versions with actual interface language support.

## Task 3: Verification and Publication

- [x] Run full unit suite, production build, whitespace checks.
- [x] Real-browser production checks at 1440x960, 390x844, 360x640, 844x390
  in both languages; inspect screenshots, accessibility names and WebGL pixels.
- [x] Import/recover legacy JSON; test invalid imports in English; ensure
  browser-storage failure still permits locale switching and JSON download.
- [x] Download English/Chinese HTML, open offline with network blocked,
  verify translated controls, rotation, pixels and unchanged project data.
- [x] Review the diff, commit with public noreply identity, push normally.
- [x] Wait for Actions; verify exact public release SHA and real online switching.
- [x] Record evidence and mark Day 01 published only after online verification.
- Publish the report commit and confirm its deployment as the final execution
  gate after writing this record. Do not implement Day 02.

## Execution Record

- Preflight: clean main at `87a4a6a`, no applicable repository AGENTS.md;
  remote fetched without divergence. Day 01 is the first due pending task.
- Ruling: explicit user authorization permits working on main and publishing.
  No worktree or agent delegation is needed for this bounded feature.
- Ruling: execution remains inline; the executing-plans skill requires one
  fresh final reviewer. That review found no actionable issues and independently
  confirmed all 39 unit tests. No implementation tasks were delegated.
- RED evidence: English export tests failed before locale support; the browser
  check failed with "language selector missing" against the previous release.
- Local evidence: 39 unit tests pass, production build succeeds, whitespace
  check clean. Browser verification covers both locales, four viewport sizes,
  exact draft preservation, history, legacy migration, translated errors,
  blocked storage and both downloaded HTML players with zero network requests.
- Ruling: English environment options stack vertically in the desktop sidebar
  to avoid squeezing "Grassland"; mobile retains the three-option row. Mobile
  export uses its download icon with a localized accessible name and tooltip.
- Build retains the existing large-bundle warning; no dependency was added.
- Production-browser suite: 76 assertions passed; the online suite passed 11
  assertions, including the exact feature SHA. Full evidence in
  `docs/daily-reports/day-01.md`.
- Feature published as `b103dd27a7915bfb35ea2b298ffca244e3f2713d`;
  Actions run `43134940442` succeeded. Day 02 remains pending.
