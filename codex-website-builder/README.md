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

演示商品数据的 /img/product 由原站 https://cdn.noventrad.com 提供；与其他域名的资源一样，统一由服务端代理获取后返回 data URL，不再放行任何外部 CDN 域名。

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

## 外部资源代理（0.5.2）

外部 HTTP(S) 图片、srcset、背景图、第三方脚本、样式和字体统一通过插件服务端获取。页面预览中的脚本/样式在响应阶段处理，CSS 的 @import、url() 及模块静态依赖递归解析；运行时的图片/脚本/样式、fetch、异步 XMLHttpRequest 和动态 import 通过 iframe 消息桥交给 UI-only proxy_resource 工具。网站磁盘文件保持原样，不需要为新资源域名修改 CSP。

代理结果只放在 _meta 中，按 512KB 二进制分片传输，并在服务端和画布内去重缓存；已有 vendor 缓存仍由服务端读取。宿主只放行 data/blob 资源，浏览器不直接请求外部 CDN，也不依赖宿主访问 localhost。独立浏览器测试使用同一资源处理逻辑的带随机令牌 HTTP 接口。

代理只读取公共 HTTP(S) 资源（GET/HEAD），不携带浏览器 Cookie、登录凭据或提交表单。HTTP 错误和超时返回具体错误，不伪装成成功；单资源上限 64MB、缓存有效期 10 分钟。默认拒绝本机/私网地址及重定向，WEBSITE_BUILDER_PROXY_ALLOW_LOCAL=1 仅用于本地测试资源服务器。上游拒绝访问、需要登录、同步 XHR、循环模块依赖或依赖真实服务端状态的第三方服务不能保证可在隔离预览中运行。

`pnpm test:proxy` 验证任意域名/无扩展名资源、嵌套 CSS/字体、动态加载、fetch/XHR/模块、分片缓存、严格 CSP 下无浏览器直连及源文件哈希不变。
## Agent 数据与创建规范整合（0.6.0）

Website Builder 仍为一个技能。首次数据/SDK 准备和组件/页面创建分别读取 commerce-data.md、creation-contract.md。以实际 SDK 代码核对文档，避免使用未实现的方法；不加载已移除的旧版原文和 Agent 分析参考。

website_commerce 一次准备 mock 商品数据、缺失的 SDK 与配置，已有数据、SDK、配置优先保留，API 数据源不造 mock；action=validate 检查商品契约。新配置集中到 app.js，不再创建独立配置脚本。生成器使用品牌样本和 seed，默认 24 条，ID 稳定、折扣计算一致。输出摘要不携带全量源码。CLI 回退使用 action=commerce、mode=prepare/validate。

本包 sdk.js 保留旧实现的查询语义，具体限制已写入契约；ec-sdk.js 是适配版：账户注册/登录/更新为异步方法，使用 PBKDF2 而非明文密码，公开 user 不含凭据，购物车/收藏按项目与账户隔离。真实后端仍需独立接入。任何已有用户项目 SDK 均不自动覆盖。

website_write 保留提交源码的格式，不要求多行或固定缩进，也不自动排版。JS/JSON 语法错误不会覆盖旧文件；未完成 HTML 不会被修复为已完成页面。fragment 装配检测已准备的 SDK 与配置，在数据初始化后注册组件。数据、业务状态、应用编排分别为 productData、SDK、APP 与 app，避免互相覆盖。

pnpm test:commerce 覆盖数据契约/稳定 ID/保护已有数据/API 跳过、源码格式保留、SDK 加载顺序、账户隔离、订单快照，以及跨 iframe 业务状态局部刷新。它只使用临时项目，不修改原 Agent 或用户站点。
## 模板复用与 Tailwind 指导（0.6.4）

Website Builder 以用户清理后的模板源码为基线，不再按旧演示脚手架做二次剥离。code 读取始终包含 Overview 和所需部分说明；传 targets、thread_id、project_id 时一次返回完整代码并绑定文件/区域/模板 ID/html 或 render 基线。

website-builder.templates.json 仅记录可选来源。组件约80%保真只在 SKILL 中作创作指导；write/finish 不再检查结构、布局类、响应式或覆盖率分数，旧 threshold 和绑定也不触发评分门禁。HTML 完整且本地依赖存在即可 ready。audit 保留兼容入口，仅返回来源信息，不打分、不写审计报告、不改变生成状态。

Agent 仍需在 375/768/1280px 验证真实页面：整站配色、宽度、视觉层级、移动/桌面显隐、REM、栅格比例、抽屉/Swiper/表单；ready 表示内容已输出完成，不代表审美或业务验收已完成。

规范完整吸收指定原 SKILL 的 2.4/2.6/2.7：app.js 顶部唯一 Tailwind config，常规样式优先使用 class，不用自己的 CSS 重画；原生技术栈、Swiper、jQuery、APP 持久化、cdnjs、Google Fonts、专业图标、Light DOM、截断、window 共享与 data.js 薄门面。自动装配器与旧 hook 均已移除注入的基础手写 CSS；Google Fonts link 可随 fragment 提交并移入 head。

当前技能参考 creation-contract 不再提供另一套通用卡片 HTML，避免它取代模板。详细规范见 skills/website-builder/references/template-fidelity.md。pnpm test:templates 验证来源可选、还原度不阻止完成、旧契约不影响 ready，保留 HTML/依赖完整性检查，并验证购物车页面/抽屉及三档视口真实模板。

## 区域文档与多行画布（0.6.2）

Starlight 的 80 个组件与页面模板使用简明英文注释直接标注于代码（HTML/JS）各功能区域中，文档保持简洁规范，且 LLM txt 采用 100% 纯英文格式，绝无中文字符干扰。

在 starlight 运行 npm run build 会生成文档和 public/llms，并同步替换项目与插件的 SKILL templates。pnpm test:docs 验证 80 份模板与构建输出逐字节相同、区域说明完整及文档预览定位。组件源码保留用户清理后的独立实现，不重新引入演示资源加载器或主题注入。

画布按面板宽度和页面宽度排列为 1–3 列，多页自动换行；定位页面与查看全部同时考虑横纵坐标。换行、缩放及调整宽度保留既有 iframe，单页生成仍只替换对应页面。

## 整站视觉设计先行（0.6.3）

Agent 先按品牌、商品与信息密度确定视觉方向、语义色板、亮暗策略、内容/正文/表单宽度和字阶/间距，再选择相容模板，首批输出记录 website-builder.design.json。亮暗主题、宽度和布局是可选能力，演示默认值无需照搬，也不要求全启用；共享 app.js 的 Tailwind config 统一设计 token。

website_templates select 现在返回按类别分组的未排序候选（category/candidates/selection），不再按 brief 哈希抽取单个模板或排除 -01。旧 read-template.mjs select 同样仅列候选，不再随机生成主题、宽度与板块顺序。Agent 决定最终组合，只读取所选模板及必要备选。

80% 结构复用仅在 SKILL 中指导创作，不作为页面生成成功的判断依据。生成时需在真实内容和代表页面上核对配色、容器轴线、图片、字阶、留白和跨页一致性，再交付。详细规范见 skills/website-builder/references/visual-design.md。

## 购物车展示选择（0.6.5）

新生成遵循 demo5 互斥规则：页面方案只创建 cart.html，在 main 直接实现购物车，不创建 cart.js 或挂载 cart-component；抽屉方案省略 cart.html，只提供 components/cart.js 和唯一 cart-component。装配器自动挂载一份 drawer，已有实例不重复。两种方案都使用 APP.cart，抽屉无需独立画板页面。既有项目的页面内组件方案继续兼容，不自动删除旧文件。

兼容既有项目的特殊命名或页面内组件时，可提交完整 HTML 显式安排；新生成仍采用页面/抽屉互斥规则。旧 hook-page.mjs 支持 --cart=page/drawer/none，默认 page，不再无条件添加抽屉；--no-cart 继续兼容。此版本只改变后续生成/装配，不自动改写用户已有网站文件或页面计划。

## demo5 SKILL 迁移（0.6.5）

迁入用户指定 demo5 的模板槽位/响应式、AI自主配色与卡片色差、唯一 xxx-component 注册、按需子组件、购物车互斥，以及图标、圆角、统一版心、卡片等高和面包屑截断要求。新生成不臆造模板外区域，不编造数据或商业承诺。两份旧参考及其引用已移除；源码格式不再作要求，写入链路和CLI也移除格式化能力。来源文件哈希及迁入内容记录在技能 source.json，模板本身及来源目录保持原样。
