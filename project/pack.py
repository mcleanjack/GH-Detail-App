#!/usr/bin/env python3
"""
Reproduces Claude Design's `super_inline_html` bundler for this project:
inlines "Detail Viewer Standalone Source.dc.html" (support.js, product-data.js,
assets/*, Toolbar Buttons.dc.html, OrbitCube.jsx, Google Fonts, pdf.js,
react/react-dom/babel) into a single self-contained "Detail Viewer.html",
matching the __bundler/manifest + __bundler/ext_resources + __bundler/page_order
+ __bundler/template format the existing bundle already uses.

three.js stays a LIVE import from unpkg (via the <script type="importmap">) —
that's how the shipped bundle already works too. ES module specifiers can't be
redirected to embedded blob: URLs the way classic <script src> / <img src> /
CSS url() references can, so the original compiler leaves it live and so do we.

Usage:
    python3 pack.py                     # rebuild Detail Viewer.html from the .dc.html source
    python3 pack.py --refresh-cdn       # also re-fetch fonts/pdf.js/react/react-dom/babel over the network
    python3 pack.py --out /tmp/test.html --shell "Detail Viewer.html"

How CDN caching works: the first run bootstraps a local `.pack_cache.json` by
lifting the already-embedded font/pdf.js/react/react-dom/babel blobs out of
--shell (defaults to the current "Detail Viewer.html"), so a normal rebuild
after a local edit (CSS/JS/asset tweak) needs no network access at all. Pass
--refresh-cdn to force re-fetching those from the network instead.
"""
import argparse
import base64
import gzip
import json
import mimetypes
import os
import re
import sys
import urllib.request
import urllib.parse
import uuid as uuidlib

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_PATH = os.path.join(PROJECT_DIR, ".pack_cache.json")

COMPRESSIBLE_MIMES = {
    "application/javascript", "text/javascript", "text/html", "text/css",
    "text/plain", "image/svg+xml",
}

EXT_MIME = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".gif": "image/gif", ".svg": "image/svg+xml",
    ".js": "application/javascript", ".jsx": "application/javascript",
    ".html": "text/html", ".htm": "text/html",
    ".woff2": "font/woff2", ".woff": "font/woff", ".css": "text/css",
}


def guess_mime(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in EXT_MIME:
        return EXT_MIME[ext]
    guessed, _ = mimetypes.guess_type(path)
    return guessed or "application/octet-stream"


def dumps_html_safe(obj):
    """json.dumps, but with '</' escaped as '<\\u002F' so a literal '</script>'
    (or '</head>', etc.) inside the JSON string can't prematurely close the
    real <script type="__bundler/template"> element it's embedded in."""
    return json.dumps(obj).replace("</", "<\\u002F")


def new_uuid():
    return str(uuidlib.uuid4())


def make_entry(data_bytes, mime):
    compress = mime in COMPRESSIBLE_MIMES
    payload = gzip.compress(data_bytes, mtime=0) if compress else data_bytes
    return {"mime": mime, "compressed": compress, "data": base64.b64encode(payload).decode("ascii")}


def decode_entry(entry):
    raw = base64.b64decode(entry["data"])
    if entry.get("compressed"):
        raw = gzip.decompress(raw)
    return raw


def find_block(html, name):
    m = re.search(r'<script type="' + re.escape(name) + r'"[^>]*>', html)
    if not m:
        raise ValueError(f"block {name!r} not found in shell")
    start = m.end()
    end = html.index("</script>", start)
    return html[start:end], m.start(), end


def replace_block(html, name, new_text):
    _, start, end = find_block(html, name)
    tag_end = html.index(">", start if start >= 0 else 0)
    # start here is the '<script ...>' match start; recompute tag end precisely
    m = re.search(r'<script type="' + re.escape(name) + r'"[^>]*>', html)
    open_tag_end = m.end()
    close_tag_start = html.index("</script>", open_tag_end)
    return html[:open_tag_end] + "\n" + new_text + "\n" + html[close_tag_start:]


def fetch_url(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 pack.py"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
        ctype = resp.headers.get("Content-Type", "").split(";")[0].strip()
    return data, (ctype or None)


class Cache:
    """CDN-resource cache, keyed by URL/spec string, persisted to .pack_cache.json."""

    def __init__(self, path):
        self.path = path
        self.data = {}
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                self.data = json.load(f)

    def save(self):
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self.data, f)

    def bootstrap_from_shell(self, shell_html, source_text, ext_resource_ids):
        """Populate cache from an existing bundle's manifest: ext_resources-backed
        specs (react/react-dom/babel, keyed by id), plus direct-substitution
        <script src="..."> tags (e.g. pdf.js) matched positionally between the
        raw source and the shell's already-substituted template."""
        manifest = json.loads(find_block(shell_html, "__bundler/manifest")[0])
        ext_resources = json.loads(find_block(shell_html, "__bundler/ext_resources")[0])
        by_id = {urllib.parse.unquote(e["id"]): e["uuid"] for e in ext_resources}
        for spec in ext_resource_ids:
            if spec in self.data:
                continue
            uid = by_id.get(spec)
            if uid and uid in manifest:
                self.data[spec] = manifest[uid]

        # Direct-substitution <script src="..."> tags: pair them up positionally
        # between the raw source (original URLs) and the shell template (UUIDs).
        template = json.loads(find_block(shell_html, "__bundler/template")[0])
        source_srcs = re.findall(r'<script src="([^"]+)">', source_text)
        template_uuids = re.findall(r'<script src="([0-9a-f-]{36})">', template)
        for src, uid in zip(source_srcs, template_uuids):
            if src.startswith("http") and src not in self.data and uid in manifest:
                self.data[src] = manifest[uid]

        # Google Fonts: bootstrap the already-inlined @font-face style block + its
        # woff2 entries verbatim, keyed by the exact fonts.googleapis.com href.
        style_match = re.search(r"<style>/\* [a-z-]+ \*/\n@font-face.*?</style>", template, re.S)
        if style_match and "__google_fonts_style__" not in self.data:
            style_text = style_match.group(0)
            uuids_in_style = set(re.findall(r'url\("([0-9a-f-]{36})"\)', style_text))
            fonts_manifest = {u: manifest[u] for u in uuids_in_style if u in manifest}
            self.data["__google_fonts_style__"] = style_text
            self.data["__google_fonts_manifest__"] = fonts_manifest

    def get(self, spec):
        return self.data.get(spec)

    def set(self, spec, entry):
        self.data[spec] = entry


def embed_local_file(path, manifest):
    with open(path, "rb") as f:
        raw = f.read()
    mime = guess_mime(path)
    uid = new_uuid()
    manifest[uid] = make_entry(raw, mime)
    return uid


def embed_remote(spec, manifest, cache, refresh):
    cached = None if refresh else cache.get(spec)
    if cached is not None:
        entry = cached
    else:
        raw, ctype = fetch_url(spec)
        mime = ctype or guess_mime(spec)
        entry = make_entry(raw, mime)
        cache.set(spec, entry)
    uid = new_uuid()
    manifest[uid] = entry
    return uid


def inline_google_fonts(html_text, manifest, cache, refresh):
    m = re.search(r'<link href="(https://fonts\.googleapis\.com/css2\?[^"]*)" rel="stylesheet">', html_text)
    if not m:
        return html_text
    href = m.group(1)

    use_cache = (not refresh) and cache.get("__google_fonts_style__") is not None
    if use_cache:
        style_text = cache.data["__google_fonts_style__"]
        fonts_manifest = cache.data["__google_fonts_manifest__"]
        # re-mint fresh uuids so repeated builds don't collide, remapping the style text
        remap = {}
        def remap_uuid(mo):
            old = mo.group(1)
            new = remap.setdefault(old, new_uuid())
            return f'url("{new}")'
        style_text = re.sub(r'url\("([0-9a-f-]{36})"\)', remap_uuid, style_text)
        for old, new in remap.items():
            manifest[new] = fonts_manifest[old]
    else:
        css_bytes, _ = fetch_url(href)
        css_text = css_bytes.decode("utf-8")

        def replace_font_url(mo):
            font_url = mo.group(1)
            font_bytes, ctype = fetch_url(font_url)
            mime = ctype or "font/woff2"
            uid = new_uuid()
            manifest[uid] = make_entry(font_bytes, mime)
            return f'url("{uid}")'

        style_text = "<style>" + re.sub(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", replace_font_url, css_text) + "</style>"
        cache.set("__google_fonts_style__", style_text)
        style_uuids = set(re.findall(r'url\("([0-9a-f-]{36})"\)', style_text))
        cache.data["__google_fonts_manifest__"] = {u: manifest[u] for u in style_uuids}

    return html_text[:m.start()] + style_text + html_text[m.end():]


def build_template(source_path, manifest, ext_resources, cache, refresh):
    with open(source_path, encoding="utf-8") as f:
        html = f.read()

    # The __bundler_thumbnail <template> is only a preload placeholder for the
    # bundle shell (already present there, unchanged) — strip it from the page.
    html = re.sub(r'<template id="__bundler_thumbnail"[^>]*>.*?</template>\n?', "", html, flags=re.S)

    # 1. Local <script src="..."> / plain relative-path files referenced directly.
    #    support.js is the dc-runtime bootstrap; mime kept as text/javascript to
    #    match the shipped bundle's convention (cosmetic only — both mimes run
    #    identically as classic scripts).
    for rel, mime_override in [("./support.js", "text/javascript"), ("support.js", "text/javascript"), ("product-data.js", None)]:
        pattern = f'src="{re.escape(rel)}"'
        if re.search(pattern, html):
            path = os.path.join(PROJECT_DIR, rel.lstrip("./"))
            with open(path, "rb") as f:
                raw = f.read()
            mime = mime_override or guess_mime(path)
            uid = new_uuid()
            manifest[uid] = make_entry(raw, mime)
            html = re.sub(pattern, f'src="{uid}"', html, count=1)

    # 2. assets/*.png|jpg referenced anywhere (style url(...) or src="...").
    #    Large content files (built-in .glb models, PDF sheets) are excluded —
    #    those are meant to stay separate static files fetched on demand
    #    (e.g. spec.url in a MODELS entry), not inlined into the HTML bundle.
    #    The PWA icons are excluded too: manifest.webmanifest references them
    #    by their real path, and Safari's "Add to Home Screen" reads the
    #    apple-touch-icon <link> href directly — inlining would replace that
    #    path with a bundler UUID that's only meaningful to this page's own
    #    unpacker script, not to manifest.webmanifest or Safari.
    NOT_INLINED_EXTS = (".glb", ".gltf", ".pdf")
    NOT_INLINED_NAMES = {"assets/icon-192.png", "assets/icon-512.png"}
    for m in sorted(set(re.findall(r"assets/[A-Za-z0-9._%-]+", html))):
        if m.lower().endswith(NOT_INLINED_EXTS) or m in NOT_INLINED_NAMES:
            continue
        asset_path = os.path.join(PROJECT_DIR, m)
        if os.path.exists(asset_path):
            uid = embed_local_file(asset_path, manifest)
            html = html.replace(m, uid)

    # 3. <x-import ... from="./Something.jsx?v=N"> — strip query + "./", embed, and
    #    rewrite to "<uuid>#/Something.jsx" (matches the shipped bundle's convention).
    def replace_ximport(mo):
        raw_from = mo.group(1)
        clean = raw_from.split("?")[0]
        basename = clean.lstrip("./")
        local_path = os.path.join(PROJECT_DIR, basename)
        uid = embed_local_file(local_path, manifest)
        return f'from="{uid}#/{basename}"'

    html = re.sub(r'from="(\.?/?[A-Za-z0-9._%-]+\.jsx(?:\?[^"]*)?)"', replace_ximport, html)

    # 4. <dc-import name="X" ...> — resolve "./X.dc.html" as an ext_resources id.
    for name in sorted(set(re.findall(r'<dc-import name="([^"]+)"', html))):
        dc_path = os.path.join(PROJECT_DIR, f"{name}.dc.html")
        if os.path.exists(dc_path):
            uid = embed_local_file(dc_path, manifest)
            spec_id = "./" + urllib.parse.quote(f"{name}.dc.html")
            ext_resources.append({"id": spec_id, "uuid": uid})

    # 5. Any remaining remote <script src="https://...">, e.g. pdf.js from cdnjs —
    #    direct substitution (same treatment as local scripts, just fetched/cached).
    html = re.sub(
        r'<script src="(https://[^"]+)">',
        lambda mo: f'<script src="{embed_remote(mo.group(1), manifest, cache, refresh)}">',
        html,
    )

    # 6. Google Fonts <link> — inline as a <style> block with embedded woff2s.
    html = inline_google_fonts(html, manifest, cache, refresh)

    # 7. Hardcoded CDN deps referenced only from *within* support.js (react/react-dom/babel):
    #    these never appear literally in the template, so they only need manifest +
    #    ext_resources entries (the dc-runtime resolves them by URL at runtime).
    support_js_path = os.path.join(PROJECT_DIR, "support.js")
    with open(support_js_path, encoding="utf-8") as f:
        support_text = f.read()
    for url in sorted(set(re.findall(r"https://unpkg\.com/[^\s\"'`)]+", support_text))):
        uid = embed_remote(url, manifest, cache, refresh)
        ext_resources.append({"id": url, "uuid": uid})

    return html


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=os.path.join(PROJECT_DIR, "Detail Viewer Standalone Source.dc.html"))
    ap.add_argument("--shell", default=os.path.join(PROJECT_DIR, "Detail Viewer.html"))
    ap.add_argument("--out", default=os.path.join(PROJECT_DIR, "Detail Viewer.html"))
    ap.add_argument("--refresh-cdn", action="store_true")
    args = ap.parse_args()

    with open(args.shell, encoding="utf-8") as f:
        shell_html = f.read()

    cache = Cache(CACHE_PATH)
    # bootstrap cache from the shell the first time (or whenever a spec is missing)
    with open(os.path.join(PROJECT_DIR, "support.js"), encoding="utf-8") as f:
        support_text = f.read()
    known_specs = sorted(set(re.findall(r"https://unpkg\.com/[^\s\"'`)]+", support_text)))
    with open(args.source, encoding="utf-8") as f:
        source_text = f.read()
    cache.bootstrap_from_shell(shell_html, source_text, known_specs)

    manifest = {}
    ext_resources = []
    page_order = []

    template_html = build_template(args.source, manifest, ext_resources, cache, args.refresh_cdn)

    cache.save()

    out_html = shell_html
    out_html = replace_block(out_html, "__bundler/manifest", json.dumps(manifest, separators=(",", ":")))
    out_html = replace_block(out_html, "__bundler/ext_resources", json.dumps(ext_resources, separators=(",", ":")))
    out_html = replace_block(out_html, "__bundler/page_order", json.dumps(page_order, separators=(",", ":")))
    out_html = replace_block(out_html, "__bundler/template", dumps_html_safe(template_html))

    with open(args.out, "w", encoding="utf-8") as f:
        f.write(out_html)

    print(f"Wrote {args.out} ({len(out_html)} bytes, {len(manifest)} manifest entries, {len(ext_resources)} ext_resources)")


if __name__ == "__main__":
    main()
