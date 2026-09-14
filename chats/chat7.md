# Linking imported models to viewer

_Started 2026-09-09 06:49 UTC_

---

## User

Continuing from "Building stages and assembly connection".

## Assistant

We've been building a 3D Architectural Detail Viewer for Glenvill Homes that handles device modes (PC/iPad/Phone), password-protected GLB import, component picking, stage cycling, and product lookup.

**Core setup:** Staging now relies exclusively on three glTF object properties — `buildStageId`, `buildStageName`, `buildStageOrder` — with no name or hierarchy fallbacks. Objects without an id hold to the final stage; models with no ids hide the stepper. Model info (name, code, description, supplier, contact, 2D sheet) is read from GLB asset extras and merged over a registry on import, making every model self-describing.

**Key fixes applied:** When you pick a part, it now renders fully solid with the rest ghosted (selected mesh draws a second time on its own depth layer, unblended). Edge geometry is matched by bounding box to its host stage so overlays vanish with their parts. Each mesh gets its own material instance on load so only one object glows on hover. Auto-outline generation was added and runs on import.

**Critical blocker just solved:** The home screen points to `Detail Viewer.html`, a compiled bundle snapshot. All my fixes went into the source file, so you were testing a months-old version — no IndexedDB persistence (imports vanished across device modes) and no opaque-selection rendering. Rebuilt the bundle from source; both fixes are now live.

**Current state:** Imported models persist in browser storage and appear in the picker across all three device modes. Stage assignment, solid selection, and touch interactions (tap slop, two-finger pan/pinch, long-press readout, 44px targets) all work identically on PC, iPad, and Phone. The Dark variant doesn't share the import code path yet.

**Next:** Watch for any regressions when importing and switching between device modes. A rebuild procedure is now documented in `CLAUDE.md` to prevent snapshot drift.

Files: Detail Viewer Standalone Source.dc.html, Detail Viewer.html, support.js, product-data.js, OrbitCube.jsx, CLAUDE.md.

## User

can you link the imported models product information into the product information section in this model viewer

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Imported models now feed the product information panel from their own object properties.

Per picked component, the viewer reads that object's glTF custom properties (and inherits from its parent assembly, filling gaps from child meshes): title, description, supplier, host/website, slug/SKU, contact, phone, email. Any other property becomes a spec row automatically (`Material`, `Finish`, `Mass`…), or use a `specs` property with `Label: Value` lines / a JSON array. Model-level extras still drive the "Whole model" state. Where a registry entry exists, the file's own data wins.

Bundle rebuilt, so this is live in the shipped viewer.

## User

I need to add support for reading per-object product/supplier metadata from our GLB models
and displaying it in the viewer's object detail panel.

The GLB files are exported by our internal Material Editor tool. Any node that has product
info carries it under that node's glTF `extras.productInfo`, shaped like this:

{
  description: string
  installationManualUrl: string
  productPageUrl: string
  supplierName: string
  contactName: string
  phone: string
  email: string
  linkedDetail: {
    assetId: string
    fileName: string
    fileSize: number
    mimeType: string        // e.g. "application/pdf"
    dataBase64: string      // the linked PDF's full bytes, base64-encoded
  } | null
}

Notes:
- Only nodes that actually have product info set carry `extras.productInfo` at all — treat its
  absence as "nothing to show" for that object, don't render an empty panel.
- Every text field is free text and may be empty string even when the object present.
- `linkedDetail` is optional (null when no PDF was attached). When present, decode
  `dataBase64` back into a real file (e.g. `atob()` → byte array → `Blob` with `mimeType`) to
  offer it as a "View/Download Detail" action.
- If we're loading via three.js's GLTFLoader, this lands on `object.userData.productInfo`
  automatically — no manual extras lookup needed.
- Node names/componentIds also carry `extras.buildStageId` / `buildStageName` /
  `buildStageOrder` for staged objects, and the file's root-level `extras.buildStages` has a
  summary array of every stage — separate feature, ignore unless we're also wiring up staged
  views.

Please:
1. On object select/click, read `extras.productInfo` (or `userData.productInfo`) for that node.
2. Show it in the detail panel: description, clickable installation manual / product page
   links (skip rendering a link if the URL is empty), supplier contact block (name, contact
   person, phone, email — skip empty fields), and a linked-detail action if `linkedDetail` is
   present.
3. Handle the case where the field is entirely absent (older/plain objects) gracefully — no
   errors, just no panel content.

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: dc_html_str_replace]_

Now the logic: read the structured `productInfo` bag and wire the links + PDF blob.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Wired the Material Editor's `productInfo` bag into the detail panel.

- On select, the node's `userData.productInfo` is read (inheriting from its parent assembly, gaps filled from child meshes). Absent bag → nothing rendered, no errors.
- `description` → description block; `supplierName` / `contactName` / `phone` / `email` → supplier block, each field skipped when empty.
- `installationManualUrl` / `productPageUrl` render as links only when non-empty (open in a new tab); the old host+slug convention is now only a fallback for registry models.
- `linkedDetail` decodes `dataBase64` into a Blob of `mimeType` and shows "View linked detail" with its file size — PDFs open in a tab, anything else downloads under `fileName`. Object URLs are revoked after a minute.

Bundle rebuilt. Staged views were left untouched.

## User

Re-running the check

## Assistant

_[tool: ready_for_verification]_

Verification re-run started on `Detail Viewer.html`.

## User

Can you remove Unit Scale Factor, Original Name, and component ID. This doesn't need to be visible in the app

## Assistant

_[tool: dc_js_str_replace]_

## User

They are still visible, please remove

## Assistant

The skip list was added but the bundle wasn't rebuilt.

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Rebuilt the bundle — those three rows are now filtered out of the panel. Reload the viewer to pick it up.

## User

Can you make sure these product information settings are saved to the app so that all imported models can link their product information successfully

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now hook the save into load, and seed component extras from storage.

_[tool: dc_js_str_replace]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Product information is now saved with each imported model.

- After a model loads, its model-level info (name, code, description, supplier, contact, sheet) and the full per-object product map are written back to that import's record in browser storage.
- On restore, those fields come back onto the model spec and the component map — so the picker, search and detail panel link correctly across reloads and PC/iPad/Phone switches, live model data still winning over the saved copy.
- Linked PDF bytes aren't duplicated in the saved record (they stay in the stored .glb and re-attach on load), so storage doesn't balloon.

## User

can you remove the circles around the enter button.

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: dc_html_str_replace]_

Removed the ring around the Enter button.

## User

not quite. Remove the circle button and outside rings.

## Assistant

_[tool: read_file]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

Enter is now plain text — no circle button, no rings.

## User

now can you show the strip light effect underneath the enter button, exactly same as under the Glenvill Homes Logo to the top left of the dark grey banner in the viewers

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Added the same 1px white gradient rule under Enter — it sweeps out from the centre on hover, identical timing and easing to the logo strip in the viewer header.

## User

can you now permanently remove the hammer object for all viewers

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Hammer removed from all three viewers (source, bundle, Dark): its registry entry and the procedural geometry are gone, and the viewer now starts empty until a `.glb` is imported. Imported models can also be removed down to zero now.

## User

Found issues — fixing…

## Assistant

_[tool: read_file]_

_[tool: dc_js_str_replace]_

_[tool: grep]_

_[tool: run_script]_

_[tool: grep]_

_[tool: read_file]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Fixed: restored imports now select and actually load once IndexedDB resolves (the empty registry no longer leaves a blank viewport), the stepper stays hidden when nothing is loaded, and the header/active-view holes fall back to empty-state labels. Bundle rebuilt.

## User

Found issues — fixing…

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: grep]_

_[tool: dc_html_str_replace]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

`loadModel()` now records the spec it actually loaded, and `restoreImports()` re-loads whenever that doesn't match the selected model (or the scene is empty) — so restored imports get their geometry. The stage stepper is hidden outright when a model has no stages. Bundle rebuilt.

## User

can you find the linked pdf detail in the balcony parapet GLB file i just imported and connect it to the 2D detail viewer function

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

Wiring the GLB's linked PDF into the 2D pane.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

On load, the viewer now looks for a `linkedDetail` PDF in the GLB (asset-level `productInfo` first, then the outermost node carrying one), decodes it, and uses it as that model's 2D detail sheet — so the 2D/3D toggle becomes available with no separate image asset, and the sheet title/meta come from the PDF's file name and size. PDFs render in the pane's own viewer (its zoom/pan), images keep the existing drag-zoom. The blob URL is per-session and regenerated on each load, so nothing stale is stored.

## User

Found issues — fixing…

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: dc_html_str_replace]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Fixed both: the zoom slider/magnifiers are hidden for PDF sheets (the PDF's own toolbar owns zoom) with matching prompt copy, and `sheetTitle` is now exposed so the image `alt` and iframe `title` carry the sheet name. Bundle rebuilt.

## User

extract the embedded PDF from a GLB's extras.productInfo.linkedDetail.dataBase64

## Assistant

_[tool: list_files]_

_[tool: run_script]_

_[tool: copy_files]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: delete_file]_

I parsed the GLB in `uploads` (`Balcony Parapet Detail (3)-optimized.glb`) — there is **no PDF in it to extract**:

- No `productInfo` anywhere: the string `productInfo`/`dataBase64` doesn't appear in the file's JSON at all.
- The 33 nodes with extras carry only `originalName`, `transformData`, `componentId`, `originalMaterial`, `canonicalGeometry`, plus `buildStageId/Name/Order`.
- Root `extras.buildStages` has the stage summary (STAGE 1 … with objectNames). Asset extras are empty (`generator: glTF-Transform v4.4.2`).

So this export predates the Material Editor's product-info writing, or that pass was skipped/stripped by the glTF-Transform optimisation. The viewer code is ready — re-export with product info attached and it will pick up both the panel fields and the linked PDF.

Two options meanwhile: I can wire `uploads/Balcony Detail.pdf` in as the 2D sheet for this model directly, or you re-export the GLB. Which?

## User

can you try link the pdf again

## Assistant

_[tool: list_files]_

_[tool: copy_files]_

_[tool: grep]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

The GLB still carries no `productInfo`/`linkedDetail`, so I linked your uploaded PDF instead: `assets/balcony-parapet-detail.pdf` is now attached as the 2D detail sheet for any model whose name matches "balcony parapet", shown in the PDF pane with title "Balcony Parapet Detail".

Embedded-PDF extraction stays first in line — re-export with product info and the GLB's own sheet takes over automatically. The shipped-sheet list is one line per model if you want to add more.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: grep]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: dc_js_str_replace]_

_[tool: super_inline_html]_

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

The preload-link route didn't survive bundling, so I embedded the PDF instead: `sheet-assets.js` carries its base64 bytes and the viewer decodes it to a blob at load — same path as an embedded `linkedDetail`. Bundle is now 2.4 MB and fully self-contained (no `assets/` fetch), and a missing/undecodable sheet clears `spec.sheet` rather than showing a blank 2D pane.

## User

can you try link now

## Assistant

_[tool: list_files]_

_[tool: eval_js_user_view]_

_[tool: eval_js_user_view]_

_[tool: eval_js_user_view]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: delete_file]_

_[tool: str_replace_edit]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Your new import ("Balcony Parapet Detail (12)", exported by THREE.GLTFExporter r185) **does** carry product info — 188 nodes with `productInfo`, and the node "Axon Cladding" holds the linked PDF (`Typical Balcony Detail.pdf`, 250 KB, application/pdf). That's what the 2D pane now loads.

Two fixes made it work: the sheet guard was returning early once any sheet had been resolved, so the model's own embedded PDF never got read — a model-embedded detail now always supersedes. The temporary shipped stand-in and its 400 KB embed are removed, so the bundle is back to 2.0 MB.

Reload the viewer and switch to 2D on that model.

## User

Re-running the check

## Assistant

_[tool: ready_for_verification]_

Verification re-run started on `Detail Viewer.html`.

## User

Re-running the check

## Assistant

_[tool: ready_for_verification]_

Verification re-run started on `Detail Viewer.html`.

## User

instead of grabbing the PDF file from the GLB, I'd like to manually import into this viewer instead like the 3D model. Could you add an import PDF button to the top right of the 2D viewer screen. Make it function exactly the same as the import model button

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: run_script]_

_[tool: grep]_

Now the button and the empty-2D state.

_[tool: run_script]_

_[tool: dc_html_str_replace]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Added an **Import PDF** button at the top right of the 2D viewer, mirroring Import Model exactly: same password gate (one unlock per session), same native file picker (`.pdf` only), same IndexedDB persistence — the sheet is stored on that model's import row, so it comes back on reload and across PC/iPad/Phone.

Also: the 2D toggle is now available for any loaded model (previously it needed a sheet to exist), showing a "No detail sheet" state with the import button; the label reads "Replace PDF" once one is attached; and an imported PDF takes precedence over anything embedded in the GLB.

## User

Re-running the check

## Assistant

_[tool: ready_for_verification]_

Verification re-run started on `Detail Viewer.html`.

## User

the replace PDF still isnt working

## Assistant

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

Found it: the pan handler calls `preventDefault()` on any pointerdown in the 2D pane, which swallowed the button's click.

_[tool: dc_js_str_replace]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

The 2D pane's drag-pan handler was calling `preventDefault()` on every pointerdown inside it, cancelling the Import/Replace PDF button's click (and the PDF iframe's own interactions). It now ignores pointerdowns on buttons, links, inputs and the iframe. Bundle rebuilt — reload and try Replace PDF.

## User

can you remove the original PDF link from the GLB file so its empty first

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: read_file]_

Removing the now-dead shipped-sheet path too.

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

The viewer no longer pulls any PDF out of the GLB. A model now loads with an empty 2D pane ("No detail sheet") until you attach one with Import PDF, and switching models clears any sheet the previous one left behind. Imported sheets still persist per model. Bundle rebuilt.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Both fixed: sheets are now only restored when stamped by a manual import, so the PDF the old auto-attach left on your existing import is dropped (and cleared from storage) — that model opens on "No detail sheet". The 2D prompt copy no longer claims the sheet came from the model file.

## User

Re-running the check

## Assistant

_[tool: ready_for_verification]_

Verification re-run started on `Detail Viewer.html`.

## User

Found issues — fixing…

## Assistant

_[tool: read_file]_

_[tool: read_file]_

_[tool: dc_js_str_replace]_

_[tool: grep]_

_[tool: dc_js_str_replace]_

_[tool: grep]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Fixed the wedge: the auto-open decision no longer infers "nothing loaded" from an empty scene (a legitimate steady state now that there's no built-in model) — it's a one-shot `_autoOpened` flag. The restored model is also opened on a deferred tick so the shell paints and stays interactive before the 41 MB GLB parse begins. Bundle rebuilt.

## User

it says this page has been blocked by microsoft edge

## Assistant

_[tool: grep]_

_[tool: dc_html_str_replace]_

_[tool: read_file]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Edge blocks blob-URL PDFs inside an `<iframe>`, so the sheet now renders in an `<embed type="application/pdf">` (Edge's PDF handler accepts it), with an "Open in new tab" button beside Import PDF as a fallback if a policy blocks inline PDFs entirely.

Your screenshot was also a stale cached bundle — the copy read "Linked detail sheet from the model file" and the Import PDF button was absent. Hard-reload the viewer.

Heads up: usage quota is at 90% — this is a safe stopping point.

## User

Re-running the check

## Assistant

_[tool: ready_for_verification]_

Verification re-run started. Usage quota is at 92% — this is a safe stopping point.

## User

why is it not working? the 3D model can be imported successfully from the same location?

## Assistant

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

Edge blocks plugin/blob PDFs inside the sandboxed frame — so I'll rasterize the PDF instead of embedding it.

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: run_script]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

## User

Found issues — fixing…

## Assistant

_[tool: dc_js_str_replace]_

_[tool: run_script]_

