# Website Builder 0.7.5

## 完成一页，立即写一页

主技能、页面规范与工具说明改为：先准备共享依赖，当前页完整代码生成后立即格式化、写文件并检查ready，随后才开始下一页；不能先在数组/脚本/对话中生成全站代码再统一输出。website_write每次最多接收一个HTML文件，可携带当前页共享依赖；多HTML请求会在任何写入前被拒绝。其他页面保持queued，后续页失败不回滚已完成页。单页文件仍原子替换。

## 导入图片只在渲染时拼CDN

导入后的productData、SDK返回对象以及购物车映射中的main_image/images/image继续保留原相对路径。图片引用时显式使用storeData.imageUrl(path)或productImageUrl(path)，例如将/img/a.jpg解析为https://cdn.mreceix.com/img/a.jpg，再赋给img.src、srcset或背景图。辅助函数不改变商品对象，不安装自动图片拦截；绝对HTTP(S)图片仍可用。源JSON文件保持原字节，不参与格式化或地址替换。

## SDK采用二次分类

源分类过多时，不再机械保留前5个源类加More。工具先报告源分类摘要，需要时返回classification_required而不写数据，由主技能根据真实语义生成覆盖全部源分类的category_map后重试；一致的parent_category也可推导归类。摘要可分页读取，不需Agent直接读取整份JSON。

成功导入后，运行商品category为二次归类；SDK.categories/get/list/filter均读取新类，source_category保留原类追溯。catalogGroups与新类一致，分类菜单和Shop筛选共享同一分类字段。source_category_count报告源类数，category_count报告实际SDK类数；通常5–6主要类，信息不足不造空类。分类尚未完成不能转Mock；只有JSON/核心字段无法识别时仍走原Mock回退。来源、映射和运行视图散列保存在管理目录，源JSON不改。

## 本地Prettier统一输出

内置Prettier standalone 3.6.2及Babel/Estree/HTML/PostCSS解析器文件和MIT许可证，位于assets/prettier，构建复制到dist/runtime/prettier。不新增npm依赖、不运行npm install/npx，格式化时不联网；文件来源与SHA256在assets/prettier/source.json，工具仅在插件使用，不发布到网站。

write和finish对完整HTML（含内联script/style）及输出JS/MJS/CSS/JSON格式化；旧hook也使用同一路径。统一options.json：2空格、printWidth 100、JS单引号与分号、trailingComma all、LF、HTML属性双引号、JSON双引号层级缩进。100是折行目标，不强行截断长URL或素材串。

语法错误不覆盖原文件；HTML内联JS/JSON也检查。未闭合HTML保持未完成，不允许Prettier修复成虚假的ready。已完成的页不受下一页错误影响；格式化幂等，不改变页面业务或图片字节。

## 验证

通过TypeScript及Vite/tsup构建。新增output专项验证一页已ready、下一页仍queued、批量HTML拒绝、HTML/内联JS/CSS/JS/JSON格式化、错误保护、幂等与业务等价；无node_modules的隔离目录也可使用本地格式化器。

导入专项验证源JSON散列不变、SDK/运行图字段仍为相对路径、渲染辅助函数得到CDN URL且不改对象、SDK分类/过滤使用映射后的类、源类别追溯、201源类摘要分页和Mock回退。既有项目、模板、账户/交易、Toast、功能、大型预览与在线CDN回归通过。

测试使用隔离目录，不修改用户的路径配置；本轮未导入用户实际商品或自动批量重写历史网站。重新安装/重载0.7.5后使用新写入协议与适配流程。

Prettier的本地standalone调用方式依据[官方说明](https://prettier.io/docs/browser)，格式选项参见[官方选项文档](https://prettier.io/docs/options)。
