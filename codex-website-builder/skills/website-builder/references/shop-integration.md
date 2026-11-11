# Shop 精确接入契约

实际代码优先于历史通用 Overview。四个 Shop 不能套同一侧栏/四列布局：

| 模板 | 区域与桌面列数 | 移动端行为 |
|---|---|---|
| shop-01 | page-header、toolbar、products-grid；无侧栏；2/sm:3/lg:4列 | 双列，工具条纵向转横向，无筛选抽屉 |
| shop-02 | sidebar、toolbar、products-grid；lg:w-64侧栏；2/sm:3列（桌面仍3列） | 双列，mobile-filters-toggle展开同一个filters-sidebar |
| shop-04 | sidebar、toolbar、products-grid；lg:w-64侧栏；2/sm:3/lg:4列；无page-header | 双列，mobile-filter-drawer覆盖式抽屉，桌面侧栏仅lg显示 |
| shop-12 | page-header、sidebar、toolbar、products-grid；lg:w-64侧栏；2/sm:3列（桌面仍3列） | 双列，mobileFilterDrawer；保留gridView/listView及相应卡片view-mode |

必须读所选Shop和Card完整 HTML/JS/CSS。卡片不是可随意换布局的填充物：保持原图比例、信息顺序、价格/折扣槽位、按钮形态，确认视图模式属性实际实现。Card不支持所需列表视图时选兼容卡片或按同模板补齐明确的view-mode接口，不能删除视图切换。

仅将骨架槽位替换为目标语言文案、数据、真实图片和图标库。删除defaultProducts/演示随机数，使用SDK.list/search/filter/sort/slice；排序使用final_price，真实计数来自过滤后的查询，DOM ID、数据属性、事件名称保持对应。旧card-01在创建标签/查询器/注册中统一映射card-component，product-id传真实ID。筛选改变后重置分页。不要自动添加原模板没有的搜索、分类、侧栏、促销、Banner、分页或统计区域。

在metadata_directory/website-builder.templates.json记录Shop+Card来源及槽位映射，在设计文件说明实际容器轴线、网格规则、图片比例。不要用通用小圆角/统一边距规则重写所选模板的内层容器和间距；颜色和字体可统一。商品卡片根节点display:block/h-full以适应实际网格；不要给未支持的标签传虚假属性。

基本验证逐项对照上表与实际源码：375/768/1280下的列数、侧栏显隐、筛选按钮/抽屉、工具条顺序、grid/list切换及图像。业务验证查询、排序、空状态、登录门槛。仅在用户要求完整验收时调用website-acceptance。

生产目录directory只保留网站运行产物；设计/来源/模板绑定/文案/图片记录、原始数据、临时文件和截图报告统一保存在工具返回的metadata_directory，直接写文件时必须使用该绝对目录，不写进网站。website_write会将根级website-builder.*.json管理记录路由到metadata_directory。此前记录文件的相对名称均按此规则解释。Header桌面与移动菜单必须有Home、Shop、About Us、Contact Us四个可用链接。

PC最大内容宽度内各区域左右对齐，减少外层/嵌套水平padding和Logo两侧空隙，移动保留安全边距；避免jsDelivr/jsdeliver CDN。单页逻辑写本页script，不另建单页JS；浮层关闭只为各组件开发规范，不使用统一Overlay接口。
