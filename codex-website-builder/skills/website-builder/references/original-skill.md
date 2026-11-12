---
name: website-builder
description: Professional website builder skill adhering to strict development, UI design, mobile-first, single/multi-language, and Web Components principles. Embeds 80 production component templates with progressive on-demand disclosure, page assemble hooks, and site scaffolding scripts.
---

# Website Builder Skill

该 Skill 专为电商网站的快速、高质量、模块化构建设计。内置 80 个经过严格验收的标准模板，并提供**三级渐进式按需读取工具**、**多样化设计系统引擎**与**页面装配 Hook 机制**，杜绝大模型上下文爆炸，严格遵循开发规范、UI设计、移动端适配与语言规则。

---

## 1. 网站标准目录结构

构建或重构网站时，必须遵循以下标准结构组织所有页面与资源（**严禁创建独立的 `tailwind.config.js` 外部文件**）：

```text
├── index.html                 // 主页
├── shop.html                  // 商店页面
├── product.html               // 商品详情页
├── cart.html                  // 购物车页面（非必须）
├── wishlist.html              // 心愿单页面
├── checkout.html              // 结账页面
├── login.html                 // 登录页面
├── register.html              // 注册页面
├── about.html                 // 关于页面
├── contact.html               // 联系页面
├── terms.html                 // 服务条款
├── privacy.html               // 隐私政策
├── return.html                // 退换货政策
├── ...                        // 其他页面
│
├── components/                // Native Web Component
│   ├── header.js              // 页头组件
│   ├── footer.js              // 页脚组件
│   ├── cart.js                // 购物车抽屉与弹窗组件
│   ├── card.js                // 商品卡片与通用展示组件
│   ├── toast.js               // Toast弹窗
│   └── ...                    // 其他组件
│
└── js/
    ├── app.js                 // Tailwind 配置、主应用逻辑、移动端 REM 适配、事件委托与状态管理
    └── data.js                // 商品数据中心、查询过滤、货币格式化与类型转换
```

> **注意（单语言默认准则）**：
> - 未指定多种语言或多种国家时，**默认就是单语言**；
> - **严禁创建 `lan.js`**，严禁引入 `window.lan` 或挂载 `data-lan` 属性；
> - 只有在用户**明确提出多语言/多国家需求**时，才允许按需创建 `js/lan.js` 并启用国际化逻辑。

---

## 2. 核心规范与原则

### 2.1 渐进式按需读取原则（严禁预读全量内容）
1. **先选择模板直接使用，严禁盲目全量预读**：
   - **绝对禁止一上来就把所有模板源码全读一遍**（模板库总计 80 个，全读会导致上下文爆炸与死机）；
   - **平时只能查阅模板摘要**：通过 `read-template.mjs select` 自动选型，或通过 `read-template.mjs list`（Level 1 简介）与 `doc`（Level 2 规范）建立索引；
   - **按需单读源码**：**只有在明确需要输出该页面/组件的具体代码时，才去读取对应模板的具体代码（Level 3 `code <id>`）**。
2. **严禁全量使用 -01 模板（拒绝单一化）**：
   - 库中拥有 80 个涵盖不同排版、画幅与交互形态的丰富变体（`header-01`~`10`、`carousel-01`~`30`、`categories-01`~`07`、`flashsale-01`~`08`、`productlist-01`~`04`、`promotion-01`~`11`、`services-02`~`08`、`card-01`~`23`、`about-01`~`26`、`shop-01`~`12` 等）；
   - **严禁整站无脑默认选用全部 -01 模板**，必须根据站点定位选择多样化的变体编号；
   - 在生成的代码中必须添加来源注释，如：`<!-- Source Template: carousel-14 (blocks > carousel) | Modified: dynamic split hero with badge -->`。

---

### 2.2 默认单语言原则（严禁无关语言混入）
1. **默认单语言约束**：
   - 用户未明确要求多语言或多国家时，**一律默认为纯单语言站点**；
   - **严禁创建 `lan.js`** 文件；
   - **严禁添加 `data-lan` 属性**、`window.lan` 对象或任何多语言切换按钮（如 `中 / EN` 切换药丸）；
2. **严禁语言混杂（文案纯粹性）**：
   - 站点全量文案（标题、导航、按钮、表单占位符、提示、页脚、法规政策等）**必须 100% 保持在用户指定的单一语言**（例如全英文或全中文）；
   - **严禁出现非该语言的其他文案**（如英文站点中夹杂中文注释、中文占位符、中英双语标签等）。

---

### 2.3 全局设计系统与主题配置多样化原则（拒绝死板单一默认）
严禁所有网站千篇一律采用默认蓝（`#0284c7`）、默认 1200px 宽度、默认圆角与完全一致的首页结构！必须针对行业与品牌个性实行多样化定制：

1. **多样化主题调色盘（Theme Palettes）**：
   在 `js/app.js` 的 `tailwind.config` 中按需定义主题色（避免死板单一默认）：
   - **Modern Tech / SaaS（科技深蓝）**：Primary `#4f46e5`，Accent `#eef2ff`，适合 3C 数码、智能硬件；
   - **Organic Nature（自然翡翠）**：Primary `#059669`，Accent `#ecfdf5`，适合有机食品、绿色户外、健康个护；
   - **Editorial Minimal（先锋黑白灰）**：Primary `#18181b`，Accent `#f4f4f5`，适合轻奢潮流、设计师买手店；
   - **Glamour Lifestyle（活力桃粉）**：Primary `#e11d48`，Accent `#fff1f2`，适合彩妆时尚、年轻潮玩；
   - **Warm Heritage（复古琥珀）**：Primary `#d97706`，Accent `#fef3c7`，适合咖啡餐饮、皮具手作。
2. **多样化页面最大宽度（Content Max-Width）**：
   - `1140px`（紧凑内敛）/ `1200px`（标准平衡）/ `1280px`（大气宽屏）/ `1400px`（全景画册沉浸）。
3. **多样化圆角体系（Border Radius Scales）**：
   - 硬朗几何（0~4px）、现代克制（4~8px）、柔和亲和（8~16px）或大圆角胶囊（12~24px）。
4. **多样化首页结构原型（Homepage Archetypes）**：
   - **架构 A（大促脉冲型）**：Header -> Hero -> **Flash Sale 倒计时秒杀** -> Product Grid -> Categories -> Promotion -> Services -> Footer；
   - **架构 B（品牌叙事型）**：Header -> Split Hero -> Promotion 双图横幅 -> Categories 大卡片 -> Curated 货架 -> Brand Story -> Services -> Footer；
   - **架构 C（品类探索型）**：Header -> **Categories 品类矩阵前置** -> Multi-tab Carousel -> Tabbed Product Shelf -> Services -> Footer；
   - **架构 D（极简精选型）**：Header -> Full-bleed Carousel -> Clean Product Shelf -> Single Banner -> Services -> Footer。

---

### 2.4 Tailwind Config 定义与引入规则（强制约束）
1. **唯一定义在 `app.js` 头部**：
   `tailwind.config` **必须且只能**定义在 `js/app.js` 文件的最顶层，直接通过原生 JavaScript 对象挂载到 `window.tailwind.config`；**严禁创建或引用独立的 `tailwind.config.js` 外部文件**。
2. **HTML `<head>` 严格引入顺序**：
   ```html
   <!-- 1. Tailwind CSS Play CDN 引擎 -->
   <script src="https://cdn.tailwindcss.com"></script>

   <!-- 2. 主逻辑与 Tailwind 配置（立即执行，无样式闪烁） -->
   <script src="js/app.js"></script>
   ```

---

### 2.5 极简化模型输出与页面装配 Hook 机制（强制约束）
1. **严禁模型直接输出全量 HTML 页面**：
   - 严禁让模型输出几百行重复的 `<!doctype html>`、`<head>`、CDN `<link>` 与三方脚本；
   - 模型只需返回**当前页面核心业务内容片段**（`<main>...</main>` 或板块片段，包含必要的局部脚本）。
2. **通过 Hook 自动拼装页面**：
   - 使用 Hook 工具 [`scripts/hook-page.mjs`](file:///q:/Projects/DEMO/codex-website-development/.agents/skills/website-builder/scripts/hook-page.mjs) 自动为核心内容注入 `<head>`、Tailwind CDN、`app.js`、`<header-component>`、`<cart-component>`、`<footer-component>` 及底层第三方脚本；
   - 彻底节省模型 Token 消耗，杜绝输出中断。

---

### 2.6 开发与技术栈原则
1. **模块精干**：代码简洁、精干、模块化，避免冗余代码。
2. **零无用输出**：严禁在生产 JavaScript 中输出无意义的冗长注释与调试用 `console.log`。
3. **技术栈**：采用原生 HTML、CSS、JavaScript 开发，严禁无故引入庞大前端重型框架。
4. **Tailwind CSS**：样式统一使用 Tailwind CSS 类名编写，最大化使用 Tailwind class 完成视觉与布局。
5. **Swiper.js 轮播**：所有横幅、商品幻灯片均通过 Swiper.js 实现，保持轻量高效。
6. **jQuery 事件绑定**：页面交互与事件委托统一通过 jQuery 处理，支持自定义广播事件。
7. **LocalStorage 本地状态**：所有交互数据（如购物车商品、心愿单、用户登录凭证）统一存入 LocalStorage 持久化。
8. **Cloudflare CDN 加速**：第三方静态资源（jQuery、Swiper、图标库）统一采用 Cloudflare / cdnjs 加速链接。
9. **矢量图标**：必须使用 Font Awesome 或 Bootstrap Icons 等专业矢量图标库，**严禁使用 Emoji 表情符号**充当 UI 元素。
10. **Google Fonts 字体**：统一通过 Google Fonts CDN 引入指定字体家族（如 `Noto Sans SC`、`Plus Jakarta Sans` 等）。
11. **Web Components**：遵循 Web Components 标准封装独立组件，采用 **Light DOM** 避免样式隔离，确保 Tailwind 样式无缝穿透生效。
12. **长文本截断与 Tooltip**：对于可能溢出的文本使用 `.text-truncate-tooltip`（`truncate` / `line-clamp-2`）截断，并在标签上提供 `title="..."` 作为悬停提示。
13. **全局共享命名空间**：通过 `window` 对象（如 `window.storeData`、`window.appStore`）实现跨组件与跨页面的变量和方法共享。
14. **统一数据源 `data.js`**：所有商品与分类数据必须在 `data.js` 中定义为数组/对象，并提供统一的查询方法（`getAll`、`getById`、`getByCategory`）、格式化输出（`formatPrice`）及数据转换方法（`toCartItem`）。

---

### 2.7 移动端适配原则
1. **Mobile-First（移动优先）**：
   - 先适配移动端视觉与布局，PC 端在移动端类的基础上追加 `md:`、`lg:` 前缀样式；
   - 移动端导航优先使用轻量侧边抽屉（Drawer Menu），PC 桌面端切换为横向主菜单。
2. **响应式断点控制**：严禁在自定义 CSS 中随意书写 `@media` 媒体查询，一律使用 Tailwind 的标准响应式断点（`sm:` 640px、`md:` 768px、`lg:` 1024px、`xl:` 1280px）与网格系统（Grid / Flex）。
3. **移动端自适应间距与字阶**：移动端自动收缩边距与间隙（采用更小的 margin、padding、gap、font-size 与 border-radius）。
4. **REM 动态缩放机制**：
   - 切换到移动端视口（屏幕宽度 `< 768px`）时，系统自动为 `<html>` 根节点设置 `font-size: 12px`；
   - 切换回 PC 桌面端视口（`>= 768px`）时，自动清空根节点 font-size 设置（恢复默认 16px）。
   - 由 `js/app.js` 统一监听 `resize` 事件无感控制。

---

## 3. 内置模板体系与三级渐进式读取工具

Skill 内置了 80 个符合纯净 Markdown 架构的组件与页面模板（位于 `templates/` 目录），其格式统一为：
- `## Overview`（纯英版组件概述、区域划分、尺寸响应式、属性表、事件）
- `## Code`
  - `### HTML`
  - `### JavaScript`
  - `### CSS`（按需）

**必须严格遵守渐进式调用规则，严禁预载全部源码**：

### Level 1：浏览组件目录与简介（轻量摘要）
只返回组件 ID、所属类别与一句话用途，快速建立全局索引：
```bash
node scripts/read-template.mjs list
# 或按类别过滤
node scripts/read-template.mjs list header
node scripts/read-template.mjs list carousel
```

### Level 2：查阅组件接口与规范文档（技术规范，不含代码）
只返回组件的 `## Overview`，包含区域、断点尺寸、属性表与派发事件，**不返回代码**：
```bash
node scripts/read-template.mjs doc header-04
node scripts/read-template.mjs doc carousel-14
```

### Level 3：提取组件源码（仅在输出页面时单次调用）
仅在准备拼装该页面时，提取具体需要的代码块：
```bash
# 提取组件代码
node scripts/read-template.mjs code header-04 html
node scripts/read-template.mjs code carousel-14 html
```

### 智能模板与设计系统选择工具 (`select`)
根据页面类型自动选取**非 -01 的丰富组件组合**，并配套生成**定制调色盘与圆角配置**（仅输出配置与组件 ID 表，不读源代码）：
```bash
# 智能生成 Home 首页的多样化方案（自动匹配非-01模板组合与主题配置）
node scripts/read-template.mjs select --page=home

# 指定风格与布局形态
node scripts/read-template.mjs select --page=home --theme=indigo --layout=pulse
node scripts/read-template.mjs select --page=home --theme=emerald --layout=editorial
node scripts/read-template.mjs select --page=home --theme=mono --layout=clean
```

---

## 4. 页面装配 Hook (`scripts/hook-page.mjs`)

模型生成完页面的核心 `<main>` 或内容片段后，**通过 Hook 进行外层标准骨架装配**，免去大模型输出重复的 `<head>` 与依赖：

```bash
# 方式 1：输入内容片段文件，输出完整网页（默认纯单语言，无 lan.js）
node scripts/hook-page.mjs --input=./body_snippet.html --output=./website/shop.html --title="Shop | Online Store"

# 方式 2：就地装配（如果目标文件中只写了核心 main 内容，直接包裹原文件）
node scripts/hook-page.mjs --file=./website/about.html --title="About Us | Online Store"

# 方式 3：通过命令行管道装配
type body_snippet.html | node scripts/hook-page.mjs --output=./website/deal.html --title="Flash Deals"
```

---

## 5. Agent 最佳实践工作流（极简多样化构建）

当用户要求构建或完善一个页面时，请严格按以下步骤执行：
1. **轻量选型与主题搭配（绝不读源码）**：
   - 运行 `node scripts/read-template.mjs select --page=...` 直接获取组件组合与定制主题配置，或通过 `list` 查看摘要；
   - 绝不预读任何模板的具体代码！
2. **单语言纯净性检查**：
   - 确认用户未声明多语言需求，采用纯单语言（如纯英版），确保不创建 `lan.js`，绝无杂糅文案；
3. **输出页面时才读取模板源码**：
   - 仅对选中的该页面所需组件运行 `node scripts/read-template.mjs code <id> html` 提取纯净源码；
4. **二次定制与来源注释（防同质化）**：
   - 在内置组件源码基础上，定制匹配主题色阶（如 Indigo `#4f46e5`）、圆角弧度、纯单语言文案与动效；
   - 在每个组件使用处保留来源注释（如 `<!-- Source Template: carousel-14 (blocks > carousel) | Modified: custom 16:9 banner -->`）；
5. **通过 Hook 极简组装**：
   - 将精简的核心 `<main>` 内容片段通过 `scripts/hook-page.mjs` 自动装配为完整 HTML 文件；
   - 模型**无需输出**任何 `<head>`、`<meta>`、外部 CDN 链接、全局 Header/Footer 重复引用；
6. **验证产物**：检查页面在移动端与 PC 端的响应式表现、数据交互与控制台无报错。
