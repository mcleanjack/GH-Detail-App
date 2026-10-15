# Prompt: add a new built-in model

Copy everything inside the box below into a new Claude Code session on this
repo. Fill in the four `<…>` placeholders first, and upload/commit the files
to `project/uploads/` before you send it.

```text
Add a new built-in model to the Glenvill 3D Detail Viewer
(github.com/mcleanjack/GH-Detail-App). It must work and display information
exactly like the existing "Balcony Parapet Detail" (code BAL-001). Do not add
new features or change how the viewer looks or behaves.

New model:
- Display name: <MODEL NAME, e.g. Window Head Flashing Detail>
- Code: <UNIQUE CODE, e.g. WIN-001> (must not match any existing MODELS code)
- GLB file: project/uploads/<FILE NAME>.glb
- 2D detail sheet PDF: project/uploads/<FILE NAME>.pdf  (or "none")

Read project/CLAUDE.md first, then follow these steps:

1. Check the GLB before doing anything else. Parse its glTF JSON and report:
   - how many nodes have extras.productInfo (description, supplierName,
     contactName, phone, email, installationManualUrl, productPageUrl,
     linkedDetail). Product info comes ONLY from this; do not add entries
     to product-data.js.
   - the distinct buildStageId / buildStageName / buildStageOrder values and
     how many nodes are in each stage, plus how many nodes have no stage.
   If NO nodes have productInfo, or NO nodes have buildStageId, stop and tell
   me. It is probably an early export and I need to re-export it.

2. Copy the files into project/assets/ with lowercase hyphenated names:
   - assets/<slug>.glb
   - assets/<slug>-sheet.pdf (only if a PDF was given)

3. Add one entry to the static MODELS array in
   "project/Detail Viewer Standalone Source.dc.html", right after the
   Balcony Parapet Detail entry and in the same format:
     { name: "<MODEL NAME>", code: "<CODE>",
       url: "assets/<slug>.glb",
       shippedSheet: "assets/<slug>-sheet.pdf" }
   Leave out shippedSheet if there is no PDF. Do not change any other viewer
   code.

4. List the component names the panel will show (run the GLB node names
   through Component.prettyName and the same de-duplication the viewer uses).
   Point out any that read badly, like manufacturer/part-number strings or
   numbered duplicates. Suggest NAME_OVERRIDES / NO_DEDUPE_SUFFIX entries
   like the existing "Tile Pedestals" and "Floor Beam" ones, but ask me
   before adding them, and don't change the existing ones.

5. Rebuild the shipped bundle: cd project && python3 pack.py
   Never edit "Detail Viewer.html" by hand. Make sure the rebuilt bundle
   contains the new MODELS entry and that the .glb/.pdf are referenced by
   path, not inlined.

6. Check it works. Serve the repo root (python3 -m http.server) and load
   /project/Detail%20Viewer.html with Playwright/Chromium:
   - the new model appears in the MODEL picker and loads with no console
     errors
   - Balcony Parapet Detail still loads exactly as before
   - clicking a component that has productInfo fills the side panel
     (title, description, supplier/contact block, links)
   - the build-stage stepper (< >) steps through the stages in order
   - the 2D view (square button) shows the PDF sheet, if one was given
   Send me a screenshot of the new model in 3D with a component selected.

7. Commit the assets, the source change and the rebuilt "Detail Viewer.html"
   in one commit ("Add <MODEL NAME> as a built-in model") and push to the
   branch for this session. Don't open a PR unless I ask.

When you're done, give me a short summary: the component names, the stages,
which components have no product info (the panel will show only their name
for those), and anything you weren't sure about.
```
