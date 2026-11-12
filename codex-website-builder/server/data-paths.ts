import { homedir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// User data must never depend on the installed plugin's versioned directory.
export function dataPaths(env = process.env) {
  const home = homedir();
  const base = process.platform === 'win32'
    ? env.LOCALAPPDATA || join(home, 'AppData', 'Local')
    : env.XDG_DATA_HOME && isAbsolute(env.XDG_DATA_HOME) ? env.XDG_DATA_HOME : join(home, '.local', 'share');
  const root = resolve(env.WEBSITE_BUILDER_DATA_DIR || join(base, 'codex-website-builder'));
  const expand = (value: string) => resolve(value.replaceAll('${PLUGIN_ROOT}', fileURLToPath(new URL('../../', import.meta.url))));
  return {
    root,
    project: env.WEBSITE_BUILDER_PROJECT_ROOT ? expand(env.WEBSITE_BUILDER_PROJECT_ROOT) : join(root, 'project'),
    reference: env.WEBSITE_BUILDER_ROOT ? expand(env.WEBSITE_BUILDER_ROOT) : join(root, 'reference'),
  };
}
