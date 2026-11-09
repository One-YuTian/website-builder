# Build and verify before Codex copies the plugin into its versioned cache.
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    & pnpm prepare:plugin
    if ($LASTEXITCODE -ne 0) { throw 'Plugin build or verification failed; installation cancelled.' }

    & codex plugin add 'codex-website-builder@website-builder-local' --json
    if ($LASTEXITCODE -ne 0) { throw 'Codex plugin installation failed.' }
} finally {
    Pop-Location
}
