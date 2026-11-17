# 图片压缩

生成原图和候选素材保存在material；src/images是其中已选用素材的压缩发布版本，保持同名、格式及透明背景。不得修改material原图，也不把未采用候选图批量发布。

## 使用

运行纯JS脚本`scripts/compress-image.mjs`，仅用Node内置模块，不依赖sharp、Pillow、原生可执行文件或npm压缩包。其TinyPNG上传/下载方式、大小限制、下载域名白名单、完整性校验及无收益处理沿用面板规则。压缩会将图片发送至第三方TinyPNG，不是离线处理；不改用其他上传服务，不伪造转发IP。

支持PNG、JPEG/JPG、WebP，单张最多20,000,000字节。下载完整后验证格式/PNG CRC与图像压缩数据等；结果不得截断、损坏、换格式或指向不可信下载地址。无体积收益时使用较小的原始字节发布，并如实返回unchanged，不能虚报压缩率。超限或不支持格式时明确失败，不直接复制绕过；原图留在material，网站旧图保留。

## 正常流程

1. `website_images(begin)`登记本轮图片任务；生成或编辑前把已有原图按既有规则归档，随后将真实生成原文件写入material。
2. `website_images(finish)`或UI发现本轮新文件时，后台调用该JS脚本压缩。原图不动，只有压缩结果已完整下载并校验后，才原子写入src/images。
3. 如finish遇到另一个连接正在压缩，返回generating/phase=compressing，继续查询图片状态到ready/error，不能当成失败或宣称完成。网站文件写入成功才将任务标记ready；返回compression中的attempts、original_size、compressed_size、saved_bytes、unchanged等实际数据。原图/网站目标若被外部修改则停止，不能覆盖他人改动。
4. 压缩在项目写锁之外执行，不阻塞画布刷新；最终写入持项目锁，防止与部署、写入、提交竞争。压缩未完成时不得启动部署。
5. 同一个begin任务**总共最多3次尝试**，不是首次加3次重试。次数和所有权保存在SQLite；UI轮询、重复finish、多进程都不能重置预算或并行上传同一任务。进程中断后继续剩余预算，不重新计算3次。
6. 达到上限即error，保留material原图及src/images已有文件。不能靠连续调用finish、CLI或反复begin规避上限；需要用户确认新任务或真实重新生成后再begin。

## 独立脚本

通常直接调用MCP的finish，不再额外运行脚本，否则重复压缩。仅在用户明确要求独立使用时：

```text
node <本技能目录>/scripts/compress-image.mjs <material原图绝对路径> <src/images目标绝对路径>
```

脚本单次执行最多3次，源与目标不能相同，失败保留原图/旧目标，使用临时写入和原子重命名，并清理临时文件。独立运行不会替代MCP任务登记或项目本地Git收尾，不在网站目录生成额外报告、数据源或工作文件。
