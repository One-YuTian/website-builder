# 模板复用、Tailwind 与技术栈指导

模板还原度只作为 SKILL 的创作指导，不进行自动打分或门禁。页面生成成功由 HTML 完整性与本地依赖是否就绪判断；设计和交互仍由 Agent 通过真实渲染检查。

## 1. 先设计整站，再复用模板

按 [整站视觉设计](visual-design.md) 决定配色、内容宽度与亮暗策略，再选相容模板。严格按选定模板的区域、父子层级、列数、对齐和响应式分支填充真实内容，不借业务完整性臆造侧栏或其他模板外区域。保真仍只在SKILL中指导，不做自动门禁。主题色、字体、全局 maxWidth、圆角与板块组合由 Agent 统一决定，不要求照搬演示默认值或启用所有亮暗变体。不能只顾组件相似而忽略整站协调。

先读所选模板 Overview 的 A/B 区域表及完整 HTML/JavaScript/必要 CSS，分清图片、icon、文本、评分和价格。不读全库，不凭摘要重画。模板中的独立演示资源加载器和主题注入已由用户清理，直接使用当前纯组件源码，不自行套用旧版脚手架过滤。

code 可以用 ids 批量读取；targets/bind 与来源标记仅用于可选追溯，不是成功条件。已有 website-builder.templates.json（包括旧 threshold）也不会触发还原度、布局类、断点或覆盖率评分。不要为了提交页面而调用 audit；兼容接口仅返回来源信息，不写审计得分、不改变页面状态。

保留或适配 product-id/view-mode，将组件标签统一映射为唯一 xxx-component；保留data-action/data-region 与派发事件，使业务交互可靠。SDK 的 data-product-id 可作桥接。新生成购物车采用cart.html直接展示或cart.js抽屉之一，不同时创建；来源Cart-01的inline结构可用于页面，drawer用于组件。

页面 ready 不等于视觉或业务验收完成。仍需在375/768/1280px检查真实内容、整体设计与功能；无法实际渲染时如实说明，不能虚构相似度或审美得分。

## 2. Tailwind CSS：优先类名，禁止自写一套样式重画

布局、Grid/Flex、尺寸/间距、字体/行高、颜色、边框/圆角、显隐、定位、截断、常规状态与动效均使用 Tailwind class；需要特殊数值用 arbitrary values。不得用 `.hero/.card/.grid` 等自定义 CSS 重做这些能力，不写自定义 @media 替代 sm/md/lg/xl，不混入另一套样式框架。禁止把 class 仅作为选择器，实际样式都塞进 CSS。

只保留选定模板确有需要且无法由标准 utility 表达的原有 CSS/第三方组件必要样式；不能以“共享CSS”“减少类名”“品牌定制”为由绕过。模板原有 CSS 作为来源可核对的例外，不扩展成新的布局系统。JS 运行时测量、Swiper 内部样式和根字号切换不属于作者重画布局的 CSS。

`tailwind.config` **只能定义一次，在 js/app.js 最顶部**，通过 `window.tailwind.config` 挂载；严禁创建/引入独立 tailwind.config.js，也不在页面重写 theme。head 顺序必须是：

```html
<script src="https://cdn.tailwindcss.com"></script>
<script src="js/app.js"></script>
```

`w-full max-w-content mx-auto px-4 lg:px-6` 是模板语义/选择器类，保留该名称，同时在相同元素追加 `w-full max-w-content mx-auto px-4 lg:px-6` 等 utility，使宽度、居中与内边距直接由 class 渲染；不能再为它单独写一段 CSS。具体内边距与所选模板的全局容器要求一致。所有模板实际用到的 primary/secondary/accent/surface/content/muted/outline/on-* 等颜色 token、字体与 content 宽度必须在唯一 Tailwind theme 中定义完整。

```html
<div class="w-full max-w-content mx-auto px-4 lg:px-6 w-full max-w-content mx-auto px-4 lg:px-6">
  <!-- 保留所选模板的原有子结构 -->
</div>
```

上面不是新的视觉模板，只是把原有共享容器样式转为 Tailwind class；不允许据此替换 template 的内部布局。真实 Google Fonts stylesheet link 可随 fragment 提交，装配器会移入 head；family 必须和 Agent 决定的 fontFamily 一致，不添加重复字体。
移动优先；sm=640、md=768、lg=1024、xl=1280。所选模板使用 lg 切换的 PC/移动双结构必须保留，不能因为 REM 在768切换就把布局断点也改成768。移动间距/字阶按模板自适应。app.js 用一次 resize 监听处理 `<768px → html font-size:12px`，`>=768px → 清空根 font-size`，不写独立 @media。

## 3. 原 2.6 开发与技术栈原则在本插件中的要求

1. **模块精干**：原生 HTML/CSS/JS，复用模板、SDK、共享组件，禁止无故引入重型前端框架与多套重复实现。
2. **零无用输出**：生产 JS 不输出调试 console.log、冗长无意义注释；保留模板来源及必要的复杂业务说明。
3. **Tailwind 最大化**：样式由 class 渲染，遵守上一节；不自行搭建样式体系。
4. **Swiper 轮播**：所有横幅与商品滑动货架使用 Swiper；保留所选模板的 wrapper/slide、比例、参数、移动行为及控件。禁止改成 CSS scroll-snap 或自己写计时器替代。
5. **jQuery 交互**：页面交互、事件委托和自定义广播统一 jQuery；命名空间绑定/解绑，不能重复监听。Web Component 生命周期、CustomEvent、SDK 与第三方内部事件按其平台接口运行，DOM 主结构不因换绑定方式改变。
6. **LocalStorage 状态**：购物车、收藏、演示登录态与订单通过 APP 封装持久化；组件不得另写状态库。保留0.6版密码散列及项目/账户隔离，不恢复明文登录密码；前端演示不替代后端认证。
7. **Cloudflare/cdnjs**：jQuery、Swiper、图标库等三方静态库统一 cdnjs 的已选版本，不重复加载或任意切换库。Tailwind 使用官方 Play CDN、Google Fonts 使用官方字体 CDN；预览层代理资源，不改原站代码。
8. **矢量图标**：使用 Font Awesome 或 Bootstrap Icons；不使用 Emoji 充当 UI 图标。模板图标槽位替换不改变控件区域/尺寸关系。
9. **Google Fonts**：按品牌指定 Google Fonts 家族，保证 stylesheet 与 Tailwind fontFamily 一致。
10. **Web Components**：Native Custom Elements + Light DOM，让 Tailwind 穿透；禁止 Shadow DOM 阻隔全局 utility。
11. **长文本**：使用 truncate/line-clamp-2，可保留 text-truncate-tooltip 语义名，并提供 title。不要用手写 CSS 代替 Tailwind 截断。
12. **window 共享命名空间**：SDK、APP、app、storeData 各司其职，避免覆盖和重复全局声明。
13. **data.js 唯一源**：商品/分类在 data.js 统一定义。新数据工具同时提供 storeData.getAll/getById/getByCategory/formatPrice/toCartItem，查询/格式化委托 SDK；toCartItem 始终传 final_price 数值。已有项目可加薄门面，不复制第二套商品数组。
