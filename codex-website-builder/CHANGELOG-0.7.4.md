# Website Builder 0.7.4

## Toast与弹窗规范

保留用户在标准目录参考中加入的components/toast.js声明，没有覆盖该参考文件。内置Toast重写为命名ToastComponent：继承HTMLElement、Light DOM、template(data)/refresh()、唯一toast-component注册。状态、定时器、根事件归组件实例所有；connectedCallback幂等，disconnectedCallback解除监听/清理计时器，重连可恢复。window.Toast保留为薄调用门面及DOM就绪前队列，不在全局函数直接管理组件DOM。

撤回0.7.3的统一Overlay接口、data-overlay协议及全局点击/Esc监听。运行时不再注册window.Overlay或自动处理蒙层。提示词/文档仍要求每个组件自行实现蒙层空白关闭、内容不误关、按钮/Esc一致清理、滚动/焦点/aria恢复，不通过统一接口实现。

## 布局与脚本规范

- 在线CDN避免jsDelivr/jsdeliver及其镜像/别名，优先cdnjs、Google Fonts或库官方可用CDN；保持实际依赖版本，不为换CDN静默升级。
- PC在max-content最大内容宽度内，Header/Logo、主视觉文案、商品区域、各板块和Footer尽量左右对齐，减少外层与嵌套水平padding。Logo链接/容器不人为留左右空槽，图片去除多余透明边缘；移动安全边距和正常控件/卡片内部间距保留。
- 单页业务逻辑写对应HTML的script标签，不新建js/pages、shop.js、product.js等单页脚本；全站app、SDK和复用WebComponents继续独立。旧用户文件不擅自删除。
- 详情、规格、评论过长时可折叠/展开、分页或分批显示，保留完整可达内容、键盘/aria状态及移动操作，避免无限长页面或永久截断。

## 商品JSON导入与读取

新增import-products技能、website_products MCP工具和skills/import-products/scripts/import-products.mjs脚本。用户提供JSON或JSON文件时使用，不由Agent直接读取整份源JSON到上下文或凭样本猜总量。

工具支持数组及products/productData/items/data包装，字段别名/点路径映射和locale数值价格适配。数据仅解析为JSON，实际执行可信的内置sdk.js，通过SDK.count/categories/list().filter().count()统计数量；不执行用户JavaScript。运行视图只保留SDK商品字段及真实二级分类字段，不把未知私有字段整包发布。既有SDK/app保留，源JSON字节与散列不变。

通常使用5–6个主要展示组：过多时前5个主要类加More次级入口，过少时按真实子类/类型/品牌拆分。完整且互不重复的过滤关系保存在window.catalogGroups，页面用SDK.get(group.product_ids).result()读取；工具只返回摘要/有限样本，不把样本当完整目录。确实无法形成5个有意义的非空组时标明需要进一步分类，不硬造类别。Header已有分类套件时在那里展示，首页不重复分类板块。

相对商品图片在派生运行视图中按网站域名拼接，例如www.mreceix.com + /img/a.jpg → https://cdn.mreceix.com/img/a.jpg。完整HTTP(S)图片地址保留；可用image_cdn覆盖实际基址。不修改源数据，不虚构未知CDN。商品图可作为Banner/分类场景图的真实引用素材，但不替换商品目录图或编造商品外观/功能。

inspect只统计不写入；import输出唯一js/data.js运行视图和缺失SDK/app起点，来源/分类/源与运行视图散列保存在metadata_directory。经过指纹核对的导入数据使用SDK核心字段验证，不为了通过Mock扩展字段检查而捏造销量/评价。无效JSON、重复ID、核心字段无法识别时返回mode:mock与generate-mock-data指令，由主技能接续Mock流程，坏导入不会覆盖现有商品数据；路径权限或项目错误不以Mock掩盖。

## 验证与范围

已通过TypeScript、Vite/tsup构建、商品导入专项（SDK统计、分类、CDN拼接、源散列、locale/字段映射、Mock回退、运行数据保护、脚本与项目守卫）和Toast组件生命周期/无统一蒙层拦截测试；项目、模板、交易、已有功能、CDN及大型预览回归也通过。

本轮修改插件规范、工具、脚本与内置组件，没有导入用户真实商品或自动改写历史网站。0.7.4重新安装/重载后新增工具可用；旧会话可使用同包脚本。历史网站已有的自定义Toast/弹窗逻辑需在后续明确修改网站时按新规范接入，不自动覆盖用户实现。
