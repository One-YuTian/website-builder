# Website Builder Beta — 0.9.3

Source: dev commit `76bdec9`.

Prebuilt Codex desktop plugin; no npm install or system Node required. Runtime is provided by Codex.

Register this repository at ref `beta` using `codex plugin marketplace add https://github.com/One-YuTian/website-builder.git --ref beta`, then `codex plugin add codex-website-builder@website-builder-beta`.

Marketplaces: `.agents/plugins/marketplace.json` and `.codex-plugin/marketplace.json`; plugin path: `./codex-website-builder`.

Projects and SQLite metadata persist outside versioned plugin installs. Windows defaults to `%LOCALAPPDATA%/codex-website-builder`; macOS/Linux use `${XDG_DATA_HOME:-~/.local/share}/codex-website-builder`. Set WEBSITE_BUILDER_DATA_DIR to override the data directory or WEBSITE_BUILDER_PROJECT_ROOT for project output. Legacy cache projects are not automatically imported or modified.

Version 0.9.1 selects Home layouts with uniform programmatic randomness and no template-call history. Header/Footer remain replaceable; other main sections allow 0–2 changes. Homepage attachments are stored in project files and support resource chips and image previews. This bundle also includes improved prompt focus and preview interactions, bundled R2 configuration, and project status independent of image tasks. Full release history is consolidated in `codex-website-builder/CHANGELOG.md`. GitLab entry points remain temporarily disabled.

The dependency-free launcher and MCP handshake are verified on macOS with the Codex managed Node runtime. Windows launcher compatibility is retained; no Windows host was available for this release.
