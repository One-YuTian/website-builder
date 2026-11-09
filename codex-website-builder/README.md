# Website Builder

在同一张点阵画布中横向展示网站的所有 HTML 页面，顶部对齐，整体平移/缩放，每页独立 iframe。没有打开项目时画布为空；只有用户明确选择目录后才展示参考站点（例如 `website/www.noventrad.com` 的 14 个页面）。

## 右侧工具栏

界面不包含顶部或左侧面板。右侧胶囊工具栏依次提供：

1. 选择与交互：直接操作网页按钮、输入框、筛选和轮播。
2. 抓手平移：从页面或空白区域拖动画布。
3. 查看全部：将整排页面缩放到画布可视宽度。
4. 页面宽度：在右侧浮层设置统一宽度、当前页 320–2560 px 宽度及页面顺序。
5. 页面目录：切换网站目录、定位页面并查看原站资源提示。
6. 刷新网站：项目自动增量同步；手动打开的参考目录只更新有变化的页面。
7. 画布缩放：加减缩放或滑块调整 4%–150%。
8. 重置视图：恢复 26% 缩放与初始位置。

空白处拖动或滚轮平移，Ctrl / ⌘ + 滚轮缩放。缩放只改变画布显示比例，不改变 iframe 的实际像素宽度或响应式断点。高度监听支持图片、字体、动态内容、宽度切换后的增长和收缩。

## 原站保护与交互

网站目录仅只读访问。HTML、脚本、样式和图片的预览适配只作用于传输内容，不写回文件。浏览器验证会比较运行前后网站目录哈希。

外部链接、window.open、脚本 location 导航和外部表单提交会被拦截并显示提示。站内和站外页面跳转均被阻止，面板始终保留原页面；页面内部控件和同页锚点继续可用。iframe 使用不带 allow-same-origin 的 sandbox 隔离，禁止顶层导航、弹窗及下载。

预览 iframe 使用同一画布内共享的会话存储桥接原站 localStorage/sessionStorage；不读取原网站浏览器登录数据，也不生成登录或订单数据。原站登录检查发起的跳转同样被阻止，不替换对应页面。未变化页面保留 iframe、表单值、脚本状态和滚动位置；切换项目时重置会话存储。

## 插件内数据通道

当前 Codex 宿主会过滤 HTTP loopback CSP origin，直接在 MCP App 中 fetch 本地 HTTP 会产生 Failed to fetch。插件内改用 App.callServerTool 读取网站：

- read_website 返回页面目录。
- read_page 按页返回 gzip 编码的 HTML 及内嵌资源，数据放在工具结果 _meta 中，不加入模型上下文。
- UI 解压后生成 blob iframe，不直接请求 localhost/127.0.0.1。
- 脚本、样式、字体和本地图片内嵌为 data URL，已知演示 CDN 资源使用 assets/vendor 中的缓存。
- CSP 仅声明 blob/data 资源和虚拟页面基址，不需要放开本地 HTTP。

页面按独立协议消息传输，避免将整个网站作为一个过大的 MCP 消息。独立浏览器预览使用本地 HTTP 接口获取同样的嵌入页面；此 HTTP 接口不是插件内的数据加载路径。

## 目录与排序

mcp.json 中 WEBSITE_BUILDER_ROOT 指向 `Q:/Projects/DEMO/codex-website-development/website`。移动项目时改为实际网站根目录。目录浮层可填写其内部相对/绝对路径。真实路径验证拒绝越界和符号链接绕过。

递归识别 HTML/HTM，跳过隐藏目录、依赖目录和符号链接。默认首页优先，再按主导航、页脚和首页链接补充，其余自然排序。若源网站已有 website-builder.order.json 路径数组则优先采用；插件不会创建或修改该文件。

演示商品数据的 /img/product 由原站 https://cdn.noventrad.com 提供；预览保留真实 CDN 图片地址，CSP 仅为该资源来源放行图片加载，不允许其页面导航。

## 构建、测试和安装

需要 Node.js 22.12+ 与 pnpm。

```powershell
pnpm install --frozen-lockfile
pnpm prepare:plugin
pnpm test:visual
pnpm install:plugin
```

安装命令先构建和验证，再更新已注册 marketplace 中的本地插件。必须保留完整 dist/server、dist/ui、dist/vendor。不要直接修改安装缓存。

MCP 测试覆盖独立无 node_modules 安装、全局入口、14 个压缩页面传输和目录边界；浏览器测试覆盖并排布局、右侧工具栏、交互、宽度与高度、导航拦截、缩放和平移、手机视口及源目录哈希。

独立预览：`pnpm preview`，打开终端打印的地址；`pnpm dev` 仅提供界面开发环境。插件全局入口可用 `powershell -File scripts/open-canvas.ps1` 打开。

演示依赖来源见 assets/vendor/manifest.json，可用 `node scripts/vendor-demo.mjs` 重新下载。构建使用现有缓存，不要求重新下载。

页面标题采用 文件名 - 原页面标题，超出面板宽度时显示省略号，悬停显示完整标题。最大高度按 iframe 实际宽度计算：Mobile <768px 为5倍，平板768–1024px为3倍，PC >1024px为2.5倍。内容超高后在 iframe 内显示滚动条；普通滚轮优先滚动页面，Ctrl/⌘+滚轮仍缩放画布。

加载期间使用浅灰蓝至淡紫灰底色和柔和的横向扫光，不显示加载文字与圆点，页面就绪后淡入；减少动态效果偏好下停用动画。背景采用10px点距、0.55px半径，顶部保留64px白色渐变。页面外框、工具栏与设置浮层使用磨砂玻璃质感，网页正文保持清晰可交互。超高页面仅在滚动时显示细滚动条，停止滚动900ms后淡出隐藏。

## 内置建站 SKILL 与会话项目（0.5.0）

插件已打包用户指定来源的 Website Builder SKILL、80 个模板、原装配脚本和 CDN 清单。默认 SKILL 入口为精简工作流，详细规范延迟读取；模板支持一次选型及按选定 ID 批量获取代码。HTML 业务片段通过 website_write 自动补齐公共骨架，共享代码只写一次。来源记录在 skills/website-builder/source.json。

在会话中描述品牌、语言、商品和页面需求后，agent 使用该 SKILL 分析并生成电商网站；本地服务本身不另行调用付费模型或索要 API key。默认计划包含首页、商店、详情、购物车、心愿单、结账、登录、注册、关于、联系、条款、隐私和退换货，按需求增补页面。只有实际完成并通过验证的页面才标记 ready；测试用的简单内容不代表已生成用户的商业网站。

- website_project：open 复用会话绑定；显式 project_id 切换已有项目，new_project=true 创建新项目；plan 扩展页面计划，begin 让指定页面重新加载，finish 验证直接写出的文件。
- website_write：批量原子写入；fragment=true 自动装配完整 HTML。写共享资源时刷新依赖页面，修改单页时不重载其他 iframe。
- website_templates：select/summary/doc/code 渐进式批量模板读取；默认返回 ID 与简短摘要。
- project_sync：仅 UI 可见的长轮询，最多等待20秒、内部检测间隔250ms；只传输完成且版本变化的页面。未变化时返回极小状态，不进入模型上下文。大页面按传输上限分批交付，不每次重读整站。

真实 thread_id 来自当前 CODEX_THREAD_ID；不能用浏览器 localStorage 会话随机数或匿名全局键替代。绑定按会话独立持久化到 .builder-state/threads/，项目页面状态存放在各项目 .website-builder.json。显式切换才变更绑定。全局画布显示最近主动打开的会话项目，目录浮层也可切换已有项目。

输出目录固定为插件源码 project/xxxx-xxxx-xxxx-xxxx/。mcp.json 的 WEBSITE_BUILDER_PROJECT_ROOT 指向源码目录，而不是版本缓存；运行时项目和 .builder-state 被排除出插件安装包，升级不覆盖用户网站。移动插件源码时需同步修改该配置。所有路径验证限制在项目内，Windows 并发读取时对原子替换共享冲突做短暂重试，不删除旧文件来替代原子提交。

页面处于 queued/generating 时只显示扫光，完整 HTML 和本地 JS/CSS 均存在才进入 ready；错误会在对应页面说明。重新生成前先 begin，提交完成后仅该页替换为新预览，保留其他页面、画布位置和缩放。没有活跃项目时不请求或展示演示数据，同步失败也不回退到演示站点；参考站点须由用户在目录面板明确选择。相同内容的重复写入不触发页面重载，CSS/JS/图片修改仅影响实际引用该资源的页面。

当前会话尚未发现新工具时可使用同包 skills/website-builder/scripts/project.mjs，通过 stdin 接收操作 JSON；CLI 自动使用当前 CODEX_THREAD_ID，并与 MCP 共用持久化项目和 UI 状态，不要求另开聊天。

额外验证：`pnpm test:projects`，覆盖13页装配、80模板访问、会话复用/隔离、显式新建/切换、CLI、并发打开、路径与旧项目写入保护、不完整HTML、跨进程实时显示以及单页重生成时其他 iframe 不变。测试项目位于系统临时目录，不写入用户真实项目目录。
