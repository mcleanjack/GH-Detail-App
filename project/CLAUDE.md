# 3D Architectural Detail Viewer — project notes

## Build step (do not forget)

`Detail Viewer.html` is a COMPILED bundle, not a source file. `Home Screen.dc.html`
navigates to it (`Detail Viewer.html?device=pc|tablet|phone`), so it is the file the
user actually uses.

**After ANY edit to `Detail Viewer Standalone Source.dc.html` (or its inputs:
`OrbitCube.jsx`, `Toolbar Buttons.dc.html`, `product-data.js`, `assets/*`), re-bundle:**

    super_inline_html: input "Detail Viewer Standalone Source.dc.html" → output "Detail Viewer.html"

Never edit `Detail Viewer.html` directly. Verifying only the source file will pass
while the shipped viewer stays broken.

**Outside Claude Design** (e.g. a coding agent with no `super_inline_html` tool),
use `python3 pack.py` instead — it reproduces the same `__bundler/manifest` +
`ext_resources` + `page_order` + `template` bundle format by inlining the same
inputs (verified byte-for-byte identical output, modulo a couple of inert
cosmetic differences — see the diff notes in the packer's own commit/history).
CDN dependencies (Google Fonts, pdf.js, react/react-dom/babel) are cached in
`.pack_cache.json` after the first run, so routine local edits never need
network access; pass `--refresh-cdn` to force re-fetching them. three.js stays
a live `unpkg.com` import either way (loaded via an ES-module importmap, which
can't be redirected to an embedded blob: URL) — the viewer needs real internet
access for the 3D canvas to render, in Claude Design or standalone.

## Model conventions

Assembly stages come ONLY from per-object glTF extras — object names are never used:
- `buildStageId` — grouping key (children inherit from an ancestor)
- `buildStageName` — stepper label
- `buildStageOrder` — sequence position

Objects with no `buildStageId`, and edge overlays that match no single stage, are held
to the final stage.

## Imports

Imported .glb files persist as blobs in IndexedDB (`gv.models` / `imports`) so a model
imported in one device mode is available in all three after the page reload that a
device switch performs. Only single-file `.glb` is supported.
