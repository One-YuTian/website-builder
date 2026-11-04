# storybook2 精简组件库

独立的原生 Web Components + Tailwind CSS 组件库，已迁移条目见下方目录；全部图文使用带类型标识的骨架，原 `../storybook` 不变。

## 启动与验证

Node.js 20.19+，首次安装需 npm 网络连接；组件预览需连接 unpkg（备用 jsDelivr）与 Google Fonts。

```powershell
cd Q:\Projects\DEMO\codex-website-development\storybook2
npm ci
npm run storybook       # http://127.0.0.1:6008
npm run preview:dev     # 独立预览 http://127.0.0.1:6009，另开终端
npm run verify
npm run build:library   # 更新普通 script 浏览器入口
npm run build
npm run test:browser    # 自动启动构建产物服务，真实访问 CDN
npm run serve          # http://127.0.0.1:6010；独立页 /standalone/
```

浏览器验证优先使用 Windows Chrome/Edge，可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定；其他环境运行 `npx playwright install chromium`。测试自动沿用环境的 `HTTPS_PROXY`，localhost 和 127.0.0.1 直连。构建产物在 `storybook-static`，可由普通 HTTP 静态服务器托管。构建不下载或内嵌运行时 CDN，浏览器测试才验证在线资源。

## 组织与公共接口

| 目录/文件 | 职责 |
| --- | --- |
| `src/index.js` | 唯一公共入口、具名导出、显式组件注册 |
| `src/config/resources.js` | 固定版本 CDN，字体 URL 由主题生成 |
| `src/config/theme.js` | 全局颜色、内容宽度、Google Font、圆角和断点 |
| `public/code/` | 包含组件实际实现、可独立运行的完整HTML |
| `public/playground/` | 构建后的组合演练场 |
| `src/components/` | 原生 Light DOM 组件 |
| `src/stories/` | Guide、Foundations 及后续组件 Stories |
| `src/catalog.js` | 仅收录完成验收的业务迁移 |
| `templates/component/` | 迁移模板，不进入 Storybook 索引 |
| `tests/`、`scripts/` | 浏览器验收与静态约束 |

## 可直接复制运行的代码

组件Doc展示实际组件实现及完整HTML组合代码，而不是对项目脚本入口的调用。Carousel-01与Carousel-03分别提供桌面和Paid/Mobile两段独立代码；同页组合文件在 /code/<id>-responsive.html。其余条目提供单段完整HTML。代码只需可访问在线Tailwind及Google Font，不依赖原项目服务或模块import。

## Playground

打开 /playground/index.html 或 Storybook 的 Guide / Playground。支持添加任意组件和板块、重复添加、上移下移、删除、JSON属性编辑、全局主题、视口320–2560px及内容最大宽度配置。本机自动保存组合；可复制或下载完整HTML，导出包含独立移动分支且对公共资源去重。

源码变化后运行 npm run build:examples 更新可复制代码，npm run build:playground 更新演练场；完整 npm run build 和启动 Storybook 会同时更新。生成文件在public/code、public/playground、src/generated，不手工维护。

## 全局设计与 Header 变量

全局配置见 [配置说明](src/config/README.md)：主/次/辅色、最大可用内容宽度1200px、左右最小边距16/24px、Google Font、圆角和断点全部共享。所有组件使用 content-container，Storybook 顶部工具栏可统一切换主题与宽度。

Header 通用 Doc 见 [Header 规范](src/components/header/README.md)。变量固定 isLoggedIn、cartCount、wishlistCount、searchSuggestions；标签无项目前缀。仅展示 Doc/PC/Tablet/Mobile，状态通过 Controls 调整。Doc 只含组件自身说明，来源与验收留在 source.json。

Tailwind 使用固定 `@tailwindcss/browser@4.1.0`，优先 unpkg，加载失败或单源超过 8 秒时自动尝试同版本 jsDelivr；全部失败才提示错误。所有地址统一在 `src/config/resources.js` 管理，失败节点移除，不保留多个有效脚本。运行资源不依赖 npm；Storybook 等开发工具通过 npm 锁定版本。Tailwind 浏览器 CDN 面向开发和展示，本库按此模式交付；未来业务生产集成如需编译 CSS，需单独调整资源约定。参考 [Tailwind CDN 文档](https://tailwindcss.com/docs/installation/play-cdn)。

## 骨架屏基础能力

`<skeleton-placeholder>` 支持 `kind="logo|image|text|title|circle|button"`，默认 text；`lines` 为 1–12，仅 text 生效；`width`、`height`、`radius` 接受非负 CSS 长度（px/rem/em/%/vw/vh/ch 或 0）；`ratio` 接受正数比例，如 `4/3`。文字骨架继承父级基准字号，由全局 skeletonTextSizeOffset 统一增加3px，也可用 `font-size="18px"` 指定；JS 使用 `createSkeleton({ fontSize: '18px' })`。条高为有效字号的0.75em，行间隔0.5em，随字号实时缩放；显式 height 优先覆盖条高。非法值忽略并回退基础样式。骨架无公共事件，不代表加载中。

| 区域标识 | 类型 | 用途 | 默认尺寸/比例 | 响应式表现 |
| --- | --- | --- | --- | --- |
| logo | Logo | 品牌占位，居中显示 LOGO | 128×40px | 可配置尺寸 |
| media / image | 图片 | 主图、封面，显示内置图片符号 | 16:9，演示4:3 | 宽度随容器，符号按可用宽度缩放 |
| circle | 功能图标形状 | 圆形图标 | 48×48px | 固定，可配置；头像使用 image + radius |
| title | 文案 | 标题 | 高0.75em，宽75%；基础演示字号32px | 随字号缩放 |
| text | 文案 | 正文、标签、导航 | 高0.75em，行间隔0.5em | 多行末行宽2/3，基准字号16→19px时高14.25px |
| button | 文案 | 操作文字 | 宽80px，高0.75em | 外层原生按钮负责操作 |

所有组件业务内容均使用骨架，包括按钮和导航；父控件保留无障碍名称。LOGO 和图片符号是中性占位标识，允许显示且保持装饰语义。Foundations 的“文字字号层级”提供12/14/16/18/24/32px对比；演示按钮可通过点击、Enter 或 Space 切换 media 圆角，仅用于验证基础能力。说明文档、管理界面与错误提示可显示文字。

## 已迁移目录

| 分类 | 条目 |
| --- | --- |
| Components / Header | Header-01、Header-02 |
| Components / Footer | Footer-01、Footer-02 |
| Components / Card | Card-01 |
| Blocks / Carousel | Carousel-01、Carousel-03（桌面与独立小屏适配） |
| Blocks / ProductList | ProductList-01、ProductList-04 |

全部支持普通script统一入口和独立预览。文字骨架偏移当前为+3px（相对上一版再增加2px），通过全局配置管理。ProductList两个源布局与卡片结构相同，统一宽度及图文骨架后共享实现，来源记录独立保留。

## 后续迁移

先阅读 `AGENTS.md`。将 `templates/component` 中的实现、Story、README、source 模板复制到相应位置，去掉 `.txt` 并填写占位符。完成后在 `src/index.js` 具名导出并注册，在 `src/catalog.js` 添加稳定 ID、标签和来源文件路径。

命名统一为 `Header-01`、`Header-02`、`Card-01`；目录/ID 为 `header-01`，标签为 `header-01`，导出类为 `Header01`。每个类型从01开始顺序分配，100起自然扩展，已分配编号不重排。独立预览通过 `?component=header-01` 选择组件。

每次迁移必须重写布局与交互，不复用原站运行上下文。README 的区域表明确每处骨架原本是图片还是文案，并写清用途、尺寸及响应式规则；同时提供属性、事件、操作说明和独立调用示例。source.json 保留旧 ID/站点/页面/target、删减内容、保留布局与交互、验收记录。验收通过才加入完成目录。

展示分类统一为 Guide、Foundations、Components、Blocks、Pages、Features；未迁移分类暂不创建空 Story。每个新组件提供 Doc、PC、Tablet、Mobile。不要通过缩放画布模拟设备视口。
