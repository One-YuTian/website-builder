# Website Builder Beta — 0.8.0

Prebuilt Codex desktop plugin; no npm install or system Node required. Runtime is provided by Codex.

Register this repository at ref `beta` using `codex plugin marketplace add https://github.com/One-YuTian/website-builder.git --ref beta`, then `codex plugin add codex-website-builder@website-builder-beta`.

Marketplaces: `.agents/plugins/marketplace.json` and `.codex-plugin/marketplace.json`; plugin path: `./codex-website-builder`.

Projects and SQLite metadata persist outside versioned plugin installs. Windows defaults to `%LOCALAPPDATA%/codex-website-builder`; macOS/Linux use `${XDG_DATA_HOME:-~/.local/share}/codex-website-builder`. Set WEBSITE_BUILDER_DATA_DIR to override the data directory or WEBSITE_BUILDER_PROJECT_ROOT for project output. Legacy projects are copied into the persistent directory without deleting originals or overwriting existing projects.

Version 0.8.0 adds the frosted project library, top-aligned image previews, original-image and current full-page screenshot copying, width-first canvas fitting, and Windows directory activation fixes. See `codex-website-builder/CHANGELOG-0.8.0.md`.

Windows Codex managed Node tested; macOS launcher provided but no macOS host available for execution testing.
