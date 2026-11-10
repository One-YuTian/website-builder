---
name: website-builder
description: 严格遵循选定模板的原始排版与响应式结构，严禁无中生有添加模板外内容；由 AI 自主决定契合品牌的色彩搭配与视觉系统，优先 Tailwind class，复用项目 SDK 与组件，逐页实时预览。
---

# Website Builder

仅在用户要求建站、改页、重生成或切换网站项目时执行生成流程。插件 UI 样式/配置修改不触发建站。

## 1. 严格遵循模板排版，严禁无中生有（硬约束）

* **排版严格一致**：选择某个模板后，**必须严格按照该模板原有的排版、区域划分与元素槽位进行实现**。
* **禁止臆造内容**：**严禁以“电商业务需要”、“商业完整性”等任何借口添加原模板中不存在的结构或内容**。例如所选模板没有左侧筛选侧边栏（Filter Sidebar），就绝不得擅自增加侧边栏；模板只有顶部工具条和商品网格，就只做顶部工具条和商品网格。
* **1:1 槽位真实化替换**：模板中的骨架占位（如 `span.bg-accent`、骨架图标）仅作内容槽位映射，替换为真实的业务文本、真实图片与实际价格，**不得篡改原模板的父子层级、网格列数与对齐方式**。

## 2. 色彩由 AI 自主搭配，打破固定方案（视觉自由度与卡片色差）

* **自主专业审美**：色彩选择与搭配由 AI 根据品牌定位、行业特征与商品风格**自主进行专业搭配**，**严禁死板套用 SKILL 示例或固定色彩方案**。
* **页面背景与卡片必须有清晰色差**：选用页面与板块背景色时，**必须与商品卡片底色有明确区分与层次色差**，严禁卡片底色与页面底色完全相同融为一体。例如：页面/板块背景选用浅灰或中性浅底（如 `bg-slate-50`、`bg-[#f8fafc]`、`bg-[#f1f5f9]`），商品卡片选用纯白（`bg-white`）搭配精致边框；深色模式下亦须具备明暗对比，确保卡片边界清晰、立体可辨。
* **协调与可读性**：AI 自主决定的调色板（主色 Primary、辅助色 Secondary、强调色 Accent、背景 Surface、文字 Content、边框 Outline）须在 `js/app.js` 顶部的 `window.tailwind.config` 唯一定义。必须确保文字与背景满足可读对比度，强调色能准确引导核心交互。

## 3. 响应式与移动端适配保持完全一致（硬约束）

* **移动端列数与断点绝不擅改**：
  * 若原模板移动端（<768px 或 <640px）是**一行显示两个商品（`grid-cols-2`）**，产出时必须**完全保持双列**，严禁擅自降级成单列纵向排版；
  * 若原模板桌面端是 4 列（`lg:grid-cols-4`），产出时严格保持 4 列；
  * 若原模板采用 **Swiper 轮播**（单行多商品横向滑动），产出时必须**完整保留 Swiper 结构与滑动逻辑**，严禁擅自改成静态网格平铺或垂直列表。
* **断点逻辑忠实**：完整继承模板原始的 `sm/md/lg/xl` 规则与显隐分支（如 `hidden lg:flex`），禁止另写自造媒体查询覆盖模板响应式。

## 4. 技术栈与输出规范

* **Tailwind 与原生技术栈**：布局、排版、间距、圆角与状态完全使用 Tailwind class。`tailwind.config` 只能且必须在 `js/app.js` 顶部设置，禁止创建独立配置文件。
* **取消 commerce-config.js 文件声明**：禁止单独创建或引入 `commerce-config.js`。基础电商配置（currency、locale、storageKey）统一在 `js/app.js` 顶部或初始化时声明，由 `SDK.init` 和 `APP` 直接消费，页面中严禁声明或引入该文件。
* **组件单一定名与禁止多次注册**：取消多次 `customElements.define`，严禁对同一构造函数多次定义或别名注册。全站组件必须且只能保留唯一的 `xxx-component` 命名规则（如 `header-component`、`footer-component`、`card-component`、`cart-component`），禁止注册或在模板中使用 `header-01`、`card-01`、`product-card`、`cart-01` 等旧别名；所有 HTML 页面与模板一律使用 `xxx-component` 标签。
* **灵活支持新组件生成，不僵化固定目录结构**：如果所选模板要求使用新的组件或衍生子组件，**必须按需灵活支持生成与组织，严禁死板固守预设目录结构而拒绝生成**。新组件统一创建在 `components/` 目录下，并以 `xxx-component` 规则唯一定义与挂载。
* **购物车与抽屉互斥原则**：`cart.js` 组件与 `cart.html` 购物车页面**严禁同时存在**，必须二选一：
  * **抽屉模式（Drawer）**：使用 `components/cart.js`（定义并注册 `<cart-component>`），点击页头购物车按钮或加购直接唤起浮层抽屉，**严禁生成 `cart.html` 页面**；
  * **独立页面模式（Page）**：使用 `cart.html` 页面，全站所有购物车入口直接跳转至 `cart.html`，**严禁创建 `components/cart.js` 组件，页面中严禁挂载 `<cart-component>`**。
* **SDK 与数据单向流**：商品唯一来源为 `js/data.js` 的 `window.productData`；查询展示走 `window.SDK`，业务持久化走 `window.APP`。组件继承 HTMLElement（Light DOM），不破坏全局样式穿透。
* **输出路径**：所有代码输出在当前会话工具返回的 project 目录及其 `js/`、`components/` 中，决策同步保存至 `website-builder.design.json` 与 `website-builder.templates.json`。

## 5. 视觉与排版细节硬约束（强制遵守）

1. **禁止使用五颜六色的 icon**：全站图标颜色必须保持纯粹与高度克制，严禁页面中出现五颜六色、色彩杂乱的图标（Icon）；图标颜色应遵循全局主色/文字色/中性色规范，保持单色风格。
2. **原模板中文案前面没有 icon，则不要随意添加 icon**：忠实于原模板的排版与视觉表达；原模板中文案、列表项、特性点前若无图标，严禁擅自或随意添加图标（如 checkmark、bullet 图标、装饰性 SVG 等）。
3. **文案介绍中不能出现具体的数据、承诺**：文案内容严禁出现未经真实核实的具体虚构数据（如“已服务 100,000+ 用户”、“提速 99%”等）或绝对化承诺（如“100% 正品保证”、“终生保修”、“无条件包换”等）。
4. **原组件中按钮是圆形，则不要随意改为圆角矩形，如果是圆角矩形，则遵守全局圆角的大小**：按钮形态严格保真与全局统一；原模板组件中按钮若是圆形（如圆形图标按钮），严禁擅自改为圆角矩形；若是圆角矩形，必须严格遵守全站统一的全局圆角规则，不得各处大小不一。
5. **不能出现非模板要求的阴影、投影、hover 描边效果**：视觉效果克制，严禁滥用特效；严禁随意添加原模板中未声明的卡片阴影（`shadow-*`）、浮动投影以及 hover 触发的额外边框描边（如 `hover:border`、`hover:ring`）等视觉干扰效果。
6. **不能随意增加支付 Logo、社交 icon、外链**：严禁擅自增设外链与外部徽标；原模板若无相关槽位，严禁随意在页脚、结算页或任何区域添加支付渠道 Logo（Visa、Mastercard、PayPal 等）、社交媒体图标矩阵或非必要的外部链接。
8. **icon 的背景色保持样式统一，要么没有颜色，要么统一颜色**：图标容器的背景色必须全局保持一致规范，要么通体无背景色（透明背景），要么使用全局统一的背景色（如统一浅底色或同一中性色），严禁不同图标各用各的背景色。
9. **页面圆角不要过大，要么就非圆角，要么就小圆角，要么就全圆角**：页面圆角禁止过大，避免夸张不协调的圆角尺度；圆角风格在全站应统一且清晰——要么完全直角非圆角（`rounded-none`），要么微小圆角（如 `rounded-sm` / `rounded` / `rounded-md`），要么全圆角/胶囊圆角（`rounded-full`，仅限药丸徽章或特定圆形按钮）。
10. **全站版心与左右边距必须保持高度统一**：选用的模板与组件必须严格符合统一排版需求，禁止同一个页面中一个板块保留左右边距而另一个板块随意取消边距贴边展示；全站各区块容器如果有边距，**必须统一保持相同的版心与边距规格**（统一使用 `content-container w-full max-w-content mx-auto px-4 lg:px-6`），严禁左右边距忽大忽小、参差不齐。
11. **商品卡片高度固定与文案两行省略**：同一网格或轮播中的商品卡片必须保持**完全一致的高度与布局结构**（外层 `h-full`，内容区 `flex flex-col justify-between`），标题区域文案过长时必须使用 `line-clamp-2` 截断并显示省略号，严禁因标题字数差异导致卡片高低错落。
12. **面包屑导航超长文案截断省略**：商品详情页及各页面的面包屑导航必须保持单行水平排列，商品名称或层级文案过长时必须设置最大宽度限制并使用 `truncate`（如 `truncate max-w-[180px] sm:max-w-xs`）显示省略号，严禁文案过长折行破坏单行面包屑排版。

## Codex 插件执行流程

以上是 SKILL 的创作要求；模板还原度不进行自动评分，不作为页面生成成功或 ready 的依据。80% 只保留为复用指导，不能理解为允许臆造20%的额外内容。品牌色彩、亮暗方案和内容宽度由 Agent 决定，再选择契合的模板；模板选定后忠实保留其布局与响应式。

1. 提取品牌、语言、货币、商品来源、页面和交互；缺失非关键信息时合理决策，默认单语言。先读 [整站设计](references/visual-design.md)，将简短设计决策和购物车模式保存到 website-builder.design.json；单页修改复用现有系统。
2. 先调用 website_project(action="open",thread_id=当前真实会话ID,name,brief,language,pages)。同一 thread 复用同一项目；仅用户指定新项目才 new_project=true，指定已有项目才 project_id。输出仅在返回的 directory（插件源码 project/xxxx-xxxx-xxxx-xxxx/），不修改来源目录。首次需要预览时调用一次 open_canvas，不重复打开。
3. **完整电商建站必须声明完整页面计划**：默认包含 index.html（首页）、shop.html（商店）、product.html（详情）、wishlist.html（心愿单）、checkout.html（结账）、login.html、register.html、about.html（关于）、contact.html（联系）、terms.html（服务条款）、privacy.html（隐私政策）、return.html（退换货政策）。购物车选 page 时另声明 cart.html、在页面直接实现；选 drawer 时仅省略 cart.html，提供 components/cart.js，不能连带省略品牌、联系或政策页面。只有用户明确限定局部页面或功能范围时才精简；已有不同命名或合并账户页可沿用，但必须逐项核对用途，不能静默遗漏。当前项目已存在时先比较完整清单，用 plan 补充本轮缺页，不另建项目。政策/正文页没有专用模板时复用共享页头页脚与正文版式，不因没有模板而删页，政策内容依据真实业务资料，不编造承诺。完整规划后逐页生成；不得只完成首页和交易页便宣称整站完成。计划页先显示加载扫光，完整输出后独立展示；用户旧文件不自动删除。
4. 首次准备数据读 [商品与SDK契约](references/commerce-data.md)：已有数据/API不造 mock，无数据用少量品牌样本调用一次 website_commerce(action="prepare",thread_id,project_id,products,count,seed,currency,locale)。默认24条，仅明确重建才 regenerate=true。配置统一在 app.js；工具返回 config_defaults 供缺失项合并，不覆盖已有设置，不另建配置文件。账户 register/login/update 必须 await。
5. website_templates(mode="select") 返回候选，由 Agent 选择相容组合，不随机决定主题或强制避开 -01。批量 code 读取本轮1–12个 ids 的 Overview、HTML、JS、必要CSS，先看A/B区域表。模板ID只作来源追溯；代码实际注册/挂载统一改为 xxx-component，嵌套组件和脚本选择器同步映射，同一构造函数只注册一次。可用 targets 保存 website-builder.templates.json，绑定不是成功条件，旧 audit 仅返回来源信息，无需调用。
6. 首次建组件读 [创建规范](references/creation-contract.md)，按 app.js配置/数据SDK → 共享组件 → 页面推进。按模板所需新增 components/ 子组件，不限制为固定几个文件。APP负责持久化，SDK查询，app编排，不能覆盖APP。
7. 修改/重生成前 website_project(action="begin",thread_id,project_id,paths=[目标页])。用 website_write 批量原子保存，fragment=true 自动装配HTML和共享依赖；完整HTML/JS/CSS用fragment=false。写入保留提交的源码格式，不强制多行、缩进或自动格式化。直接写文件也先begin，完成后finish。HTML尚未完整或本地依赖缺失时保持未完成/错误；JS/JSON做语法检查。
8. 完成后在375/768/1280px检查代表页的全站配色、版心/边距、卡片与背景色差、列数、轮播、图像、图标/圆角、标题/面包屑截断和真实交互。检查商品未知/空状态、筛选排序分页、购物车数量/行ID/数值金额、账户、表单/订单；失败判断 success===false。不要虚构审美/还原度分数，未实际验证时如实说明。

## 预览与共享状态

“不添加模板外内容”约束选定组件/页面模板内部的区域，不是删减整站页面的理由。原始目录规范见 [original-skill](references/original-skill.md) 第1节；完整建站规划时读取该节，其他章节仅按需参考。页面范围以用户要求和上方完整清单为准，购物车互斥规则继续执行；完整站点的页头/页脚链接必须指向实际规划并输出的对应页面。

UI使用独立iframe，外链与页面跳转由预览层拦截，外部资源统一代理；正常网站链接仍按相对路径生成，不移除拦截。单页更新只刷新该页，保留其他页面和画布状态；不轮询status、不全站刷新。APP的项目/账户隔离与密码散列保留，本地演示不冒充真实认证/支付。图片优先本地assets，价格保持数字；APP购物车写入使用final_price，行操作使用cart ID。

## 当前会话尚无新工具时

使用同包 scripts/project.mjs，通过stdin接收JSON。action为open/plan/begin/write/finish/status/templates；数据准备为action:"commerce",mode:"prepare"或"validate"。脚本自动读真实CODEX_THREAD_ID，后续携带project_id；路径按本SKILL位置解析，不用旧机器路径。一次shell调用可顺序完成相关写入与finish，输出简短JSON，不回显全部源码。仅按需读 [CDN清单](references/cdn-links.json)，不预读全模板库。
