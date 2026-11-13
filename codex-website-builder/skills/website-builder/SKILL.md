---
name: website-builder
description: 规划电商页面并组合模板，协调文案、图片和商品数据，逐页输出并实时预览。
---
# 网站构建

负责项目、整站设计、模板组合、组件与页面实现。插件UI/配置修改不触发建站；已有网站局部修改只处理用户指定范围。网站要求只指导生成，不增加相似度评分、业务扫描或ready门禁。

## 职责与按需引用

| 工作 | 唯一负责技能/文档 |
| --- | --- |
| 用户商品JSON读取、二次分类、图片CDN适配 | [website-import-data](../website-import-data/SKILL.md) |
| 没有有效商品数据/API时的商品样本 | [website-mock-data](../website-mock-data/SKILL.md) |
| 品牌身份、非商品文案、虚构联系资料 | [website-copywriter](../website-copywriter/SKILL.md) |
| Logo、favicon、Banner、About配图、图片ICON | [website-image-generator](../website-image-generator/SKILL.md) |
| 用户明确要求整站验收 | [website-acceptance](../website-acceptance/SKILL.md)，不自动调用 |

向各技能传递brief、国家/语言、槽位和已有内容，接收实际产物，不在主技能重复维护其工作流。已有有效数据、文案、图片直接复用；完整站点缺项则实际调用负责技能，不能只列链接后填占位。商品描述/价格归数据技能，非商品正文归文案技能；图片技能不生成商品图或头像。

## 生成流程

1. 提取品牌、国家/语言、币种、商品来源和页面范围，读取[整站设计](references/visual-design.md)及[网站要求](references/site-requirements.md)。新站主版心在1200–1550px中实际随机取一个整数，每站仅取一次，记录maxContentWidthPx到metadata_directory/website-builder.design.json，并应用到js/app.js唯一Tailwind主题；后续页面复用，用户指定值优先。设计文件记录色板、明暗、字体、版心、板块与购物车方案。
2. website_project(action="open",thread_id=当前真实会话ID,name,brief,language,pages)复用项目；仅明确新项目才new_project=true。完整站点规划首页、Shop、商品详情、心愿单、结算、登录、注册、About Us、Contact Us及实际政策页，订单路由随功能补齐。默认共享drawer cart；仅明确要求或保留已有页面模式才生成cart.html，不重复两种方案。Header桌面与移动均包含Home/Shop/About Us/Contact Us实际链接。
3. 首次预览调用open_canvas(thread_id=当前真实会话ID)。所有正式成品只写返回directory；原始JSON、提示词、候选图、草稿、报告、记录只写metadata_directory，不向生产目录加临时或数据源文件。
4. 按职责表准备内容；集成时读[SDK契约](references/commerce-data.md)。账户异步接口await，保持既有APP/SDK、数据和账户隔离，不另造状态库。
5. 按下节选择Home参考和实际组件。首次实现读[创建规范](references/creation-contract.md)；Shop另读[Shop接入](references/shop-integration.md)，同时读取所选Shop与Card完整源码。app.js由主技能随所选模板及站点design生成，包含实际主题、依赖/组件就绪、移动适配与数据初始化，不由商品工具生成、不从assets复制固定版本。运行时仅输出一份sdk.js，按sdk.js→data.js→app.js→共享组件→页面内联脚本加载；主题配置与唯一SDK.init都在app.js，静态目录初始化先于组件注册，异步就绪按SDK契约执行。
6. 改页前begin，每完成一页立即website_write或直接落盘再finish，不等全站代码生成完。接口仍允许多HTML批量导入；按[代码输出](references/code-output.md)使用本地Prettier格式化。结束前finish收尾，使完成页面及时ready。
7. 用真实内容检查375/768/1280px的代表页面与交互，仅报告实际结果。完整图片用website_screenshot等待加载/解码/稳定布局后获取，不以画布缩略图代替。全面验收仅由用户明确调用website-acceptance。

## 模板选择

website_templates(mode="select")返回未排序候选及usage，不自动决定设计。完整新站先从Home候选阅读Overview、Component Chain和区域说明，并执行[Home套用与有限自由组合](references/home-composition.md)的生成硬约束：默认沿用选定组合；除Header/Footer外，单次最多自由调整1–2个主体板块，允许零调整；原主体数N对应输出N−1至N＋1，原有5块则输出4–6块。替换/新增/删除/移动均占额度，不是整页自由重组。Home代码是伪代码，不用作生产源码；独立组件必须逐个查阅完整HTML/JS/CSS并以实际结构为基线，概要与源码冲突时以源码为准。该规则仅约束生成与开发自查，不纳入验收，不设运行时门禁。

独立Shop/About/组件仍以实际区域、网格、响应式和交互为准，不凭摘要重画。完整新站比较至少3个Shop与3个About候选（不足则全看），结合实际结构与内容需要，兼容时优先较少使用布局，不总选第一个或机械排除-01。已有站点局部修改沿用原布局。

每批code读取1–12个确定使用ID。来源ID不作为生产标签，实际注册/挂载统一唯一xxx-component，嵌套标签/选择器同步映射，每个构造函数只注册一次。targets可追溯来源，不把绑定或旧audit当成功条件。

完整首页应有主视觉、商品展示与合适的特色板块；原Home已含这些内容时不为凑“额外1–2块”重复新增，具体组合与数量服从上述生成硬约束。Header已有分类套件时，在自由额度内替换重复分类用途，尽量保持数量。库中所有组件/板块/页面均可选用，包含Home-03的限时抢购；不要因“未经确认的促销承诺”直接删模块。保留合适结构，按[文案边界与已授权服务](../website-copywriter/references/content-policy.md)填内容，商品数值仍取数据/SDK。

## Toast、组件与资源

先通过website_templates读取toast-01文档，按WebComponent规范实现项目共享components/toast.js及window.Toast API，移除演示按钮、骨架区与样例业务文案，样式匹配网站。共享组件先落盘，再生成页面；装配器仅在项目已有Toast时补齐引用和实例，不再从assets/ui复制默认实现。禁止alert，不建立统一Overlay接口；每个蒙层组件自行实现空白关闭、面板内点击不关闭。

主题、状态样式和基础工具类按创建规范统一。页面专属逻辑放当前HTML的script；全站移动端html根字号12px，其他断点遵循所选组件。Logo必须是图片；图标不用字符/Emoji，商品及Banner不用自绘SVG。素材生成、图文主体安全区和画布加载状态归图片技能，主技能负责按实际图片/文案完成响应式排版。

所有字体/第三方库通过在线CDN加载并避免jsDelivr，只输出实际依赖。预览资源异常先区分源码和传输，不为绕过限制删图、降质或删板块；预览代理不改写网站源文件。

## 工具未加载时

用同包scripts/project.mjs通过stdin传JSON，支持open/plan/begin/write/finish/status/templates及commerce。使用真实CODEX_THREAD_ID及返回project_id，按脚本位置解析CLI，不写死机器路径。商品导入入口归website-import-data。需要CDN地址时读[CDN清单](references/cdn-links.json)，不预读全库。
