---
name: website-image-generator
description: 生成Logo、Banner、About配图与图标，在画布展示进度和成品，不生成商品图或头像。
---
# 网站图片生成

负责实际生图、修图、图片文件与画布交付；品牌/正文归website-copywriter，商品数据归website-import-data/website-mock-data，页面组装归website-builder。读取项目brief、design、实际槽位和现有素材，已有合适图片复用，不为调用技能重生成。

## 已迁入的官方工作流

本技能内置官方imagegen的工作流、提示词参考、CLI脚本及许可证，不要求另加载宿主同名技能。普通生成、编辑、透明背景均优先内置image_gen，不因尺寸/路径/批量需求自动改用API，也不要求API Key。

- 实际调用前读[官方生成与编辑流程](references/imagegen-workflow.md)，按请求决定generate/edit、参考图角色和单图/多图策略。新图不为展示进度额外调用view_image；编辑未查看过的本地目标时仍先按工具要求查看。每个独立素材使用独立提示词；编辑明确必须保留的主体/文字/透明度。
- 写提示词时按需查[提示词原则](references/prompting.md)与[提示词样例](references/sample-prompts.md)；只补足对构图必要的信息，不擅自添加品牌、人物、承诺或文案。
- 网站素材的Logo裁边、1:1 favicon、多Banner差异、中心/版心安全区和多端裁切统一见[网站素材规范](references/website-assets.md)。默认不用商品图、头像或手绘SVG填槽位。
- 内置工具失败时如实登记失败；仅用户明确选择/确认CLI或API后，读[CLI流程](references/cli.md)，使用本技能scripts/image_gen.py，不改脚本、不临时拼SDK runner、不静默切模型。可按需读[API参数](references/image-api.md)和[网络问题](references/codex-network.md)。WEBSITE_IMAGE_SKILL_DIR指本SKILL.md所在真实目录，CLI依赖/密钥规则沿用官方说明。

## 画布交付与状态

1. 逐张明确用途、实际导出宽高、PC/移动可见比例、透明需求、主体与文字安全区、最终项目相对路径。模板槽位与页面版心来自主技能，不凭空改变页面结构。
2. 生图前调用website_images(action="begin",thread_id=真实会话ID,project_id,path,width,height)。path为最终文件路径，name可用图片文件名。先登记再生图，不写空白占位文件；状态保存在SQLite。需要打开面板时先复用website_project，再open_canvas(thread_id=真实会话ID)。
3. 按官方流程实际调用image_gen。默认输出位于CODEX_HOME/generated_images等宿主目录，不假定临时目录或工具支持destination参数。取得工具真实返回的成品，再复制最终选中图片到生产assets/brand、assets/banners、assets/about或assets/icons。源图、候选、提示词和记录放metadata_directory或宿主生图目录；CLI工作目录也放metadata_directory/work，不在生产目录创建tmp/output。
4. 复用工具已返回的视觉结果与UI实际加载状态，核对主体/裁切、清晰度、透明边缘和真实尺寸；不要对每张新图重复调用view_image、截图或图片读取API来播报过程。只有编辑要求或无法判断的视觉问题确实需要时才查看，不能为减少输出谎报视觉检查。编辑失败保留旧文件，除用户要求替换外使用新版本文件名。只把页面实际引用的正式图片交付到网站。
5. 文件写入后website_images(action="finish",同一thread_id/project_id/path)。UI也会自动发现新文件并展示。重新生成同一路径前再次begin，旧图不能代表本次完成；失败或取消时action="fail",error=真实简短原因，重试前再begin。
6. 向主技能返回正式相对路径、实际尺寸、用途与使用页面，由其完成响应式引用和HTML排版。图片以UI画布为交付视图，不在对话重复嵌入生成图片、Base64或完整提示词；最终仅文字报告完成项、缺失项及必要路径。工具自身的原生结果不作为页面完成证明。UI无法显示时明确说明，不以无图的聊天文本冒充成功。

网站路径和UI交付规则优先于迁入官方文档中的通用preview-inline及output/imagegen示例；保留真实生图、编辑与透明背景规则。不自动执行整站验收。

## 后台显示的能力边界

优先在UI使用website_images的生成中/完成/失败状态，对话不重复嵌图、完整提示词或工具返回值。跳过额外view_image仅减少重复预览，不能隐藏宿主自动呈现的image_gen调用或原生结果；当前工具没有silent、hidden或后台显示开关，不传不存在的参数，也不承诺仅改SKILL即可完全隐藏。工具要求返回原生图片时遵守其要求。

完全不向对话输出原生生图过程，需要独立API/生成服务由插件后台执行，并只将文件与状态送入画布；这不是省略view_image实现的能力。当前不自动切换到该路线；用户明确选择API/CLI时再按已有后备流程配置和运行。
