<div align="center">

# Planet Studio

**Paint a little world. Make it your own.**

A visual 3D planet editor for creating low-poly miniature worlds.<br>
Paint forests, grow a village, and take your planet to the web.

**English** · [简体中文](README.zh-CN.md)

[Try the Editor](https://snowman1727.github.io/planet-studio/) · [Features](#features) · [Get Started](#get-started) · [Export & Embed](#export--embed)

</div>

![Planet Studio editor showing a miniature grassland planet, region brushes, and environment controls](docs/preview.png)

## A World Built With Brushstrokes

Planet Studio turns an empty globe into a world you can shape with a brush.
Instead of placing every tree or cabin by hand, paint a region and let the
editor arrange its objects across the curved surface, with varied sizes,
orientations, and spacing.

Build a snowy woodland, a green retreat, or a desert settlement. Keep your
composition as you switch environments, then export an interactive planet
for a personal website, portfolio, or creative experiment.

## Features

| | What you can create |
| --- | --- |
| **Region brushes** | Paint pine forests, cabins, broadleaf trees, flower patches, rocks, and mushrooms. Adjust brush radius and density to shape each area. |
| **Three environments** | Switch between snow, grassland, and desert. Terrain colors, vegetation, and lighting change without moving your objects. |
| **Low-poly worlds** | Procedural geometry gives every planet a consistent miniature aesthetic, with snow caps in the snow environment. |
| **Editable projects** | Undo or redo complete strokes, erase regions, recover a local draft, and save or import JSON projects. |
| **Live presentation** | Rotate your planet, preview its animation, and add snowfall in the snow environment. Motion respects reduced-motion preferences. |
| **Portable creations** | Download a 1024/2048 square PNG with a transparent or dark background, or export a self-contained, interactive HTML file for offline use and embedding. |

## Create Your Planet

1. **Start with a blank globe.** Choose snow, grassland, or desert as its environment.
2. **Paint the landscape.** Select a brush, adjust its radius and density, and drag across the surface. Use the rotation tool to reach another side.
3. **Refine the composition.** Mix brushes, erase regions, and undo or redo strokes. Switching environments preserves the arrangement.
4. **Save and share.** Save JSON to keep editing later. Export HTML when your planet is ready to display.

The editor adapts to desktop and mobile screens. On phones, scroll the bottom
tool panel to reach all brushes and environment settings.

## Get Started

Use **Node.js 24 or newer** and a browser with **WebGL 2** support.

```sh
git clone https://github.com/Snowman1727/planet-studio.git
cd planet-studio
npm ci
npm run dev
```

Open the local address printed in your terminal to enter the editor.
Switch between English and Simplified Chinese in the editor toolbar. Your
language preference is remembered locally, and exported HTML uses the selected
language. Switching languages never changes your planet or its name.

## Export & Embed

### Keep an Editable Copy

Save your planet as **JSON** to preserve its objects, positions, orientations,
sizes, environment, and view. Import it to continue working later.

Local draft recovery uses browser storage. Download JSON for projects you
want to keep, since clearing browser data also removes the local draft.

### Take Your World to the Web

Export **HTML** for a self-contained viewer with scene data and the Three.js
runtime included. Open the file offline, or upload it alongside your website
and embed it:

```html
<iframe
  src="./my-planet.html"
  title="My miniature planet"
  loading="lazy"
  style="width:100%;height:500px;border:0"
></iframe>
```

Point `src` at the actual location of your exported file. The export dialog
also generates embed code from a file path you provide.

The viewer does not load a CDN or contact the editor server. Your host page
must allow iframes; strict content security policies may also need to allow
the exported file's inline scripts. HTML is a presentation file, not a
replacement for an editable JSON project.

### Save a Picture

Choose **PNG** in the export dialog, select **1024 × 1024** or **2048 × 2048**,
and download a snapshot. Transparent background is enabled by default; turn it
off for the editor's dark backdrop. The image uses the displayed orientation
and fits the whole planet and its decorations inside the square, without
editor controls, brush outlines, stars or snowfall. Exporting does not change
your composition, saved view or undo history.

## Controls

| Action | Control |
| --- | --- |
| Paint or erase | Drag on the globe with the selected brush |
| Rotate | Select the rotation tool, then drag |
| Rotate with the keyboard | Arrow keys while the canvas is focused |
| Stamp a brush | Enter while the canvas is focused |
| Cancel the current stroke | Escape |
| Undo | Cmd/Ctrl + Z |
| Redo | Cmd/Ctrl + Shift + Z |

Undo and redo shortcuts apply outside text inputs.

## Development

Built with **JavaScript**, **Three.js**, **Vite**, and **Lucide**, with
**Sora** typography. Planets and decorations are generated in code.

```sh
npm test          # Model, geometry, compatibility, and export safety tests
npm run build    # Build the editor and standalone export runtime
npm run preview  # Preview the production build locally
```

Build output is written to `dist/`. Relative asset paths support static
hosting at a domain root or in a subdirectory. Three.js and the standalone
export runtime produce a large bundle, so builds may report a chunk-size warning.

### Project Structure

```text
prototype/
  index.html           Editor entry
  vite.config.js       Build and standalone player bundling
  studio/
    catalog.js         Brush footprints and environment palettes
    assets.js          Procedural decoration geometry
    model.js           Placement, validation, and stroke history
    scene.js           Shared editor and player renderer
    main.js            Editor interaction and draft recovery
    player.js          Standalone viewer interaction
    export.js          HTML export and embed code
    style.css          Responsive editor styles
tests/                 Model, geometry, and export tests
```

## Scope & Compatibility

- Up to **2,000 objects**, **40 undo steps**, and **2 MB** per JSON import.
- Environments apply to the whole planet, not individually painted biomes.
- Terrain sculpting, roads, rivers, and custom model imports are not implemented.
- Cloud synchronization and multiplayer editing are not included.
- Projects are saved as schema version **2**. Version **1** projects import
  as snow worlds while retaining their objects and view; older editors cannot
  read the new format.
- Snowfall preferences are preserved across environments and take effect
  when returning to snow.

## Contributing

Bug reports, ideas, and pull requests are welcome. For bug reports, include
your browser, reproduction steps, and, when possible, a minimal JSON project
with any private content removed.

For larger changes, open an issue first to discuss the approach. Preserve
existing project compatibility, deterministic placement, and offline exports,
and run the tests and production build before submitting a pull request.

### Daily Feature Roadmap

See the [30-day feature plan](DAILY_PLAN.md) for the planned daily additions
and acceptance criteria. [Delivery progress](docs/daily-progress.json) tracks
what has actually shipped. Planned features are not current capabilities.

## License

[MIT](LICENSE) · Copyright (c) 2026 Snowman1727.

Third-party dependencies and fonts retain their respective licenses.
Exported HTML includes the Planet Studio and Three.js MIT notices.
