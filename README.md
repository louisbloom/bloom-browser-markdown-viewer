# Project Bloom Markdown Viewer

A Firefox extension that renders GitHub Flavored Markdown files directly in the browser. Pitch black background with syntax highlighting colors inspired by [Charm](https://charm.land)'s glamour dark theme.

All markdown processing happens locally. No data ever leaves your machine.

## Features

- **GFM support**: tables, task lists, strikethrough, autolinks, fenced code blocks
- **Mermaid diagrams**: flowcharts, sequence diagrams, xycharts, and more rendered as SVGs
- **Syntax highlighting**: 37 languages via highlight.js
- **Dark theme**: pitch black background, Charm glamour color palette
- **Local-only**: all processing bundled at build time, zero network requests
- **Line break toggle**: optional mode where single newlines render as `<br>` (persisted across pages)
- **System fonts**: no external font loading

## Prerequisites (build only)

- Node.js (>= 18)
- npm

The built extension has no runtime dependencies outside Firefox.

## Build

```bash
./build.sh
```

This installs dependencies and produces the extension in `dist/`.

## Development

Launch Firefox with the extension loaded as a temporary add-on:

```bash
./build.sh --dev
```

## Tests

```bash
./build.sh --test
```

Or directly:

```bash
npm test
```

## Signing for Permanent Install

Release Firefox requires extensions to be signed. You can self-sign through Mozilla's AMO API without publishing publicly.

### One-time setup

1. Go to https://addons.mozilla.org/developers/addon/api/key/
2. Generate API credentials (JWT issuer + secret)
3. Export them in your shell:

```bash
export AMO_JWT_ISSUER="user:12345:678"
export AMO_JWT_SECRET="your-secret-here"
```

### Sign the extension

```bash
./build.sh --sign
```

This uploads the extension to AMO for automated signing (unlisted channel, never published publicly) and downloads the signed `.xpi` to `web-ext-artifacts/`.

## Install

After building (and optionally signing):

```bash
./install.sh
```

The installer finds your Firefox profile and:

- If a signed `.xpi` exists in `web-ext-artifacts/`, installs that (works on all Firefox editions)
- Otherwise, creates a proxy file pointing to `dist/` (only works on Firefox Developer Edition, Nightly, or ESR with `xpinstall.signatures.required` set to `false` in `about:config`)

Restart Firefox after installing. If prompted, enable the extension.

## Uninstall

```bash
./uninstall.sh
```

Removes the extension from all Firefox profiles. Restart Firefox after uninstalling.

## Viewing Local Files

To render local `.md` files opened via `file://` URLs:

1. Open `about:addons` in Firefox
2. Find "Project Bloom Markdown Viewer"
3. Click the three-dot menu and select "Manage"
4. Enable "Access your data for all websites" (this includes `file://` URLs)

## How It Works

The extension runs a content script on pages matching `*.md` and `*.markdown` URLs. When Firefox displays a raw text file (plain text in a `<pre>` element), the script:

1. Detects the raw text content
2. Parses it as GitHub Flavored Markdown using [marked](https://marked.js.org/)
3. Applies syntax highlighting to code blocks using [highlight.js](https://highlightjs.org/)
4. Renders mermaid diagram blocks as SVGs using [mermaid](https://mermaid.js.org/)
5. Replaces the page with styled, rendered HTML

Pages that are already HTML (e.g., GitHub's rendered markdown view) are left untouched.
