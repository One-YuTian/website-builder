# Website Builder 0.7.3

1. 网站字体、第三方JS/CSS与图标库统一在线HTTPS CDN加载，不下载或内嵌进生产网站。默认预览改为从在线URL读取后通过宿主代理传输，保留安全隔离；固定的本地依赖仅供显式启用的隔离回归测试使用，生产配置未启用该开关。
2. 图片技能支持独立1:1 favicon，并要求各页head正确引用。Logo优先符合品牌和网站定位的特色排印字标，左侧尽量不带icon；输出真实透明背景图片，紧贴有效字形、无额外透明/白色外边距，不以整体半透明或HTML文字冒充图片Logo。
3. Banner/About按本张内容重点规划，主体尽量处于视觉中心，Banner关键元素的呈现区域位于max-content版心安全区内。逐端查看裁切与文字留白，宽屏两侧用于延展背景，不放关键内容。
4. 叙述性文案更丰富，板块介绍、Banner说明、页脚品牌介绍和联系引导通常用2–4句展开；About/隐私政策继续充分分节。标题、联系资料、导航、按钮、字段及Toast等即时反馈保持明确简洁，不为凑字数遮图或编造承诺。
5. 选首页额外模块前先检查Header真实代码；已有分类套件/入口时不再重复分类模块，改选品牌故事、场景或其他独立内容。
6. 全站控件统一语义样式、圆角、hover/active/focus/disabled及过渡，圆形图标按钮保留圆形；共享theme/uiStyles集中定义，避免各组件随意增加不同效果。
7. 多图轮播通常依实际模板槽位准备2–3张不同主题图片，不能重复同一图填满轮播。Banner之间及Banner与About不得复用同一张图；同一张图片用于多端裁切的复用仍允许。
8. 所有蒙层弹窗/抽屉必须按data-overlay-root、data-overlay-backdrop、data-overlay-panel契约接入共享Overlay.open/close/register；点击内容不关闭，蒙层空白/装饰区域、关闭按钮、Esc走同一关闭流程，并释放滚动锁、恢复焦点/aria。已有组件的动画、open状态和订阅清理通过注册的关闭handler完成，不粗暴推断所有fixed元素为蒙层。
9. 新增内置toast-component及window.Toast.show/success/error/info/warning/dismiss/clear。write和finish对完整HTML自动安装缺失运行文件、注入唯一组件和提前加载的脚本，兼容片段、嵌套及直接写入的页面；不覆盖已有用户实现。业务通知禁用原生alert，登录守卫改为Toast提示后约900ms跳转，并保留画布导航拦截。

Toast使用Light DOM与Tailwind主题class，支持DOM就绪前调用、可访问状态、textContent安全渲染、自动/手动关闭、悬停/焦点暂停和最多4条显示。duration:0保持至关闭，show返回消息ID。uiMessages.close用于本地化，uiStyles.toast/toastClose用于匹配全站控件风格。已有自定义Toast/Overlay应按技能核对API与清理接口；未自动重写历史网站。

## 验证

已通过TypeScript、Vite/tsup构建及UI专项测试：完整/片段/嵌套/直接finish页面均仅装配一套组件；API早于app可用；消息不执行HTML；超时和手动关闭、数量上限、重复脚本幂等；面板内部不关闭、蒙层空白/装饰区域和Esc关闭；焦点与滚动恢复；游客收到Toast后跳登录且无原生alert。

CDN专项测试刻意设置冲突的本地替代映射，验证默认预览仍向上游读取库、字体CSS与字体二进制，生产源码URL不变。features、projects、templates、commerce、proxy及大型预览回归也已通过；测试固定依赖不等同在线站点的运行配置。

本次交付为插件规则、共享UI运行时和构建产物，没有实际生成Logo/favicon/Banner或自动改写已有网站。新规则与装配能力在重新安装/重载0.7.3后生效，历史网站修改时需按新契约接入组件。
