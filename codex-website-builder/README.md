# Website Builder

当前版本0.8.2，见[版本说明](CHANGELOG-0.8.2.md)。beta分支提供可直接加载的预构建插件，使用Codex内置Node运行。

## 项目与画布

通过真实thread_id复用项目，open_canvas(thread_id)直接进入当前会话项目详情。无会话/项目时显示项目首页；手动返回首页不被轮询拉回。项目和SQLite数据位于独立用户数据目录（Windows默认LOCALAPPDATA/codex-website-builder，其他平台为XDG_DATA_HOME或~/.local/share），可用WEBSITE_BUILDER_DATA_DIR及WEBSITE_BUILDER_PROJECT_ROOT覆盖。

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

图片技能迁入官方工作流、提示词参考、显式CLI后备脚本和许可证，默认内置image_gen；CLI/API仅明确选择后使用。最终图片复制到项目并通过website_images展示，对话不重复嵌图。只有运行文件和最终素材进入生产目录，来源/提示词/草稿/截图放metadata_directory。

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

模板读取链路：MCP的website_templates与project.mjs(action="templates")均调用server/templates.ts的readTemplates；catalog.json提供ID、分类、文件路径和摘要，templates/提供实际文档与源码。select返回候选列表，summary返回摘要，doc返回Overview，code返回独立组件HTML/JS/CSS；Home的code只返回组合说明，因为其实现段是伪代码。原read-template.mjs独立脚本已合并为上述入口，不表示停止读取模板。

原站/参考目录仅只读。预览代理仅转换传输内容，不写回网站；在线CDN资源由后端代理适配宿主CSP，大图片/HTML采用分片传输。依赖版权说明保留在各自运行包；官方imagegen版权见其LICENSE.txt。

历史发布说明：[0.8.1](CHANGELOG-0.8.1.md)、[0.8.0](CHANGELOG-0.8.0.md)、[0.7.9-beta.3](CHANGELOG-0.7.9-beta.3.md)、[0.7.9-beta.2](CHANGELOG-0.7.9-beta.2.md)、[0.7.9-beta.1](CHANGELOG-0.7.9-beta.1.md)。
