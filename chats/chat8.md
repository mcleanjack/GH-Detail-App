# Rebuild bundle PDF rasterization

_Started 2026-09-13 22:39 UTC_

---

## User

Continuing from "Linking imported models to viewer".

## Assistant

We've been building the 3D Architectural Detail Viewer for Glenvill Homes. The core pipeline reads GLB models with glTF object properties (`buildStageId`, `buildStageName`, `buildStageOrder`) for stage cycling, per-object `productInfo` extras (description, supplier contact, URLs, linked PDFs) for the detail panel, and now manual PDF import for the 2D sheet viewer.

Key decisions: Product info is persisted to IndexedDB alongside each import so it survives reloads and device-mode switches. Embedded PDFs from GLB `linkedDetail` are decoded client-side and rendered as rasterized images (to bypass browser sandbox restrictions on plugin PDFs). Manual PDF imports override embedded ones and are stored per model. The 2D pane now starts empty ("No detail sheet") until a PDF is imported, with an "Import PDF" button mirroring the 3D model import flow (password gate, native picker, persistent storage).

Current state: The viewer successfully imports both 3D models (41 MB GLBs) and PDFs from the same file path. However, the verifier just flagged an issue — Edge is blocking the PDF rendering path. I rasterized the PDF client-side to bypass sandbox restrictions, but the fix hasn't been bundled yet. The bundle is at 2.0 MB; usage quota is at 92%.

Next: Rebuild the bundle with PDF rasterization and re-test on Edge. This is the last push before a safe stopping point.

Files: Detail Viewer Standalone Source.dc.html, support.js, Detail Viewer.html, sheet-assets.js, CLAUDE.md.

## User

Please continue with rebuild bundle with PDF rasterization

## Assistant

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Bundle rebuilt (2.2 MB) with the client-side PDF rasterization path included, and it's open for you to test the PDF import on Edge.

## User

can you please remove the PDF, so i can test if it works if I re-upload it

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: eval_js_user_view]_

_[tool: eval_js_user_view]_

_[tool: eval_js_user_view]_

_[tool: eval_js_user_view]_

Cleared and reloaded. Worth noting: there was no saved PDF in storage — only the model row ("Balcony Parapet Detail (13)"). So any sheet you were seeing was either in-memory from this session (now gone) or embedded in the GLB itself. The 2D pane should show "No detail sheet" now — go ahead and re-import.

## User

can you remove this button

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Removed the "View linked detail" button from the docs list and re-bundled.

## User

can you remove this button

## User

instead of having a visible button, I would like this to be hidden so that the client can't see it. Instead, could you create a box region highlighted in the image attached that when you double click, it the button activates

## User

Great, now within this button, can you include a "Remove PDF" function option. This is so if I need to make an update on the detail, I can re-upload it

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the menu markup next to the hotspot:

_[tool: dc_html_str_replace]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Double-clicking the hidden hotspot now behaves two ways: with no sheet attached it opens the PDF picker as before; with one attached it opens a small menu offering **Replace PDF**, **Remove PDF**, or Cancel. Remove clears the sheet from the model and from stored imports (password-gated like the other privileged actions), leaving the empty "No detail sheet" pane ready for a re-upload. Bundled.

## User

Can you make the hidden button look nicer when it is activated. Match the import model button style

## Assistant

_[tool: grep]_

_[tool: read_file]_

Restyling the sheet menu to match the dark model dropdown:

_[tool: dc_html_str_replace]_

_[tool: grep]_

_[tool: dc_js_str_replace]_

_[tool: grep]_

Both in scope. Bundling:

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

The sheet menu now matches the model dropdown: same dark gradient panel, inset highlight/shadow, uppercase "Detail Sheet" header (with the current sheet name on the right), and inset-bordered rows with the same green upload and clay trash icons plus the PDF/Locked hint. Bundled.

## User

can you remove the "(13) text from the title

## Assistant

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Trailing "(n)" suffixes are now stripped from model names — both on import and when loading already-stored models, so the title reads "Balcony Parapet Detail". Bundled.

## User

I like how when the viewer is first loaded there is no model displaying. Could you add some sort of text that instructs the client to pick a model from the model button. Make this look beautiful, sophisticated and smart. Because a model hasn't been selected, I'd like the 3D model title at the bottom left of the screen to be blank

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: grep]_

_[tool: dc_html_str_replace]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Added a centered empty state in the 3D stage — hairline "Detail Library" rule, corner-ticked wireframe cube mark, "No detail selected", and a line directing to the Model menu with a softly nudging arrow, all in the existing graphite/greige palette and fading up on load. The bottom-left badge now shows no "3D" glyph, no "Active view" kicker and no title until a model is loaded.

## User

Found issues — fixing…

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: grep]_

_[tool: grep]_

Both edits landed. Top-right label when nothing picked:

_[tool: str_replace_edit]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Gated on an explicit pick rather than on the stored model's name: restored imports now populate the picker but no longer auto-open, so a fresh load shows the "No detail selected" prompt with a blank bottom-left badge and a "Select a model" label in the top-right menu. Picking or importing a model sets the title and badge as before.

## User

make the "No detail selected" note upper case

## Assistant

_[tool: dc_html_str_replace]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Set to uppercase (with slight letterspacing so it doesn't feel cramped) and re-bundled.

## User

actually, change back to lower case

## Assistant

_[tool: dc_html_str_replace]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Reverted to sentence case and re-bundled.

## User

Can you also change this to lower case

## Assistant

_[tool: dc_html_str_replace]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

I read that as the "DETAIL LIBRARY" kicker above the heading — it now reads "Detail library". If you meant a different label, point me at it.

## User

Can you change to the description title ('Axon cladding") and Supplier Title ("james Hardie") to lower case. Ensure this is applied to all viewer modes

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: grep]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Both now render as authored — "Axon Cladding" and "James Hardie" instead of forced caps. Applied in the standalone source (all three device modes share it) and in Detail Viewer Dark; `Detail Viewer.dc.html` has no info panel, so nothing to change there. Bundled.

