# Website Builder Beta — 0.8.2

Prebuilt Codex desktop plugin; no npm install or system Node required. Runtime is provided by Codex.

Register this repository at ref `beta` using `codex plugin marketplace add https://github.com/One-YuTian/website-builder.git --ref beta`, then `codex plugin add codex-website-builder@website-builder-beta`.

Marketplaces: `.agents/plugins/marketplace.json` and `.codex-plugin/marketplace.json`; plugin path: `./codex-website-builder`.

Projects and SQLite metadata persist outside versioned plugin installs. Windows defaults to `%LOCALAPPDATA%/codex-website-builder`; macOS/Linux use `${XDG_DATA_HOME:-~/.local/share}/codex-website-builder`. Set WEBSITE_BUILDER_DATA_DIR to override the data directory or WEBSITE_BUILDER_PROJECT_ROOT for project output. Legacy projects are copied into the persistent directory without deleting originals or overwriting existing projects.

Version 0.8.2 adds Home composition guidance, template-based Toast implementation, consistent skill names, and the migrated imagegen workflow. A single sdk.js now supplies catalog and account/cart/order APIs; app.js is generated with the chosen templates and initializes the SDK after data.js. Includes prior project/canvas/image task and clipboard features. See `codex-website-builder/CHANGELOG-0.8.2.md`.

Windows Codex managed Node tested; macOS launcher provided but no macOS host available for execution testing.
