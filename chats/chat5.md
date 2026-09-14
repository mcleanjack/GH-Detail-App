# Hide empty model information

_Started 2026-09-07 23:53 UTC_

---

## User

Continuing from "Removing placeholder models".

## Assistant

We've been building out a **3D Architectural Detail Viewer** for Glenvill Homes with full device-mode support and model import/removal workflows.

**Core work completed:**
- Three-device layout system (PC/iPad/Phone landscape) with bezel previews, all driven by a single mode token table; manual selection always wins over breakpoints, and window scale-down is proportional, never reflow.
- Password-protected Import Model and Remove Model functions (password: `GHmasters`, SHA-256 hashed) sitting in a footer below the model list; both unlock in one session.
- Imported GLB files route through the existing pipeline (scene graph traversal, component detection, hover/click/isolation/cycle interaction, product-data lookup, orbit/pan/zoom, 2D/3D views) — no separate viewer or interaction system.
- Single-tap component selection on tablet/phone (no double-tap preview); drawer opens automatically on select, closes on tap-away; removed hamburger toggle.
- Refined home screen with device selector pills, recessed "Enter" button that routes to the viewer with the chosen mode persisted in `localStorage` and querystring.
- Left panels narrowed 20% on phone (drawer unchanged), widened 20% on PC/iPad.
- Wordmark now displays unchanged with only a white rule that wipes in/out on hover (no glow, no lift).

**Current state:**
Detail Viewer.html is the bundled standalone, sourced from Detail Viewer Standalone Source.dc.html. Home Screen.dc.html is the entry point. All three modes (PC/iPad/Phone) share one layout logic and read `?device=` querystring first, then fall back to `localStorage.gv.deviceMode`. The white rule wipe sits absolutely positioned below the logo, leaving the wordmark itself static.

**Open:** UI densities on phone (specs table stacking, dropdown row height, Import button sizing) and tablet (same, less acute) could use a follow-up refinement pass once real content is live.

Files: Detail Viewer Standalone Source.dc.html, Detail Viewer.html, Home Screen.dc.html, support.js, product-data.js.

## User

Some model elements that I upload won't have any information. For the model elements that don't can you edit so that information that isn't assigned doesn't appear when the model element is selected. Please apply this to all versions

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: run_script]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: grep]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Unassigned fields now vanish rather than showing blanks or `undefined`: description paragraph, spec rows, the whole Documents block (needs host + slug), and the Supplier block — with contact, phone, and email each gated individually, and the section header hidden entirely if nothing is assigned. Applied to the standalone source, the dark variant, and rebundled `Detail Viewer.html`.

## User

Re-running the check

## Assistant

_[tool: ready_for_verification]_

Check re-running in the background.

## User

Found issues — fixing…

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Selecting a component now always opens the panel with its glTF node name as the heading, even when the model has no product-data entry — the section flags hide whatever's unassigned. Applied to both sources and rebundled.

## User

what is the publish as artifact tool?

## Assistant

I don't have a "publish as artifact" tool. What I can do with a finished design:

- **Standalone HTML** — bundle everything into one self-contained file that works offline (that's what `Detail Viewer.html` is)
- **Download** — hand you the file or the whole project as a zip
- **Public link** — a short-lived URL to a file, mainly for feeding into other services
- **PDF / PPTX export** — for docs and decks

If you saw that label somewhere in the app UI, tell me where and I'll point you at the closest equivalent.

## User

no i'm wondering if this is the best option for me to export so that I can see if it runs successfully and I can import models ok

## Assistant

Yes — `Detail Viewer.html` is the right thing to test with. It's fully self-contained (three.js, fonts, logo, product data all inlined), so:

- Download it, double-click, it runs offline in any browser — no server needed.
- Model import reads your GLB straight off disk via the file picker, so that path works the same locally as it does here.
- Password unlock and device-mode persistence use `localStorage`, which works fine from a `file://` page.

One caveat: imported models live only in that browser session/profile — the file itself doesn't store them, so each tester re-imports. If you want models baked in permanently, send me the GLBs and I'll embed them in the bundle.

Want me to generate the download now?

## User

yes

## Assistant

_[tool: present_fs_item_for_download]_

Download's ready above — open it straight from your Downloads folder and try an import.

## User

when i import a GLB file, i do not see the imported 3D model in the viewer. Can you fix

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: grep]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Three changes to the import path:

- The GLB loader is now loaded up front with the rest of three.js, instead of being fetched on demand at import time — in the bundled standalone that late fetch could fail to resolve, which silently dropped you back to the placeholder.
- Your file is read into memory and parsed directly, rather than going through a temporary blob URL — more reliable from a `file://` page.
- Failures are no longer silent: a dismissible "Import failed" banner appears in the viewport with the actual reason, so we can tell a bad path from an unsupported file.

Re-download and try again. If the banner appears, tell me what it says — a GLB using Draco or KTX2 compression needs extra decoders, and I'll add them.

## User

this popped up

## Assistant

_[tool: run_script]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

That error means your GLB uses Draco compression. Added the Draco decoder, plus KTX2 (compressed textures) and Meshopt, wired into the loader — those cover essentially every GLB export option.

One caveat: the decoders are fetched from a CDN on first use, so that import needs an internet connection. Everything else still works offline. Re-download and try again.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Real fix for the unassigned-fields issue: imported models no longer carry synthesised placeholder data (no boilerplate description, no "Not specified" supplier, no em-dash contact rows, no dead document links), and the gates now treat blanks, dashes, and "not specified"/"N/A"/"TBC" as unassigned wherever they appear — including individual spec-table rows.

So an unmapped component now shows just its name; sections appear only as you map real data. Rebundled — re-download.

## User

I've imported the model in now successfully but I can't selected each model component individually, and I can't cycle through the stages which the model is set up for in its GLB file

## Assistant

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Both were hardcoded to the placeholder model. Now:

**Component picking** — indexing walks through exporter wrapper nodes (`Scene`, `RootNode`, `Group`, `Armature`, etc.) instead of stopping at the first named node, and if your model arrives as a single named wrapper it keeps descending until the real parts are exposed. Duplicate names get numbered rather than collapsing into one.

**Stages** — read from the GLB, in this order:
1. Animation clips — each clip becomes a stage and plays when you step to it.
2. Nodes named `Stage 2` / `Step_03` / `Phase 1` — shown cumulatively, so stepping back peels the assembly apart.
3. Neither — the prev/next buttons and the counter hide themselves.

The counter shows the real total, not `/ 03`.

Re-download and check the browser console — it logs the component names it found for the loaded model, which tells us immediately if your naming needs a different rule.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Stage detection now tries five conventions in order, so it should catch however your GLB expresses them:

1. Animation clips — one clip per stage.
2. Nodes named `Stage/Step/Phase/Seq n`, anywhere in the graph.
3. Numbered top-level groups — `1_Frame`, `Slab 02`, `C-3`.
4. Any 2–12 top-level groups that each contain their own parts — the groups become stages, their children the selectable components.
5. Separate glTF scenes.

Case 4 is the one most likely to catch a five-part model with plainly named groups.

If it still doesn't show five, run `window.__viewerStages` in the console after importing — it reports the clips, the top-level node names with their child counts, and which rule won. Paste that back and I'll match your naming exactly.

## User

Found issues — fixing…

## Assistant

_[tool: read_file]_

_[tool: run_script]_

_[tool: grep]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: list_files]_

_[tool: copy_files]_

_[tool: run_script]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Read the file directly — that settled it. The GLB has no animation clips and no hierarchy: 40 flat root nodes with the stage encoded in each name (`STEP_1_-_BALCONY_JOISTS`, `Fibre_Cement_Sheet_Upstand_STEP_2_-_WALL_SUBSTRATE`, …). My detector was treating every matching node as its own stage, so it saw 33, not 5.

Now:
- Nodes are **grouped by stage number** — 5 stages (6, 2, 2, 1, 1 parts plus later ones), shown cumulatively, so stepping back peels the build sequence apart. Parts with no `STEP_n` (soffit lining, pipe bend) stay visible throughout.
- Component names are decoded for display: `Floor_Beam_STEP_1_-_FLOOR_BEAM_314872` → **Floor Beam**, `GH_-_Balcony_Drain_STEP_3_-_BALCONY_DRAIN_333660` → **GH - Balcony Drain**. Exporter ids, stage prefixes, and the repeated tail are stripped.
- `__COMPONENT_EDGES__` is excluded from picking and shows only on the final stage, so intermediate stages don't reveal outlines of parts not yet built.

Press **D** over the viewport for the structure readout if anything looks off.

Since you've now given me the model: want me to embed it as a built-in so it loads on open, no import needed? And those decoded names are the keys product data maps to — say the word and I'll scaffold entries for all 33.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: run_script]_

_[tool: grep]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

Unnumbered geometry no longer floats across every stage. Each stray part now joins a single stage, decided in two passes:

1. **By wording** — a stray sharing terms with numbered parts follows them, so `GH - Pipe Bend` lands with the STEP 3 drainage parts.
2. **By geometry** — anything left is placed in the stage whose own geometry encloses its centre, or the nearest one; that puts the soffit lining and the parapet-face layer where they belong instead of at stage 1.

Nothing falls back to "always visible" anymore. The two dead rule bodies are gone. Press **D** to see the assignments it made — the readout now lists them.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: update_todos]_

_[tool: super_inline_html]_

_[tool: update_todos]_

_[tool: ready_for_verification]_

Both fixed:

- **Stray placement** — containment alone is no longer treated as evidence, since every stage's bounds span the whole detail. A stage now has to hug the part tightly (smallest containing bounds, and appreciably smaller than the widest stage) to claim it; otherwise the part defers to the last stage. So the big instanced surfaces stop appearing at Stage 1, and Stage 1 reads as framing only. The name pass still resolves the soffit lining and pipe bend to Stage 3.
- **`AuxScene`** — nodes that contain claimed geometry are now skipped as wrappers, so the scene root can never be staged.

The **D** readout labels each assignment with how it was decided: `(name)`, `(bounds)`, or `(unresolved, deferred)`.

Worth noting: deferring is a safe default, not a correct answer — those five instanced nodes carry no stage information in the file at all. If you can add `STEP_n` to their names in the export, they'll slot in exactly.

Also: I'm at the usage limit for this session, so this is a good place to pause.

## User

Found issues — fixing…

## Assistant

Root cause: in a layered detail every stage's bounding box spans the whole detail, so containment carries no signal — and "smallest containing box" always resolves to the framing stage, which is inherently the smallest. One edit: stop picking a winner from ambiguous containment.

_[tool: run_script]_

