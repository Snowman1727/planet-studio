# Brushes and Environments

Status: approved by the user: "按你的建议做".

## Intent

Expand Planet Studio's creative vocabulary while retaining area painting and
the existing editor. Work only in the standalone repository, not the blog.

## Approved Scope

- Add broadleaf trees, flower patches, rocks, and mushrooms.
- Retain pine forests, cabins, erase, and rotate.
- Switch the whole planet between snow, grassland, and desert.
- Environment changes recolor terrain, vegetation, and lighting; snow caps
  and snowfall appear only in the snow environment.
- Do not relocate, delete, or regenerate placed objects on environment changes.
- Preserve brush radius/density, stroke undo/redo, cancellation, recovery,
  JSON import/export, and self-contained HTML export.
- Keep controls reachable on narrow and short viewports.

## Approaches

Whole-world environment presets were recommended and accepted. Painting
multiple biomes on one planet requires a separate terrain brush and is
out of scope. No terrain sculpting, roads, custom models, backend, or new
dependencies in this change.

## Implementation Calls

- Add a small shared catalog defining brush footprint/candidate count and
  environment palettes. Existing pine/cabin candidate generation stays stable.
- Procedural low-poly geometry and instanced meshes for all six object types.
- JSON schema version 2 adds settings.environment; accept version 1 documents
  and normalize them to version 2 with the snow environment. Generator remains 1.
  Unknown environments, versions, and object types are rejected.
- Footprints bound full geometry, including leaves, flower clusters, and caps.
- Snowfall preference remains saved but takes effect only in snow.
- Environment switches cancel active strokes and preserve undo history.
  Stroke history continues to affect objects only, not later environment edits.
- Keep near-black editor chrome and existing typography; environment palettes
  belong to the globe. Use native radio controls with color swatches.
- Use a compact brush grid. Mobile tools use a bounded, scrollable bottom
  panel that includes all environment and brush settings.

## Delivery and Verification

Implement in place on a feature branch; do not commit, push, or deploy.
Use model/export unit tests and real Chromium checks for each brush, each
environment, old JSON, round trips, history, cancellation, persistence, mobile,
and offline HTML with no network. Inspect rendered screenshots and pixels.
