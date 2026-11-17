# Website Builder Beta — 0.8.9

Prebuilt Codex desktop plugin; no npm install or system Node required. Runtime is provided by Codex.

Register this repository at ref `beta` using `codex plugin marketplace add https://github.com/One-YuTian/website-builder.git --ref beta`, then `codex plugin add codex-website-builder@website-builder-beta`.

Marketplaces: `.agents/plugins/marketplace.json` and `.codex-plugin/marketplace.json`; plugin path: `./codex-website-builder`.

Projects and SQLite metadata persist outside versioned plugin installs. Windows defaults to `%LOCALAPPDATA%/codex-website-builder`; macOS/Linux use `${XDG_DATA_HOME:-~/.local/share}/codex-website-builder`. Set WEBSITE_BUILDER_DATA_DIR to override the data directory or WEBSITE_BUILDER_PROJECT_ROOT for project output. Legacy projects are copied into the persistent directory without deleting originals or overwriting existing projects.

Version 0.8.9 adds preview deployment to R2, persistent image compression with original materials retained, completed-project deployment guards, and updated Contact guidance. This bundle includes the intervening Git/project/canvas improvements; all release history is consolidated in `codex-website-builder/CHANGELOG.md`. GitLab entry points are temporarily disabled with their implementation retained.

Windows Codex managed Node tested; macOS launcher provided but no macOS host available for execution testing.
