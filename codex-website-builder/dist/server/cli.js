import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);
import {
  ProjectStore,
  compactProject,
  formatSource,
  importProducts,
  prepareCommerce,
  readTemplates,
  screenshotPage
} from "./chunk-CYRWKVMF.js";
import "./chunk-WPQ5MXLX.js";

// server/cli.ts
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
try {
  let text = "";
  for await (const chunk of process.stdin) text += chunk;
  const input = JSON.parse(text);
  const config = JSON.parse(await readFile(new URL("../../mcp.json", import.meta.url), "utf8")).mcpServers["website-builder"].env || {};
  const store = new ProjectStore((process.env.WEBSITE_BUILDER_PROJECT_ROOT || config.WEBSITE_BUILDER_PROJECT_ROOT || fileURLToPath(new URL("../../project/", import.meta.url))).replaceAll("${PLUGIN_ROOT}", fileURLToPath(new URL("../../", import.meta.url))));
  const thread = input.thread_id || process.env.CODEX_THREAD_ID || process.env.CODEX_SESSION_ID;
  const skillRoot = (process.env.WEBSITE_BUILDER_SKILL_ROOT || config.WEBSITE_BUILDER_SKILL_ROOT || fileURLToPath(new URL("../../skills/website-builder/", import.meta.url))).replaceAll("${PLUGIN_ROOT}", fileURLToPath(new URL("../../", import.meta.url)));
  let view;
  if (input.action === "templates") {
    const root = (process.env.WEBSITE_BUILDER_SKILL_ROOT || config.WEBSITE_BUILDER_SKILL_ROOT || fileURLToPath(new URL("../../skills/website-builder/", import.meta.url))).replaceAll("${PLUGIN_ROOT}", fileURLToPath(new URL("../../", import.meta.url)));
    if (input.mode === "audit" || input.mode === "bind" || input.targets?.length) {
      if (!thread || !input.project_id) throw new Error("\u6A21\u677F\u7ED1\u5B9A\u9700\u8981 thread_id/project_id");
      const current = await store.get(thread);
      if (!current || current.project.id !== input.project_id) throw new Error("\u4F1A\u8BDD\u9879\u76EE\u4E0D\u5339\u914D");
      if (input.mode === "audit") console.log(JSON.stringify(await store.auditTemplates(thread)));
      else {
        const binding = await store.bindTemplates(thread, input.targets || []);
        if (input.mode === "bind") console.log(JSON.stringify(binding));
        else console.log(JSON.stringify({ templates: await readTemplates(root, { ...input, mode: "code", section: "all", ids: [...new Set(input.targets.map((target) => target.id))] }), binding }));
      }
    } else console.log(JSON.stringify(await readTemplates(root, { ...input, usage: input.mode === "select" ? await store.templateUsage() : void 0 })));
    process.exit(0);
  }
  if (input.action === "format") {
    console.log(JSON.stringify({ content: await formatSource(input.path, input.content) }));
    process.exit(0);
  }
  if (!thread) throw new Error("\u5F53\u524D\u73AF\u5883\u6CA1\u6709\u771F\u5B9E CODEX_THREAD_ID\uFF1B\u8BF7\u63D0\u4F9B thread_id");
  if (input.action === "import_products") {
    console.log(JSON.stringify(await importProducts(store, skillRoot, { ...input, action: input.mode || "import", thread_id: thread })));
    process.exit(0);
  }
  if (input.action === "screenshot") {
    const { bytes, ...result } = await screenshotPage(store, { ...input, thread_id: thread });
    console.log(JSON.stringify(result));
    process.exit(0);
  }
  if (input.action === "commerce") {
    console.log(JSON.stringify(await prepareCommerce(store, skillRoot, { ...input, action: input.mode || "prepare", thread_id: thread })));
    process.exit(0);
  }
  if (!input.action || input.action === "open") view = await store.open({ threadId: thread, projectId: input.project_id, newProject: input.new_project, name: input.name, brief: input.brief, language: input.language, pages: input.pages });
  else {
    const current = await store.get(thread);
    if (!current) throw new Error("\u8BF7\u5148\u6253\u5F00\u5F53\u524D\u4F1A\u8BDD\u9879\u76EE");
    if (input.project_id && input.project_id !== current.project.id) throw new Error("\u4F1A\u8BDD\u9879\u76EE\u5DF2\u5207\u6362");
    if (input.action === "plan") view = await store.plan(thread, input.pages || []);
    else if (input.action === "begin") view = await store.begin(thread, input.paths || []);
    else if (input.action === "write") view = await store.write(thread, input.files, input.finalize_pages);
    else if (input.action === "finish") view = await store.finish(thread, input.paths || []);
    else if (input.action === "status") view = current;
    else throw new Error("\u4E0D\u652F\u6301\u7684 action");
  }
  console.log(JSON.stringify(compactProject(view)));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
