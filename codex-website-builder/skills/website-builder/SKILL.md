---
name: website-builder
description: 在 Website Builder 插件中按用户需求生成完整电商网站，或修改、重新生成指定页面。自动复用当前会话项目，按页输出与实时预览；模板按需批量读取，减少上下文和重复工具调用。
---

# Website Builder

仅在用户要求建站、改页、重生成或切换网站项目时执行生成流程。插件 UI 样式/配置修改不触发建站。

## 默认流程

1. 从需求提取品牌/行业、目标用户、语言、货币、商品数据、视觉方向、页面与交互。信息不足时采用合理假设并简述；仅业务必需信息需要确认。默认单语言，不生成 lan.js 或语言切换器；多语言仅按明确需求启用。
2. **先打开会话项目，再写任何文件**：`website_project(action="open", thread_id=当前真实会话ID, name, brief, language, pages)`。同一 thread 自动复用已有 project；仅用户要求新项目才传 `new_project=true`，仅用户指定已有项目才传 `project_id`。后续所有写入携带返回的 thread_id/project_id，禁止自行换目录、伪造 thread_id 或写入旧项目。首次建站且画布未打开时调用一次 `open_canvas`；begin/write/finish 不会重复弹出新画布。
3. 新站一次性声明完整页面计划，默认首页、商店、详情、购物车、心愿单、结账、登录、注册、关于、联系、条款、隐私、退换货；按需求补充订单等页面。计划页先在 UI 显示扫光，不创建假完成页。修改旧站只声明/标记本次受影响页面。
4. `website_templates(mode="select", brief=需求摘要)` 一次返回模板 ID 建议；只批量读取本轮用到的 1–12 个模板：`mode="code", ids=[...], section="html/js/css/all"`。共享 header/footer/card 只读一次；不要先 list 全库、逐个 doc、反复读相同模板或预读全部源码。仅接口不清楚时读 `doc`。模板选择应多样化，保留来源注释，不能全部默认 -01。
5. **生成/修改前**调用 `website_project(action="begin", thread_id, project_id, paths=[目标页面])`，让 UI 立即回到加载态。先写一次共享组件/数据/主题，再逐页输出品牌化业务片段。
6. `website_write(thread_id, project_id, files=[{path,content,fragment:true,title}])` 自动装配完整 HTML 并原子提交；JS/CSS 用 `fragment:false`，只输出必要内容，不重复整页 head/CDN/公共结构。关联文件在一个批次写入，单页完成后立即交付预览，不等全站写完。已有完整 HTML 可以直接提交。
7. 用脚本/编辑器直接写文件时也必须先 begin，写完后 `website_project(action="finish",...,paths)`；不要边写边标记 ready。服务会验证完整 HTML 与本地 JS/CSS 是否存在。失败页保持错误/加载态，修好再提交。UI 自动同步状态和变化页面，**不要轮询 status、反复 open_canvas 或全站刷新**。
8. 检查真实商品图、搜索/筛选/排序、详情规格/数量、购物车增减/删除/总价、心愿单、表单与结账确认，以及手机/平板/桌面。原生前端演示不冒充真实支付/认证服务，不存明文密码。只报告实际完成与验证的页面。

## 输出与共享代码

所有输出只在工具返回的 `directory`，形式为插件源码目录 `project/xxxx-xxxx-xxxx-xxxx/`。不得修改原站参考目录。项目跨插件更新保留。

原生 HTML/CSS/JS、Tailwind、Swiper、jQuery、Light DOM Web Components；不额外引入大型框架。主题及 Tailwind config 在 `js/app.js` 顶部，不能另建 tailwind.config.js；初始化等待 DOM/依赖就绪。业务数据统一 `js/data.js`，公共组件使用 `components/header.js`、`footer.js`、`cart.js`、`card.js`，标签为 header-component/footer-component/cart-component。共用数据与状态接口，避免各页复制逻辑。

根据品牌定制颜色、字体、内容宽度、圆角和首页结构，移动优先，使用标准断点；移动 <768px 时由 app.js 设置根字号12px，桌面恢复。使用矢量图标，业务 UI 不用 Emoji。长文案截断并保留 title。图片优先保存到项目 assets/ 再以本地路径引用，避免依赖宿主未声明的外部图片域名。只有明确需要时读取 [详细原则](references/original-skill.md) 或 [CDN 清单](references/cdn-links.json)；原始 80 个模板及两份脚本已完整保留。

## 当前会话尚无新工具时

不要要求用户新开聊天。使用同包 `scripts/project.mjs`，通过 stdin 接收上述操作 JSON：action 为 open/plan/begin/write/finish/status/templates。自动读取真实 CODEX_THREAD_ID；open 返回 directory/project_id/thread_id。示例：

```powershell
'{"action":"open","name":"品牌名","brief":"用户需求摘要","language":"en"}' | node <本技能目录>/scripts/project.mjs
```

后续可在一次 shell 调用中顺序完成关联文件写入与 finish；输出简短 JSON，不回显整个 HTML。路径均以已读取的本 SKILL 文件位置解析，禁止用旧机器的绝对路径。旧 `read-template.mjs`、`hook-page.mjs` 仍可按需使用，但优先批量模板工具与自动装配以减少调用。
