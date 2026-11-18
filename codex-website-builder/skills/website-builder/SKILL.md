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

## 先创建项目，再进入详情，最后生成内容

所有新建网站需求均遵循此顺序，包括插件首页输入框与 Codex 对话框。先从已有需求提取项目名称、国家、语言、类目、品牌，信息不全可先创建空项目。不得先导入商品、规划页面、选择模板、写设计文件、生成文案/图片/页面代码。已有网站局部修改继续复用对应项目。

### 插件首页提交：新对话自动打开项目详情

无论从全局侧边栏还是对话内入口打开插件，UI 面板新建任务始终开启新对话并立即提交文字和附件（target=new, send=true）。发送失败时保留草稿；创建项目后，必须在新对话自动打开一次侧边 UI 并进入该项目详情，不能只更新来源面板。

用户消息正文仅包含用户需求和附件，不追加 panel_id/request_id、工具调用或流程说明。来源面板可以跟随创建结果，但不替代新对话的侧边 UI。

收到新建需求后，先查询 website_panel_context(thread_id=当前真实会话ID, requirement=用户需求原文)。requirement 使用完整原文（仅附件时为“请根据附件创建网站。”），不得改写或总结。后台仅匹配近期、未处理且需求一致的提交并返回 submission，不按全局最近项目猜测。submission_ambiguous=true 时停止自动关联并说明存在重复待处理需求，不选择任意面板。没有匹配时继续下方 Codex 对话提交流程。

上下文或查询结果包含 submission（request_id、panel_id）时：

1. 尚未创建项目时，首个建站业务操作调用 website_projects(action="create", panel_id=上下文panel_id, request_id=上下文request_id, thread_id=当前真实会话ID, name, country, language, categories, brand, domain)，创建空项目（domain 为可选官网域名，如 www.xxx.xx，用户提供时自动填入）。不得遗漏 request_id，不复用旧项目，不传页面计划；同一 request_id 重试返回同一个项目。
2. 创建成功后立即调用 open_thread_canvas(thread_id=当前新对话真实ID) **一次**，在新对话中打开侧边 UI；它恢复本次已绑定项目并自动进入详情。随后查询 website_projects(action="submission", panel_id=来源提交panel_id, request_id)，等待 chat_detail_ready=true，再执行下方生成流程。不能只等待来源面板的 detail_ready，也不能仅在文字里说“已打开”；实际调用画布工具。已收到新对话详情就绪回执时跳过重复打开。未就绪继续查询并处理报错，不循环打开多个 UI。
3. 如果上下文已返回 state="created" 的 submission，直接沿用既有项目执行第2步，不另建项目。会话中用户关闭UI后可按需重新打开同一项目。禁止用打开动作调用new_project=true。沿用返回的 project_id 与 directory；后续 website_project(action="open", project_id=该ID, ...) 仅补齐元数据。进入详情后才读取附件、规划页面或生成内容。

### Codex 对话提交

无 submission 时先查询 website_panel_context(thread_id=当前真实会话ID)。新站调用 website_project(action="open", thread_id, new_project=true, name, country, language, categories, brand, domain) 创建空项目（domain 为可选官网域名，如 www.xxx.xx），**此时不传 pages**；已有项目局部修改则传 project_id 复用。随后 open_canvas(thread_id=当前真实会话ID) 进入该项目详情，初次打开一次；已有对应详情时跳过无谓重复，用户需要时可在会话途中再次打开同一项目详情。完成项目创建与详情进入后，才规划页面、准备数据和生成内容。

## 生成流程

以下步骤仅在项目已创建且详情已进入后执行，全程沿用同一个project_id，不再次新建项目；会话中可以按需重新打开面板并恢复该项目详情。

1. 提取品牌、国家/语言、币种、商品来源和页面范围，读取[整站设计](references/visual-design.md)及[网站要求](references/site-requirements.md)。新站主版心在1200–1550px中实际随机取一个整数，每站仅取一次，记录maxContentWidthPx到metadata_directory/website-builder.design.json，并应用到js/app.js唯一Tailwind主题；后续页面复用，用户指定值优先。设计文件记录色板、明暗、字体、版心、板块与购物车方案。
2. website_project(action="open",thread_id=当前真实会话ID,project_id=已创建项目ID,name,brief,language,country,categories,brand)补齐元数据；website_project(action="plan",thread_id,project_id,pages)规划页面。完整站点规划首页、Shop、商品详情、心愿单、结算、登录、注册、About Us、Contact Us及实际政策页，订单路由随功能补齐。默认共享drawer cart；仅明确要求或保留已有页面模式才生成cart.html，不重复两种方案。Header桌面与移动均包含Home/Shop/About Us/Contact Us实际链接。
项目标题元数据在open时显式提供：country为国家名称或ISO两位国家代码，language为实际语言代码，categories为最多两个主要商品类目，brand为品牌名。列表标题自动组合“国家 · 语言｜主要类目”，品牌保存为独立元数据供搜索与标题回退；卡片保持标题和时间两行，不额外增加品牌副标题。未知字段不猜测也不显示占位字样，可后续以open补齐。例：country="BR", language="pt-BR", categories=["家居","生活用品"], brand="Casa Sol"，显示“巴西 · 葡萄牙语｜家居与生活用品”。生成/改页前必须begin，页面完成write/finish，图片任务用begin/finish/fail如实登记；这些记录用于首页运行状态和删除保护。超过30分钟无更新的生成记录视为中断，继续任务先begin续期，不让失败任务长期占用运行状态。

3. 项目使用新版目录：project_directory为Git项目根（README.md、src/、material/、files/、.git/）；directory/source_directory固定指向src，页面与组件相对路径从src起算，不再额外加src前缀。README.md介绍品牌、域名、国家/语言、页面范围与运行方法，由主技能随信息完善（website_write的README.md专门写入项目根）。首页上传的所有附件原件自动归档到files_directory（项目根files/），创建结果files或website_projects(resources)返回本地绝对路径；商品JSON用此路径交给website-import-data技能，不依赖attachment://，不把有效用户数据回退为Mock。生成原图与候选图片写material_directory；正式引用图片用src/images/logo.png、favicon.png、banner1.png、banner2.png、about.png等固定文件名。其他原始JSON、提示词、草稿、报告和记录只写metadata_directory；旧格式不兼容、不自动迁移。详情已在前述入口流程打开，此处不再调用open_canvas。
4. 先按下节选择Home与实际组件并读取完整源码、整理素材槽位，再按职责表准备内容；不得在模板确定前固定生图数量。集成时读[SDK契约](references/commerce-data.md)。账户异步接口await，保持既有APP/SDK、数据和账户隔离，不另造状态库。
图片任务数按最终所选模板/组件的实际槽位确定，不固定为5张；Logo、Favicon必须提供，Banner、About、分类图与图标等按需列清单并交给图片技能。适合统一风格网格图集的图标/分类图可合并生成后切割为独立文件，记录各槽位与成品路径。生成原图保存在material_directory，修改时可将历史版本保留在material/history；网站只引用images下的固定语义文件名，按图片技能发布更新。
5. 按下节选择Home参考和实际组件。首次实现读[创建规范](references/creation-contract.md)；Shop另读[Shop接入](references/shop-integration.md)，同时读取所选Shop与Card完整源码。app.js由主技能随所选模板及站点design生成，包含实际主题、依赖/组件就绪、移动适配与数据初始化，不由商品工具生成、不从assets复制固定版本。运行时仅输出一份sdk.js，按sdk.js→data.js→app.js→共享组件→页面内联脚本加载；主题配置与唯一SDK.init都在app.js，静态目录初始化先于组件注册，异步就绪按SDK契约执行。
6. 改页前begin，每完成一页立即website_write或直接落盘再finish，不等全站代码生成完。接口仍允许多HTML批量导入；按[代码输出](references/code-output.md)使用本地Prettier格式化。结束前必须finish收尾，既使页面及时ready，也将该轮初始化/修改提交到网站项目的main；图片/文案/README等单独修改也不能省略，无变化不空提交，不推送。遵循[项目Git提交与异常确认](references/project-git.md)，遇到GIT_CONFIRMATION_REQUIRED等情况先询问用户，确认后才使用系统git处理。
7. 用真实内容检查375/768/1280px的代表页面与交互，仅报告实际结果。完整图片用website_screenshot等待加载/解码/稳定布局后获取，不以画布缩略图代替。全面验收仅由用户明确调用website-acceptance。

## 模板选择

完整新站调用 website_templates(mode="select",category="home") **一次**：程序使用 crypto.randomInt 从当前目录中所有实际可用Home等概率抽取一套，返回 selected.id。必须以该结果作为首页基准，不由模型另选、不因偏好反复重抽；用户明确指定模板时优先按用户要求，已有站点局部修改保留当前版面。选型不记录调用历史，不读取/统计历史使用次数，也不做跨项目去重；独立随机允许重复。

读取抽中Home的Overview、Component Chain和区域说明，并执行[Home套用与有限自由组合](references/home-composition.md)：默认沿用抽中的组合；Header/Footer可更换，不计入主体额度；其余建议按实际内容需要替换0～2个主体板块，允许完全不换。仍沿用主体数N对应输出N−1至N＋1的既有约束，原有5块则输出4–6块。替换/新增/删除/移动均占最多2项额度，不是整页自由重组。Home代码是伪代码，不用作生产源码；独立组件必须逐个查阅完整HTML/JS/CSS并以实际结构为基线，概要与源码冲突时以源码为准。该规则仅约束生成与开发自查，不纳入验收，不设运行时门禁。

独立Shop/About/组件仍返回完整候选，以实际区域、网格、响应式和交互为准，不凭摘要重画。完整新站比较至少3个Shop与3个About候选（不足则全看），结合实际结构与内容需要选择，不参考历史使用次数，不总选第一个或机械排除-01。已有站点局部修改沿用原布局。

每批code读取1–12个确定使用ID。来源ID不作为生产标签，实际注册/挂载统一唯一xxx-component，嵌套标签/选择器同步映射，每个构造函数只注册一次。targets可追溯来源，不把绑定或旧audit当成功条件。

完整首页应有主视觉、商品展示与合适的特色板块；原Home已含这些内容时不为凑“额外1–2块”重复新增，具体组合与数量服从上述生成硬约束。Header已有分类套件时，在自由额度内替换重复分类用途，尽量保持数量。库中所有组件/板块/页面均可选用，包含Home-03的限时抢购；不要因“未经确认的促销承诺”直接删模块。保留合适结构，按[文案边界与已授权服务](../website-copywriter/references/content-policy.md)填内容，商品数值仍取数据/SDK。

## 表单与横向交互

所有输入框关闭浏览器自动填充，聚焦不显示原生outline而采用统一自定义焦点样式。Contact校验通过后清空并Toast提示发送成功；注册先做宽松手机号校验，再按目标国家/域名执行IP检查并以Toast警告失败，具体执行[表单交互](references/form-interactions.md)。所有网站横向内容滚动统一Swiper，不使用原生横滚和滚动条。详情长内容与更多展示沿用模板，不强制新增折叠/分页。

## Toast、组件与资源

先通过website_templates读取toast-01文档，按WebComponent规范实现项目共享components/toast.js及window.Toast API，移除演示按钮、骨架区与样例业务文案，样式匹配网站。共享组件先落盘，再生成页面；装配器仅在项目已有Toast时补齐引用和实例，不再从assets/ui复制默认实现。禁止alert，不建立统一Overlay接口；每个蒙层组件自行实现空白关闭、面板内点击不关闭。

全站所有顾客可见文案均执行website-copywriter的正式网站要求，不能出现“目录准备中”“演示版本”等开发或未完成措辞；内容须贴近品牌、类目与真实使用场景，不能只在About/政策执行。共享Footer必须直接展示邮箱、带区号联系电话和完整地址，PC/移动及简化页脚均不得省略，资料全站一致；Contact正文不预留重复联系方式，保留表单与必要引导，联系方式集中于Footer；所选Footer缺项时选相容模板或补齐信息区。

主题、状态样式和基础工具类按创建规范统一。页面专属逻辑放当前HTML的script；全站移动端html根字号12px，其他断点遵循所选组件。所有需要显示商品图的槽位/骨架/加载区使用纯白色#fff背景，包含卡片、详情主图/缩略图、分类商品坑位及购物车；不以灰色或渐变底替代。Logo必须是图片；图标不用字符/Emoji，商品及Banner不用自绘SVG。素材生成、图文主体安全区和画布加载状态归图片技能，主技能负责按实际图片/文案完成响应式排版。

所有字体/第三方库通过在线CDN加载并避免jsDelivr，只输出实际依赖。预览资源异常先区分源码和传输，不为绕过限制删图、降质或删板块；预览代理不改写网站源文件。

## 验证模式与部署边界

- **自动验证（默认 / `verification_mode: "auto"`）**：除商品库处理、图片生成、页面生成外，还需调用网站验证 SKILL（如 `website-verifier` / 截图与交互验证）进行全流程检查，确保页面与功能无误后再收尾。
- **手动验证（`verification_mode: "manual"`）**：仅负责商品库处理、图片生成与页面生成并执行 `website_project(action="finish")` 完成输出；**禁止**调用网站验证 SKILL 或执行截图/全流程自动验收，由用户手动验证页面与功能逻辑。
- **禁止自动部署**：无论是自动验证还是手动验证模式，普通建站流程均**不负责网站部署**；仅当用户明确要求部署时，才按需执行[R2静态网站部署](references/r2-deployment.md)或[GitLab部署流程](references/gitlab-deployment.md)。

## 工具未加载时

用同包scripts/project.mjs通过stdin传JSON，支持open/plan/begin/write/finish/status/templates及commerce。使用真实CODEX_THREAD_ID及返回project_id，按脚本位置解析CLI，不写死机器路径。商品导入入口归website-import-data。需要CDN地址时读[CDN清单](references/cdn-links.json)，不预读全库。

素材关系：material是完整素材库，src/images只是其中网站实际引用成品的子集；未采用的候选素材、原图和历史版本只保留material，不批量复制到images。详情页图库只展示material中的现存素材，不扫描src/images或附件目录，也不从过期资源索引补图。

## R2部署（仅用户明确要求时）

使用[R2静态网站部署](references/r2-deployment.md)。仅用户明确要求时使用website_r2_deploy，按项目ID精确同步src并核验后返回链接；普通建站不自动上传。旧[GitLab流程](references/gitlab-deployment.md)暂停，代码/说明保留，勿调用其配置或部署工具。

注册IP请求地址和合法国家统一配置在window.commerceConfig.registrationIP，不在页面复制独立配置。commerceConfig不包含storageKey，LocalStorage使用固定业务键，账户相关状态仍隔离。

图片原始文件只写material；正式图片经website-image-generator的[压缩发布流程](../website-image-generator/references/image-compression.md)进入src/images，同一任务最多3次，失败不以原图直接替代发布。
