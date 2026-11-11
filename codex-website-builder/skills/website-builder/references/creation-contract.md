# JS、组件与页面创建规范

吸收旧 create-js/create-component/create-page 的职责和依赖顺序，仍由同一个 Website Builder SKILL 完成。新项目首次建组件/页面时读取；单页修改只检查受影响接口，不重复扫描全站。

## 写入与完成

不规定源码的换行、缩进或单双行形式，写入器不自动格式化。website_write 原子保存提交内容；JS/JSON语法错误不会覆盖旧文件。直接写文件先begin，完整输出后finish。HTML完整性与本地依赖检查继续执行。

## 职责与创建顺序

新站先按 [整站视觉设计](visual-design.md) 确定统一色板、亮暗策略、内容/正文/表单宽度与视觉尺度；模板选型服务这些决定。使用已选布局的响应式能力，不照搬所有演示默认值。后续组件与页面复用同一系统，修改单页不重新发明主题。

1. 先确定数据源，准备商品数据/SDK/配置与 `js/app.js`。
2. 创建可复用组件及其读写契约。
3. 最后创建页面和该页初始化逻辑；不引用不存在的文件。

| 文件/层 | 责任 | 避免 |
|---|---|---|
| `js/data.js` | 唯一 `window.productData`，商品数组与薄 SDK 门面 | 每页另造商品、随机改 ID、夹入购物车状态 |
| `js/sdk.js` | 商品查询、价格展示 | 页面/卡片重复筛选排序和格式化 |
| `js/ec-sdk.js` | 业务操作、持久化、事件 | 组件自行 localStorage CRUD |
| `js/app.js` | 顶部 Tailwind/品牌配置、currency/locale/storageKey、幂等初始化、移动适配、共享 UI 事件 | 定义/覆盖 `window.APP`、复制 SDK、在文件顶层读取尚未加载的数据 |
| `components/*.js` | 独立 Web Component 的模板、生命周期、数据绑定、局部刷新 | 页面整块 DOM 的拷贝、挂载两套相同组件 |
| 对应HTML中的`script`标签 | 页面查询、筛选/排序/分页状态、页面表单和空/错状态 | 重新实现共享业务逻辑、跨页全局变量污染 |

经典 `<script>` 可直接运行；SDK 使用 window 全局，辅助私有逻辑放 IIFE/类内部。保留项目已有可靠模块方案，不能为了模仿旧项目强制重写。只有实际跨页/重复区域抽组件，登录/注册/静态正文不必为了统一形式多建包装层。

## 组件契约

- 新生成的组件位于 components/，文件名 kebab-case、类名 PascalCase；注册与挂载只使用唯一 xxx-component（含 card-component）。禁止 header-01/card-01/product-card/cart-01 等旧别名和同一构造函数多次注册。模板需要其他子组件时按需创建，不固定文件清单。已有用户项目不自动改名。
- 继承 HTMLElement，使用 Light DOM；`template(data)` 返回 HTML 字符串，`refresh()` 重读 SDK 并只渲染自身。没有数据时显示空/缺失状态，而不是抛错或编造商品。
- `data-product-id` 传商品 ID，`data-cart-id` 传购物车行 ID。必要属性放 observedAttributes，修改属性后局部刷新。
- connectedCallback 可重入：避免重复初始化第三方库和重复绑定事件。事件作用域局限 this，刷新 DOM 后可用根委托，disconnectedCallback 清理 APP 订阅、DOM 监听、定时器和 Swiper。
- APP 订阅保存 handler 引用，退出时 `APP.off(event, handler)`。成功事件不一定有 success 字段，失败仅判断 `=== false`。购物车/收藏/登录变化刷新相应组件，不 location.reload、不重建画布。
- 外部/用户数据进入 innerHTML 前转义文本与属性；图片地址校验协议。表单使用 label、按钮显式 type，图片保留有用 alt；装饰图 alt 为空。旧规则“避免 alt”不继承。
- 遵循 [模板与 Tailwind 指导](template-fidelity.md)，保真只作创作指导，不参与页面 ready 判断。常规视觉、布局、间距、字阶、断点只用 Tailwind class。仅允许保留选定模板原有且确实需要的 CSS；不能另写 hero/card/grid 等自定义 CSS 覆盖模板。

这里不提供可替代模板的通用卡片/页头 HTML 示例。每个可见区域必须以已选 template 的实际代码为基线；禁止从本规范示例、记忆或模板摘要自行重画。生命周期/SDK 适配只能包在原模板结构周围，不能替换其视觉实现。

模板既有的jQuery交互与委托使用有命名空间的 jQuery `.on('click.productCard', '[data-action="add-cart"]', handler)`；重复连接前先 `.off('.productCard')`，断开时解绑相同命名空间与具体 APP handler。保持源模板的 data-action/data-region 与键盘可访问行为。CustomEvent 派发、Custom Elements 回调、SDK 内部事件等平台机制仍按各自接口处理。
## 页面契约与加载顺序

完整建站的页面范围按 SKILL 中的清单逐项规划：品牌介绍、联系、服务条款、隐私和退换货政策同样是独立页面，不仅是页脚文案。只有购物车是否独立成页取决于 page/drawer 选择；用户明确只做部分页面时才缩减。没有专用模板的政策页沿用整站页头/页脚、版心和正文风格，不借模板限制省略页面，也不编造业务政策。复用已有项目时先核对缺页并 plan，再逐页输出，保留已有文件。

完整页面包含 doctype、lang、charset、viewport、独立 title、header/main/footer。根目录 fragment 使用自动装配，自动检测已存在的两份 SDK；新项目电商配置在 app.js，旧项目的独立配置文件仅作兼容读取；不要在 fragment 再塞一遍共享头尾/CDN/SDK。嵌套路径页面要使用正确的相对路径，必要时提交完整 HTML，不能沿用根目录片段路径。

依赖顺序：

1. head 中 Tailwind 与 app.js 顶部主题设置；CSS/字体/图标按已选依赖一次引入，不混用旧模板的多个版本。
2. 页面正文和共享组件占位。
3. jQuery/Swiper 等实际需要的库。
4. app.js 中的电商配置 → ec-sdk → sdk → data；数据就绪后 SDK.init。
5. 组件定义；connectedCallback 此时可安全查询 SDK。
6. 页面脚本/DOMContentLoaded 初始化，app.init 保持幂等。SDK 初始化不要等到组件已首次渲染后才执行。

对于 API 数据，DOMContentLoaded 不等于数据就绪：先 await API/适配，失败留错误状态，再 SDK.init 和刷新。不要用无条件 setTimeout 猜加载顺序。

`js/app.js` 在文件顶部定义 Tailwind 配置，DOMContentLoaded后执行业务初始化；移动<768px的html根字号必须在组件首轮渲染前设置为12px，切回桌面恢复默认16px/既有桌面字阶，监听仅绑定一次。不能只设body或用transform缩放替代。主题集中在一处；容器宽度、圆角、字体、色彩和断点复用，避免旧项目固定中性色、禁止渐变等规则限制当前品牌。

页面验收围绕真实交互：商店搜索/筛选/排序/分页组合，筛选后重置页码；详情 URL ID/不存在/规格数量；购物车行 ID 操作和数值总价；收藏与徽标同步；表单原生验证、防重复提交、明确成功/错误；结账订单快照和后续查询。空状态与错误状态独立处理。

画布中仍保留导航拦截与独立 iframe。订单完成可以更新当前确认区域；正常网站链接按相对路径生成，不能为“跳到另页”移除预览拦截或刷新整个面板。

## 购物车展示方案

新站默认drawer，只有用户明确要求或保留已有page模式才选page；仍须二选一：page只创建cart.html，在页面中直接实现购物车，不创建components/cart.js或挂载cart-component；drawer只创建components/cart.js并注册cart-component，通过页头购物车入口/加购唤起，不创建cart.html或独立画板页面。两种方案都使用APP.cart和同一数值金额契约。

Cart-01是来源参考，可将其inline结构用于独立页面，或适配为view-mode="drawer"的cart-component。模板本身只是骨架：属性setter不自动重绘，零件数也不能套用默认三项；用真实APP数据/空状态渲染，开关和业务更新后局部refresh。

装配器在有cart.html时不额外挂载抽屉；无cart.html且存在cart.js时挂载一份view-mode="drawer"实例，正文已挂载则不重复。缺少cart.js不注入其脚本。既有项目的inline组件仍兼容，但新生成遵循互斥规则，不主动删除旧代码。非标准命名时用完整HTML明确组织。


异步页面必须在 js/app.js 中暴露 window.websiteReady Promise，涵盖 API 数据、SDK.init、组件注册与首轮渲染；失败 reject 并显示错误，不在 await 之前标记就绪。完整截图会等待该Promise、字体/图片解码与布局稳定，不能用定时延迟冒充就绪。加购、收藏及结算使用APP.auth.requireLogin()或等效登录守卫，提示后跳转登录页；登录成功用APP.auth.safeReturnTo解析returnTo，拒绝外部跳转。

生产目录directory只保留网站运行产物；设计/来源/模板绑定/文案/图片记录、原始数据、临时文件和截图报告统一保存在工具返回的metadata_directory，直接写文件时必须使用该绝对目录，不写进网站。website_write会将根级website-builder.*.json管理记录路由到metadata_directory。此前记录文件的相对名称均按此规则解释。Header桌面与移动菜单必须有Home、Shop、About Us、Contact Us四个可用链接。


## CDN、Toast与组件交互规范

网站所有字体、第三方库/图标依赖用在线HTTPS CDN、统一版本与加载顺序，不向生产目录复制第三方库或字体。自有APP/SDK及组件仍是项目文件。工具会在完整HTML的head注入相对components/toast.js，body注入唯一toast-component，并安装缺失实现；finish同样支持直接写入的页面。脚本必须早于app/账户业务，全局Toast.show/success/error/info/warning/dismiss/clear可用，禁止业务alert。参考实际内置assets/ui/toast.js，不另造不兼容API。

所有蒙层弹窗/抽屉在各组件自身作用域内实现：点内容不关闭，点空白蒙层或Esc关闭，释放滚动锁并恢复焦点/aria。只作规范要求，不提供window.Overlay、统一标记协议或全局监听接口。按钮和输入控件采用统一uiStyles及主题状态token，统一hover/focus/disabled/圆角；保持圆形图标按钮圆形，不改模板结构。


Toast必须按标准WebComponent实现，状态/计时器/事件归ToastComponent实例管理，template/refresh负责安全渲染，connectedCallback幂等、disconnectedCallback清理，注册唯一toast-component；window.Toast仅作薄门面。沿用用户在标准目录加入的components/toast.js，已存在实现不覆盖。

页面逻辑必须写对应HTML的script标签，不创建js/pages或单页js文件；共享app/SDK/组件仍独立。详情/规格/评论太长时折叠、分页或分批展示，完整内容可访问，不无限拉长或永久截断。PC在max-content内统一左右轴线、减少外层水平padding和Logo两侧留白，移动安全边距及控件内部间距保留。CDN避免jsDelivr/jsdeliver及其镜像/别名，优先cdnjs/官方在线CDN。

原生WebComponent内部根委托可使用稳定函数引用的addEventListener/removeEventListener，生命周期内幂等绑定和解除；不在全局函数中管理组件DOM。沿用jQuery的模板仍按命名空间解绑规则执行。
