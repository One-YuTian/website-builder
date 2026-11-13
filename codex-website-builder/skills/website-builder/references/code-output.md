# 逐页落盘与统一代码格式

## 生成顺序

1. 规划完整页面清单后，先写可复用的app/SDK/组件和数据依赖；共享文件可以同一请求提交。
2. 对当前一页调用begin，生成该页完整代码后立即website_write落盘，并完成该页依赖/ready检查；确认已写入才开始下一页的代码生成。
3. website_write支持一次接收多个HTML页面及共享文件；已有完整页面批量导入/修改可直接一次提交。不得先在内存、对话、临时脚本或数组中生成全站所有页面，等最后统一写文件；这是生成时机要求，不是接口数量限制。
4. 未生成的页保持queued，当前页可独立预览。下一页失败不回滚已经完成的页；修改现有页也按页写入。校验通过即ready并立即同步UI，不等其他页面生成或任务结束。
5. 提交的HTML与依赖发生变更的页面会自动校验，finalize_pages只追加校验路径，传空数组也不会跳过已提交页。补齐缺失依赖后自动重验受影响页面；写入失败应显示error，不能遗留generating。
6. 直接写文件必须先begin后finish，UI也会检查begin后已变更且完整的HTML并校验，避免遗漏回调而持续生成中。未修改的旧HTML不会被当作新页面。任务结束前finish（可省略paths校验全部未完成页），检查所有状态并修复或报告错误；ready表示代码完整/依赖通过，不代表网站验收已完成。

## 本地Prettier

插件内置Prettier standalone 3.6.2及HTML/Babel/Estree/PostCSS解析器文件，不使用npm依赖、npm install或npx，运行时不联网下载格式化器。文件和许可证在插件assets/prettier，构建复制到dist/runtime/prettier，仅供插件输出代码使用，不能发布进网站生产目录。

write会在装配HTML及复用项目已有Toast后，使用本地Prettier格式化HTML、页面内script/style、JS/MJS、CSS和JSON，再校验并落盘；finish格式化对应完整HTML，不创建默认Toast。共享组件由Agent按模板文档实现并通过website_write落盘，工具不可用时用project.mjs走同一CLI格式化链路。未完整HTML保持未完成，不能由Prettier补齐后冒充ready；语法错误不得覆盖原文件。

唯一配置为 [options.json](../../../assets/prettier/options.json)：2空格缩进、不用Tab、printWidth 100、JS分号与单引号、trailingComma all、对象括号内空格、LF换行和文件末尾换行。HTML属性双引号，htmlWhitespaceSensitivity为css，内联JS/CSS自动格式化；JSON用json-stringify解析器、双引号、层级缩进，不输出注释或尾逗号。printWidth是折行目标，长URL/素材字符串等可超出，不以正则强截断代码。

格式化只改变代码表示，不改业务、源商品JSON、图片字节或所选模板的实际布局。共享主题、页面内联逻辑和组件WebComponent规范继续执行。原始商品JSON是输入，不参与输出格式化；来源记录保存在metadata_directory。
