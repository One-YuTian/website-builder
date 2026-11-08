# Codex Website Builder

pnpm + React + TypeScript + Node MCP 本地插件。当前只实现浅灰点阵画布与鼠标附近的径向高亮，不包含参考图中的输入框、导航或卡片。

## 开发

需要 Node.js 22.12+ 与 pnpm 10。

```powershell
pnpm install
pnpm dev
```

访问终端中的本地 Vite 地址预览。默认点距 10px、半径 0.85px、交互范围 190px，可在 `src/main.tsx` 调整。参考图在浅色背景中以更深的点表现高亮；此实现采用相同方式。支持高 DPI、窗口自适应、移出渐隐及减少动态效果偏好。静止时停止动画帧。

## 构建与验证

```powershell
pnpm build
pnpm test
pnpm start
```

`pnpm test:visual` 使用本机 Chrome 检查鼠标高亮、移出恢复和 1440 / 768 / 375px 三种尺寸，并将截图保存到 `artifacts/`。

`pnpm start` 启动 stdio MCP 进程，等待宿主 JSON-RPC 输入；不是 HTTP 网站服务。构建生成内联脚本和样式的 `dist/ui/index.html` 及包含运行依赖的 `dist/server/`。发布时必须包含整个 `dist`，不需要复制 `node_modules`。`pnpm test` 会将产物复制到系统临时目录，在无项目依赖的环境中验证服务、入口和 UI 资源。

## Codex 插件接入

根目录 `plugin.json` / `mcp.json` 为 portable 插件声明，`.codex-plugin/plugin.json` 为本地兼容配置，引用同一份 MCP 声明。通过宿主支持的本地插件/marketplace 安装流程加载此目录，安装前先完成依赖安装和构建。MCP `open_canvas` 工具声明 `openai/ui.entrypoints: [{ type: "global" }]`，在支持 MCP Extensions 的宿主中提供 Website Builder 全局侧边栏入口，打开 fullscreen 画布。

此项目的源码创建不等于已在当前 Codex 中安装。若只手动添加 MCP server，工具和资源可用，但宿主是否展示插件侧边栏入口取决于其插件支持。不要把 `pnpm dev` 的地址当作 MCP 端点。

官方入口协议：https://github.com/openai/mcp-extensions/blob/main/docs/spec.md#global-entrypoint

已安装插件但侧边栏未刷新时，可执行 `powershell -File scripts/open-canvas.ps1` 通过官方深链接直接打开全局画布。MCP 服务 `ready` 只表示协议连接成功；实际 UI 应在桌面日志中出现 `Found app view`、`Reading app resource`、`Connected app sandbox` 和 `Starting app widget displayMode=fullscreen`。
