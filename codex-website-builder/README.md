# Website Builder

当前版本0.9.2，见[版本说明](CHANGELOG.md)。beta分支提供可直接加载的预构建插件，使用Codex内置Node运行。

## 项目与画布

通过真实thread_id复用项目，open_canvas(thread_id)直接进入当前会话项目详情。无会话/项目时显示项目首页；手动返回首页不被轮询拉回。项目和SQLite数据位于独立用户数据目录（Windows默认LOCALAPPDATA/codex-website-builder，其他平台为XDG_DATA_HOME或~/.local/share），可用WEBSITE_BUILDER_DATA_DIR及WEBSITE_BUILDER_PROJECT_ROOT覆盖。

新项目格式为项目根README.md、src/源码、material/生成原图和无remote的本地.git。directory/source_directory返回src，project_directory返回项目根；website_write相对src写入，README.md专门写入项目根。isomorphic-git 1.44.14作为独立UMD和Node适配器内置，构建后位于dist/runtime/isomorphic-git，不安装npm依赖。新建项目写入README后本地首提，每轮修改用项目finish收尾并提交到main，无变化不空提交、始终不推送。遇到分支偏离、merge/rebase/cherry-pick、冲突或锁等异常，先确认，再由系统Git执行获准处理；常规操作不调用系统Git。旧格式不自动导入/迁移，无法识别的项目不进入列表。

网站图片使用src/images/logo.png、favicon.png、banner1.png、banner2.png、about.png等固定语义命名；website_images的path是material内文件名，完成后自动发布同名图片到src/images。原图/候选/历史图片均留material；数据源、提示词与报告留metadata_directory。

画布按PC每行5页、平板/手机每行7页展示。图片在顶部按独立尺寸排列，生成任务由website_images登记并持久化，支持加载/错误/完成状态；文件落盘后自动展示。支持原尺寸图片和当前状态完整页面截图复制。查看全部优先横向适配，长内容可平移查看。

## 网站运行脚本

新站仅使用js/sdk.js，同时提供商品查询SDK和兼容APP账户/购物车/收藏/订单接口。依赖顺序为sdk.js → data.js → app.js → 组件 → 页面内联脚本；app.js拥有主题、commerceConfig、移动设置及唯一SDK.init，HTML不再注入初始化。静态数据在组件之前同步初始化，异步数据通过app.loadProducts/productDataReady接入，组件可等待app.dataReady，整体就绪使用websiteReady。准备/导入工具仅安装缺失sdk并返回config_defaults，app.js由主建站技能随所选模板、主题与数据方案生成；已有自定义文件不覆盖，迁移旧站需显式合并。

## 技能职责

| 技能 | 负责内容 |
| --- | --- |
| [website-builder](skills/website-builder/SKILL.md) | 项目、设计、模板组合、共享组件、逐页输出 |
| [website-mock-data](skills/website-mock-data/SKILL.md) | 无有效商品数据时生成Mock样本 |
| [website-import-data](skills/website-import-data/SKILL.md) | 用户JSON经SDK导入、归类、运行时CDN适配 |
| [website-copywriter](skills/website-copywriter/SKILL.md) | 品牌身份、非商品正文、联系和政策文案 |
| [website-image-generator](skills/website-image-generator/SKILL.md) | 内置官方imagegen工作流，生成真实网站素材并在UI交付 |
| [website-acceptance](skills/website-acceptance/SKILL.md) | 仅用户明确触发的整站验收 |

模板清单来自skills/website-builder/catalog.json，目前103项（含22个Home组合参考和toast-01）。Home只查Overview/组件链并默认套用：Header/Footer可换，主体最多自由调整1–2块且数量保持原N±1；其伪代码不作为生产实现。该约束仅用于生成，不加入网站验收。独立模板保留实际结构/响应式/交互；工具不计算相似度或将来源绑定作为ready门禁。

Toast通过toast-01文档由Agent实现为项目共享components/toast.js，移除演示按钮与骨架。装配器只复用项目已有组件并补齐引用/实例；不再从assets/ui安装旧默认Toast，也不建立全局Overlay接口。

图片技能迁入官方工作流、提示词参考、显式CLI后备脚本和许可证，默认内置image_gen；CLI/API仅明确选择后使用。原图复制到material，正式图片发布至src/images并通过website_images展示，对话不重复嵌图。只有运行文件和最终素材进入生产目录，来源/提示词/草稿/截图放metadata_directory。

## 构建与验证

使用Node >=22.13及pnpm开发；发布包由Codex内置Node启动，不需要安装npm运行依赖。

- pnpm build：TypeScript、Vite、服务打包和独立运行依赖。
- pnpm prepare:plugin：构建及完整回归；不安装。
- pnpm test:projects / test:templates：项目与模板读取、装配和实时预览。
- pnpm test:ui：复用调用方Toast、无默认组件、通知与生命周期。
- pnpm test:imports / test:commerce：SDK导入/Mock和账户交易。
- pnpm test:canvas-copy / test:global-entry：画布复制、图片状态与会话入口。
- pnpm test:startup / test:persistence：启动、数据持久化和跨版本复用。
- pnpm test:docs：已有Starlight构建与模板来源一致性，需要参考项目已构建。

工具不可用时使用skills/website-builder/scripts/project.mjs；导入有website-import-data/scripts/import-products.mjs入口。模板选择和页面装配统一由服务CLI维护，已移除旧重复读取/装配脚本。

模板读取链路：MCP的website_templates与project.mjs(action="templates")均调用server/templates.ts的readTemplates；catalog.json提供ID、分类、文件路径和摘要，templates/提供实际文档与源码。select对Home返回程序随机选中的一套，其他分类返回候选列表，summary返回摘要，doc返回Overview，code返回独立组件HTML/JS/CSS；Home的code只返回组合说明，因为其实现段是伪代码。原read-template.mjs独立脚本已合并为上述入口，不表示停止读取模板。

原站/参考目录仅只读。预览代理仅转换传输内容，不写回网站；在线CDN资源由后端代理适配宿主CSP，大图片/HTML采用分片传输。依赖版权说明保留在各自运行包；官方imagegen版权见其LICENSE.txt。

所有历史版本说明统一见 [CHANGELOG.md](CHANGELOG.md)。

## GitLab配置与发布

首页标题行右侧的“插件配置”入口提供PROJECT_DIR（自动只读）、GITLAB_HOST/IP/TOKEN/WEBSITE_DIR/WEBSITE_DEPLOY_DIR（默认空）及GITLAB_DEFAULT_BRANCH（默认main）。本机保存值优先，未保存字段读取同名环境变量；Token在独立配置目录明文保存，并回显到原生设置与内部配置表单。官网源码仍使用main，DEFAULT_BRANCH是部署仓库的打标签基准。

Codex 插件管理页通过官方 openai/settings 扩展展示配置；Token 可直接在原生设置输入框填写，保存后回显，清空后保存可删除。首页配置及详情右侧“部署网站”优先通过宿主模态窗口打开独立 UI 资源，不支持或拒绝时自动回退内部弹窗，发布环境仅显示测试/正式。MCP提供website_gitlab_create/bind/commit/push及website_deploy，优先使用原生表单确认，不支持时由Agent调用Codex提问工具。全部连接、身份、分组、仓库及版本核验通过后才允许API创建北京时间release-/test-标签；每标签仅一个官网，不覆盖已有标签。创建发布标签请求发出前均可取消；取消不回滚已完成的仓库操作，等待执行收尾后解锁。检查/确认/部署期间跨进程禁止项目写入，云端覆盖有完整本地备份；非快进/冲突必须先确认再由系统Git处理。

本功能仅使用隔离模拟GitLab/本地回环接口测试，未连接或部署真实GitLab。deployment_triggered表示标签已创建并触发流水线，最终上线结果需用户自行在正式环境验证。

配置页“测试连接”按网络、TLS/证书、Token、分组及部署仓库逐步诊断；只读检查不发布，错误提示区分TLS与鉴权失败。

配置弹窗采用左侧属性、右侧连接测试结果布局，窄屏自动上下排列；首页设置按钮位于标题行最右侧。旧加密Token只用于兼容读取，后续保存为明文。

当前启用R2部署：插件设置显示只读“S3配置”，两项凭据仅掩码展示。详情页部署按钮左侧显示内部进度/结果Popup，纯JS S3协议精确同步src到桶内项目ID目录。旧GitLab设置与MCP入口已注释保留。部署域名需要管理员已有通配符DNS/TLS与项目目录路由，详见skills/website-builder/references/r2-deployment.md。

图片发布先保留material原图，再由website-image-generator/scripts/compress-image.mjs按蓝湖MCP的TinyPNG方式压缩并原子写入src/images。单任务总尝试数最多3次且持久化，失败保留原图/旧网站图片，UI轮询不会无限重试。支持PNG/JPEG/WebP及5.2MB服务上限；测试均Mock，不自动上传真实素材。
部署结果框右侧内置复制图标，链接以超链接呈现并在系统外部浏览器打开；S3配置字段不显示额外说明文字。


## 首页附件导入项目 files 目录

从首页输入口选择的所有文件（图片、商品 JSON、PDF 等）以内联气泡形式与文本共同展示在提示词输入框中。支持在光标位置处插入文件内容，气泡内展示文件标题与关闭按钮，点击关闭按钮即可删除对应气泡并移除附件；图片内容在气泡中提供缩略图，点击支持全屏灯箱放大查看。发送时，文本单独作为文本消息发送并在对应位置插入 `[xxx]` 占位（包裹对应气泡标题），附件以插件内部链接（`resource_link`）随消息展示。

在发送新聊天前，所有附件以分片上传并持久化。创建请求包含附件数量；只有全部附件完整上传且 SHA-256 校验通过，才允许创建项目。创建完成前将原件复制到 project_directory/files/ 并登记资源；同名不同内容另名保留，重试不覆盖已有文件、不重复归档。空文件保留原始零字节内容。上传失败时保留输入与附件，不发送不完整的新聊天请求。

website_project/website_projects 的项目结果新增 files_directory，匹配首页请求的创建结果提供 files（本地绝对路径、文件名、大小、类型、散列）；website_projects(resources) 可查询 files/ 下的附件。文件以插件内部链接发送，完整原件不依赖宿主引用解析。商品 JSON 应使用返回的本地路径调用 website_products(file_path)，原件不进入 src/ 或部署包，也不在导入时格式化或改写。其他附件与 material 图片库保持各自用途。

原先只有 attachment:// 而未落盘的历史附件无法凭引用自动恢复，需从首页重新选择原文件提交。现有本地 session-assets 资源仍兼容读取。

验证：test:prompt 覆盖首页真实文件选择、光标插入内联气泡、图片灯箱放大预览、删除气泡、分片上传、重名 JSON/图片/PDF 字节校验、资源列表、137 条商品完整统计与导入；test:submission-files 覆盖中断重启、并发分片重试、完整性/取消检查和空文件。


## 固定 R2 配置

R2 的五项参数固定在 server/r2-config.ts，随插件源码与服务端构建产物分发，可按项目所有者授权纳入 Git。运行时不再读取 R2 环境变量、本机 config/r2-config.json 或 r2-key.bin；旧本机文件保留但不影响固定值，原 provision-r2 脚本已移除。配置页依旧只读，访问密钥及签名密钥在配置读取工具中只显示掩码，不打包进前端 HTML。修改参数需编辑固定配置并重新构建、安装/重载。

Codex 插件设置里的 Device access 是宿主提供的权限区域，不是本插件 schema/layout 的配置项；插件侧只声明 S3 配置字段，无法在插件源码中删除该宿主区域。保留画布原有权限声明，以免影响复制链接等功能。

验证：test:r2-settings 检查固定值不受环境/旧文件覆盖及凭据不进入前端；test:r2/test:r2-ui 仅使用模拟对象存储与本机 HTTP，不发起真实云部署。


## Home 程序随机选型

新站调用 website_templates(select,category=home) 一次，从 catalog 实际登记的全部 Home 中用 crypto.randomInt 等概率抽一套，返回 selected.id、strategy=uniform-random 和 poolSize；candidates 仅包含抽中的一套，后续按其文档和组件链生成，不由模型另选或反复重抽。当前目录有22套，数量随目录实际内容变化，不按最高编号推算。用户明确指定模板优先，已有站点局部修改保留版面。MCP和CLI共用该逻辑。

选型不再读取或统计历史使用频率，不记录调用历史，不建立冷却/去重/轮询机制；独立随机允许连续重复。保留的设计说明和可选targets只描述当前项目采用的实现，不用于下一次抽样；既有项目文件不删除。Shop/About等独立页面和组件按内容与真实结构选择，保留至少3个Shop/About候选比较要求。

Header/Footer可换且不计入主体额度；其余主体建议按需要替换0～2块，允许零替换，最多2项自由调整，继续遵守原主体数N±1及源码结构约束，不随机打乱板块链，不添加运行时门禁。
