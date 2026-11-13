# 0.8.2

- 统一技能名称与中文功能简介，商品技能调整为website-mock-data和website-import-data，职责分离并清理重复指令、旧快照与重复模板脚本。
- 纳入22份Home组合参考与toast-01文档。Home默认沿用所选组件链，主体最多0–2项自由调整、数量保持原N±1；独立组件按实际源码实现。此约束仅用于生成，不加入网站验收或ready门禁。
- 模板列表和内容统一由website_templates或project.mjs的templates动作读取；Home仅返回组合说明，独立组件返回真实HTML/JS/CSS。
- 移除旧默认Toast脚本，改为按文档生成项目组件；装配器仅复用已有实现，不创建默认Toast或统一Overlay接口。
- 商品查询与账户/购物车/收藏/订单业务合为一份sdk.js，保留SDK和兼容APP入口及账户隔离，避免重复加载重置状态。
- app.js由建站任务随所选模板、主题和数据方案生成；商品准备/导入工具仅提供数据、SDK、config_defaults及app_required。加载顺序为sdk.js→data.js→app.js→组件，SDK.init仅放app.js，不再插入HTML初始化脚本。
- 网站图片技能迁入官方imagegen工作流、提示词参考、显式CLI后备脚本及许可证；UI展示生成状态和成品，减少重复预览。内置image_gen原生过程仍由宿主控制，本版本不承诺完全隐藏。
- 明确模板模块均可选用，允许7×24小时服务、7天无理由退货与货到付款文案；商品数值仍来自数据/SDK，不扩大到虚构经营事实。
- 删除无运行依赖的skills/website-builder/source.json并清理引用；保留截图所需playwright-core和第三方许可证。

预构建运行包使用Codex内置Node。Windows已验证；本次没有macOS实机验证。不批量改写已有网站的自定义SDK或app.js。
