# Website Builder Beta

Prebuilt Codex desktop plugin; no npm install or system Node required. Runtime is provided by Codex.

Register this repository at ref `beta` using `codex plugin marketplace add https://github.com/One-YuTian/website-builder.git --ref beta`, then `codex plugin add codex-website-builder@website-builder-beta`.

Marketplaces: `.agents/plugins/marketplace.json` and `.codex-plugin/marketplace.json`; plugin path: `./codex-website-builder`.

Generated sites default to the installed plugin root `project/`; each version has its own directory. Existing sites are not migrated. Set WEBSITE_BUILDER_PROJECT_ROOT explicitly if a persistent location is required.

Windows Codex managed Node tested; macOS launcher provided but no macOS host available for execution testing.
