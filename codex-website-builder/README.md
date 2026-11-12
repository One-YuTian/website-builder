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

在会话中描述品牌、语言、商品和页面需求后，agent 使用该 SKILL 分析并生成电商网站；本地服务本身不另行调用付费模型或索要 API key。默认计划包含首页、商店、详情、心愿单、结账、登录、注册、关于、联系、条款、隐私和退换货，共12页，购物车默认共享抽屉；仅明确独立页需求或保留已有页面模式时增补cart.html。只有实际完成并通过验证的页面才标记 ready；测试用的简单内容不代表已生成用户的商业网站。

- website_project：open 复用会话绑定；显式 project_id 切换已有项目，new_project=true 创建新项目；plan 扩展页面计划，begin 让指定页面重新加载，finish 验证直接写出的文件。
- website_write：批量原子写入；fragment=true 自动装配完整 HTML。写共享资源时刷新依赖页面，修改单页时不重载其他 iframe。
- website_templates：select/summary/doc/code 渐进式批量模板读取；默认返回 ID 与简短摘要。
- project_sync：仅 UI 可见的长轮询，最多等待20秒、内部检测间隔250ms；只传输完成且版本变化的页面。未变化时返回极小状态，不进入模型上下文。大页面按传输上限分批交付，不每次重读整站。

真实 thread_id 来自当前 CODEX_THREAD_ID；不能用浏览器 localStorage 会话随机数或匿名全局键替代。绑定按会话独立持久化到 .builder-state/threads/，项目页面状态存放在各项目 .website-builder.json。显式切换才变更绑定。全局画布显示最近主动打开的会话项目，目录浮层也可切换已有项目。

输出目录固定为插件源码 project/xxxx-xxxx-xxxx-xxxx/。mcp.json 的 WEBSITE_BUILDER_PROJECT_ROOT 指向源码目录，而不是版本缓存；运行时项目和 .builder-state 被排除出插件安装包，升级不覆盖用户网站。移动插件源码时需同步修改该配置。所有路径验证限制在项目内，Windows 并发读取时对原子替换共享冲突做短暂重试，不删除旧文件来替代原子提交。

页面处于 queued/generating 时只显示扫光，完整 HTML 和本地 JS/CSS 均存在才进入 ready；错误会在对应页面说明。重新生成前先 begin，提交完成后仅该页替换为新预览，保留其他页面、画布位置和缩放。没有活跃项目时不请求或展示演示数据，同步失败也不回退到演示站点；参考站点须由用户在目录面板明确选择。相同内容的重复写入不触发页面重载，CSS/JS/图片修改仅影响实际引用该资源的页面。

当前会话尚未发现新工具时可使用同包 skills/website-builder/scripts/project.mjs，通过 stdin 接收操作 JSON；CLI 自动使用当前 CODEX_THREAD_ID，并与 MCP 共用持久化项目和 UI 状态，不要求另开聊天。

额外验证：`pnpm test:projects`，覆盖默认12页装配与抽屉模式、80模板访问、会话复用/隔离、显式新建/切换、CLI、并发打开、路径与旧项目写入保护、不完整HTML、跨进程实时显示以及单页重生成时其他 iframe 不变。测试项目位于系统临时目录，不写入用户真实项目目录。

## 外部资源代理（0.5.2）

外部 HTTP(S) 图片、srcset、背景图、第三方脚本、样式和字体统一通过插件服务端获取。页面预览中的脚本/样式在响应阶段处理，CSS 的 @import、url() 及模块静态依赖递归解析；运行时的图片/脚本/样式、fetch、异步 XMLHttpRequest 和动态 import 通过 iframe 消息桥交给 UI-only proxy_resource 工具。网站磁盘文件保持原样，不需要为新资源域名修改 CSP。

代理结果只放在 _meta 中，按 512KB 二进制分片传输，并在服务端和画布内去重缓存；已有 vendor 缓存仍由服务端读取。宿主只放行 data/blob 资源，浏览器不直接请求外部 CDN，也不依赖宿主访问 localhost。独立浏览器测试使用同一资源处理逻辑的带随机令牌 HTTP 接口。

代理只读取公共 HTTP(S) 资源（GET/HEAD），不携带浏览器 Cookie、登录凭据或提交表单。HTTP 错误和超时返回具体错误，不伪装成成功；单资源上限 64MB、缓存有效期 10 分钟。默认拒绝本机/私网地址及重定向，WEBSITE_BUILDER_PROXY_ALLOW_LOCAL=1 仅用于本地测试资源服务器。上游拒绝访问、需要登录、同步 XHR、循环模块依赖或依赖真实服务端状态的第三方服务不能保证可在隔离预览中运行。

`pnpm test:proxy` 验证任意域名/无扩展名资源、嵌套 CSS/字体、动态加载、fetch/XHR/模块、分片缓存、严格 CSP 下无浏览器直连及源文件哈希不变。
## Agent 数据与创建规范整合（0.6.0）

Website Builder 仍为一个技能。首次数据/SDK 准备和组件/页面创建分别读取 commerce-data.md、creation-contract.md。以实际 SDK 代码核对文档，避免使用未实现的方法；不加载已移除的旧版原文和 Agent 分析参考。

website_commerce 一次准备 mock 商品数据、缺失的 SDK 与配置，已有数据、SDK、配置优先保留，API 数据源不造 mock；action=validate 检查商品契约。新配置集中到 app.js，不再创建独立配置脚本。生成器使用品牌样本和 seed，默认 24 条，ID 稳定、折扣计算一致。输出摘要不携带全量源码。CLI 回退使用 action=commerce、mode=prepare/validate。

本包 sdk.js 保留旧实现的查询语义，具体限制已写入契约；ec-sdk.js 是适配版：账户注册/登录/更新为异步方法，使用 PBKDF2 而非明文密码，公开 user 不含凭据，购物车/收藏按项目与账户隔离。真实后端仍需独立接入。任何已有用户项目 SDK 均不自动覆盖。

website_write支持多HTML批量提交；新生成页面完成即落盘，不等待全站。提交页面和受依赖影响页面校验通过即ready供UI渲染，finalize_pages仅追加校验目标；使用内置本地Prettier standalone统一格式，不依赖npm包。JS/JSON 语法错误不会覆盖旧文件；未完成 HTML 不会被修复为已完成页面。fragment 装配检测已准备的 SDK 与配置，在数据初始化后注册组件。数据、业务状态、应用编排分别为 productData、SDK、APP 与 app，避免互相覆盖。

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

迁入用户指定 demo5 的模板槽位/响应式、AI自主配色与卡片色差、唯一 xxx-component 注册、按需子组件、购物车互斥，以及图标、圆角、统一版心、卡片等高和面包屑截断要求。新生成不臆造模板外区域，不编造数据或商业承诺。两份旧参考及其引用已移除；旧版曾移除格式化能力；0.7.5起按用户要求改为本地Prettier统一输出。来源文件哈希及迁入内容记录在技能 source.json，模板本身及来源目录保持原样。


## 0.7.0 生成能力

画布PC模式（统一宽度>1024）每行5页，iPad/Tablet/Mobile模式每行7页；单页宽度覆盖不改变全局设备模式，画布仍可平移缩放。

主技能负责模板组装和交易闭环；generate-mock-data负责模拟商品，website-copywriter负责非商品文案，website-image-generator负责Logo/Banner/About/ICON位图，website-acceptance仅明确要求时调用。未登录加购/收藏提示后跳登录，登录返回使用APP.auth.safeReturnTo；按国家配置loginRequiredMessage。现有项目SDK保留，修现有站点时需显式接入守卫。

website_screenshot(thread_id,project_id,path,width=1280)返回指定ready页面全页PNG和绝对路径，保存在生产目录外metadata_directory/artifacts/screenshots。支持相对HTML路径及商品查询参数，要求本机Chrome；浏览器驱动随dist/runtime打包，安装后不依赖开发node_modules。它使用独立渲染会话，不包含画布内已登录状态或输入草稿。异步页面在app.js设置window.websiteReady Promise，涵盖数据与首轮组件渲染。截图最多等待60秒，缺图/脚本错误/未稳定布局会失败，不交付半成品。旧会话stdin action:"screenshot" 使用skills/website-builder/scripts/project.mjs。

修改原因与验证见CHANGELOG-0.7.0.md。源码升级后重新安装/重载插件使新技能和工具生效。


## 0.7.1 生产目录与内容协作

website_project返回directory（可发布的网站生产目录）和metadata_directory（生产目录外的.builder-state/projects/<project_id>）。网站目录仅保留运行所需文件；项目状态、设计、模板来源、文案/素材记录、截图/验收报告、临时脚本及原始数据放管理目录。website_write自动将根级website-builder.*.json记录路由到管理目录，并拒绝常见临时/报告文件；js/data.js为实际运行商品数据，可以保留。旧项目状态和模板绑定兼容读取，不自动删除用户旧文件。

主技能按缺失内容主动调用文案、图片和Mock Data技能；图片技能使用宿主imagegen技能的image_gen工具，依据实际内容和尺寸生图，优先无字主图自动裁切适配多端，保护主体与HTML文案留白；ICON优先单色透明底。文案按场景控制长度，About Us/隐私政策分节详细撰写，必要时协作生图，不编造具体承诺。

Header桌面与移动菜单都必须包含Home、Shop、About Us、Contact Us的目标语言菜单及有效链接。详情见CHANGELOG-0.7.1.md。


## 0.7.2 预览传输与模板选择

原“页面资源超过单页预览传输限制”来自整页Base64内嵌图片后超过3.8MB单包限制，不代表网站生成失败。本地静态/dynamic/srcset位图通过opaque预览资源地址按512KB二进制分片传输；较大gzip页面包也改用资源分片，主同步消息只传描述符。保留原图和源网站，传输临时失败会重试，不丢其他已解码页面。CSS内嵌依赖继续兼容，由大页面分片兜底。

Shop/About选择要比较至少3个候选（不足3个则全看）的实际区域与图文结构。About的11个候选现在有不同的真实布局摘要，select附带已绑定模板的项目使用次数/最近使用时间；新站在相容方案中优先较少使用的布局，记录理由并绑定来源。旧项目局部编辑保持布局，不随机换型，也不一律禁用-01。未绑定的历史网站不编造统计。

移动端<768px的html根字号必须12px，跨断点恢复桌面字阶；Logo必须用真实图片。完整首页在Header/Footer/轮播/商品列表之外组合1–2个不同用途、内容和视觉不重复的独立板块。购物车默认drawer，独立cart.html是例外。详见CHANGELOG-0.7.2.md。


## 0.7.3 在线依赖、品牌图像与共享通知

所有网站字体/第三方JS、CSS及图标库从在线HTTPS CDN加载，不在生产目录存第三方副本。默认预览也向在线URL取资源后通过宿主安全代理传输，不优先用内置副本；只有隔离回归测试显式设置WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES=1时使用固定依赖样本。

图片技能支持独立1:1 favicon；Logo优先品牌特色字标、左侧不附加icon，透明背景、紧贴有效字形且无额外边距。Banner/About按各自内容重点独立生成，元素尽量在视觉中心；Banner关键内容在max-content安全区内，轮播图片彼此不同且不与About共用一张图。正文/板块说明更丰富，除关键短信息及即时交互提示外不只用一句话概过。Header已有分类套件时首页改选其他独立板块。按钮/控件使用统一圆角、hover/focus/disabled与过渡风格。

write/finish为每个完整HTML自动安装缺失的components/toast.js，注入唯一toast-component与提前加载的相对脚本，保留已有实现；提供window.Toast.show/success/error/info/warning/dismiss/clear。登录门槛以Toast提示并稍后跳转，不调用原生alert。对直接写文件也须finish。弹窗/抽屉关闭要求现按各组件开发规范实现，不再提供统一Overlay接口或全局拦截；详见0.7.4修订。

具体交付和验证见CHANGELOG-0.7.3.md；本次未生成品牌图片或重写历史网站。


## 0.7.4 组件规范与商品JSON导入

保留用户在标准目录中加入的components/toast.js，Toast改为真正的ToastComponent：Light DOM、template/refresh、实例状态/定时器、幂等连接和断开清理，window.Toast仅为薄门面。统一Overlay接口及全局蒙层监听已撤回；蒙层空白关闭、内容不误关等只作为每个组件的开发/验收规范。

CDN规范避免jsDelivr/jsdeliver及其镜像；PC在max-content内减少Logo与各区块外层/嵌套左右padding，保持左右轴线对齐，移动安全边距和控件内部间距仍保留。页面业务逻辑写对应HTML的script，不新增单页JS文件；详情/规格/评论过长时可展开、分页或分批显示，内容不可永久丢失。

新增import-products技能、website_products工具与skills/import-products/scripts/import-products.mjs。用户提供JSON时通过工具/脚本解析适配，再实际运行可信sdk.js统计商品/分类；inspect不写入，import只输出运行商品视图和缺失SDK，源JSON不修改。支持字段映射、locale数值价格、www.mreceix.com→https://cdn.mreceix.com/相对图拼接，保留绝对图URL；主要分类通常5–6个，过多采用聚合/More，过少用真实子分类/类型/品牌二次分组，不能凑空类。完整筛选关系在window.catalogGroups；工具只返回有限摘要/样本。导入无法识别时返回Mock工作流指令，由主技能接续Mock生成，原运行数据不被坏导入覆盖。商品图允许作为Banner/分类场景图的引用素材，不因此改写商品目录图。

更多说明见CHANGELOG-0.7.4.md。新工具在重载/安装新版本后可用，旧会话可用脚本。


## 0.7.5 逐页输出、渲染图URL与二次分类

每完成一个页面就立即格式化并写文件，再生成下一页；0.7.5曾限制单次一个HTML，现已在0.7.6撤回，当前支持多HTML批量提交及共享依赖。格式配置见skills/website-builder/references/code-output.md和assets/prettier/options.json：本地Prettier standalone 3.6.2、2空格、printWidth 100、JS单引号与分号、LF，内联JS/CSS也格式化；JSON双引号层级缩进。仅插件持有格式化器和解析器文件/许可证，不增加npm依赖、不发布到网站。CLI format及旧hook也使用同一路径。

导入商品图片main_image/images保留相对路径，渲染时显式storeData.imageUrl(path)/productImageUrl(path)拼接CDN，SDK查询或导入不改图地址，源JSON也不变。类别过多不再取前5类+More：先读取工具分类摘要，提交完整category_map进行二次归类（或使用一致parent_category）；classification_required表示继续分类，不是Mock。成功后SDK的category/categories/filter使用新类，source_category留原类追溯，分类菜单和筛选统一使用新类。分类摘要支持分页，不需要读取整份源JSON。

更多变更和验证见CHANGELOG-0.7.5.md。新版本需重新安装/重载；既有网站不会自动批量重写。

## 0.7.6 批量提交与即时就绪同步

撤回单次只能提交一个HTML的接口限制，支持已有代码批量导入；新生成页面依然完成即写入。提交HTML和受依赖变更影响的页面自动校验，finalize_pages仅追加目标，空数组不再阻止就绪。通过即ready供UI同步，不等待全部页面或会话结束。

begin记录原文件指纹，跨进程同步可识别直接写出的新完整HTML并校验，保留旧文件时继续等待。finish省略paths会校验全部未完成页；任务结束前须收尾并核对状态。格式/语法或磁盘写入错误会明确记录，避免残留生成中。单页预览传输异常不阻断其他页面更新，失败页自动重试。

变更和验证见CHANGELOG-0.7.6.md。需重新安装/重载插件启用；不改写现有网站。

## 0.7.7 启动目录容错

修复mcp.json误指向不存在的F盘目录导致启动退出的问题：本机配置恢复到Q盘仓库既有website参考目录与插件project目录，不搬迁或重建已有项目。参考库改为按需realpath校验；缺失参考库不再阻断MCP注册、画布、项目生成与同步，显式读取缺失目录仍返回错误，不扩大读取边界。

新增test:startup：使用实际mcp.json路径进行握手/工具发现/画布资源验证，并隔离验证参考库缺失时项目生成与UI同步仍可用。此检查纳入prepare:plugin。更多见CHANGELOG-0.7.7.md。

## 0.7.8 五项生成规范（仅文档）

主SKILL及相关文案/图片/展示参考新增：加购默认不打开购物车；注册提供用户名/邮箱/手机号/密码；品牌、support邮箱和版权默认依网站域名统一；商品详情图片不额外留边；店铺采用正式品牌语境，不输出演示/模拟/本地运行告示。实现限制和虚构联系资料说明保留在交付说明或metadata_directory，不能为追求真实感编造经营事实、能力或承诺。

这些仅约束后续生成提示，不增加校验器、扫描、ready门禁、统一接口或运行时代码，不批量修改已生成网站。同步修正文案技能旧有example.com邮箱与页面演示联系提示要求。见CHANGELOG-0.7.8.md。

## 0.7.9-beta.1 跨平台托管Node与beta分发

MCP入口改为scripts/launch-node与Windows同名.cmd启动器，优先读取Codex的CODEX_MCP_NODE_PATH及托管运行时目录，不使用系统PATH中的Node。启动器无参数启动服务器，也可传入同包脚本路径。macOS使用LF与可执行位，Windows使用CMD companion；运行时缺失以stderr明确报错，不自动安装依赖。

项目目录默认${PLUGIN_ROOT}/project，参考库默认${PLUGIN_ROOT}/reference（可选），技能默认${PLUGIN_ROOT}/skills/website-builder，CLI同样展开插件根目录，不写入开发机绝对路径。升级会切换到新版本插件根目录下的project，旧Q盘项目不移动/删除；如需跨版本固定目录，可通过WEBSITE_BUILDER_PROJECT_ROOT覆盖。

beta为仅安装内容的分支，含codex-website-builder的dist/skills/启动器/清单与必要资源，以及.agents/plugins/marketplace.json和兼容.codex-plugin/marketplace.json，市场source.path为./codex-website-builder；不包含node_modules、生产项目、管理状态或测试报告。仓库市场安装应选择beta ref。

Windows托管Node v24启动、MCP工具/画布及独立14页预览通过；macOS实际宿主未实测。运行时定位模式参考OpenAI Codex Security官方启动器： https://github.com/openai/codex-security/blob/main/plugins/codex-security/scripts/launch_codex_security_mcp 。

## 0.7.9-beta.2 MCP配置修正

严格MCP格式只接收type/command/args/env/cwd；移除legacy env_vars，command使用./scripts/launch-node，不在可执行令牌中使用PLUGIN_ROOT占位。双平台启动器及根目录project保留。详见CHANGELOG-0.7.9-beta.2.md。
