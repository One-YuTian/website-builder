---
name: import-products
description: 用户提供商品JSON内容或JSON文件时，通过工具和sdk.js适配读取、统计商品与分类、规划5–6个主要分类、拼接相对图片CDN；不能识别时转Mock工作流，不改源数据。
---
# 商品JSON导入与读取

用户提供商品JSON内容或JSON文件时优先使用本技能，不能让Agent直接cat/Get-Content/readFile整份商品JSON到上下文，再凭少量样本猜总量或自写查询。先复用website_project的真实thread_id/project_id；源JSON只由下述工具/脚本读取，不执行JSON中的代码，也不把原始数据源复制进生产目录。

## 工具与脚本

调用website_products，传thread_id、project_id及file_path（用户明确提供的.json绝对路径）或source_json（用户消息已给的JSON字符串），两者只提供一个。action为inspect时只读统计、不写任何项目文件；import时写运行适配数据并安装缺失SDK，保留已有SDK/app配置。还支持website_domain、image_cdn、currency、locale和field_map（目标字段→源字段的点路径）。

工具尚未加载时运行本技能scripts/import-products.mjs，通过stdin传同样JSON参数；mode为inspect/import，脚本自动使用真实CODEX_THREAD_ID并调用同包CLI。不要另写一次性商品读取脚本。示例：

```json
{"project_id":"实际项目ID","file_path":"用户提供的JSON绝对路径","website_domain":"www.mreceix.com","mode":"inspect"}
```

SDK适配识别数组及products/productData/items/data等包装，只将SDK所需商品字段及真实二级分类字段映射到运行视图，不把来源中的未知私有字段整包发布；按实际字段归一化id/name/category/final_price/main_image/images等；必要时用field_map指定别名或嵌套路径，不执行用户JavaScript。价格按locale解析成数值；保留原商品ID（数字转字符串），不编造价格、评价、销量、分类或缺失商品图。统计实际运行内置可信sdk.js的SDK.count/categories/list().filter().count()，不是Agent数原始JSON行数。

## 分类展示

检查product_count、category_count与主要分类摘要。通常在分类套件/板块展示5–6个主要分类：原分类5–6个时直接使用；过多时先聚合真实相近类别或采用前5个主要类+More次级入口；过少时按实际subcategory/product_type/type/brand等二次分组。工具提供初步非破坏性分组，仍须根据品牌语言与业务合理性核对，不能把品牌差异冒充无关商品类型；如不能形成5个有意义且非空的组，保留真实可用组并说明needs_secondary_classification，不强造空类或重复分组。

完整过滤映射在生产运行文件window.catalogGroups中，按group.id查找后使用SDK.get(group.product_ids).result()，不能直接读源JSON渲染，也不能只用工具返回的sample_product_ids样本当完整目录。工具只返回数量/分类摘要和有限样本，超过200个原分类时明确categories_truncated，实际总数仍真实。Header已有分类套件时在其中展示这些主要分类，首页不再重复另放同类分类模块。

## 相对图片CDN

不修改输入文件/源对象，只在派生运行视图中拼接。网站域名www.mreceix.com对应图片基址https://cdn.mreceix.com/，例如/img/a.jpg或img/a.jpg→https://cdn.mreceix.com/img/a.jpg；保留已完整的HTTP(S)图片URL。自定义图片域名/目录可传image_cdn覆盖，未知相对图基址不猜测，禁止javascript/file等图片地址。源文件散列记录在生产目录外metadata_directory/website-builder.import.json。

## 成功、回退与生图

import成功只把js/data.js这一份运行商品视图及缺失SDK/app起点写入生产目录；来源记录与分类审查保存在metadata_directory，不新增原始JSON或读取脚本到网站。现有app.js合并缺失config_defaults，不覆盖主题或账户/订单状态。源数据不变，原字段/原分类与派生展示分组分开。

mode:mock、fallback:true表示无法识别JSON/核心字段，不代表成功：接续调用同包 [Mock Data技能](../generate-mock-data/SKILL.md)，按站点需求执行Mock流程并明确数据来源已回退。工具不会用坏导入覆盖现有运行商品，也不会凭空捏造商品样本；路径权限/项目不匹配等操作错误先解决，不以Mock掩盖。

商品图可作为 [网站图片生成技能](../website-image-generator/SKILL.md) 生成Banner、分类场景图的真实参考素材：先按需要取有代表性的商品图片并查看，用imagegen的引用图流程生成场景/构图，不是生成或替换商品目录本身的商品图。保护商品外观、颜色和品牌事实，不添加虚构功能/认证/价格；Banner、分类图、About各自主题仍须区分。只有实际使用的最终场景成品进入生产assets。

完成时返回真实商品数、原分类数、主要展示分类、图片基址、回退状态与输出路径；页面通过SDK读取。核对SDK.get真实ID、分组数量与过滤结果、金额、相对图拼接及源JSON散列未变。
