---
name: website-mock-data
description: 无商品数据或API时生成符合SDK的商品样本，准备分类与价格并保留已有数据。
---
# 网站商品模拟


1. 复用 website_project 返回的真实 thread_id/project_id 与 directory，先检查现有 js/data.js/API。已有数据不生成；静态解析失败不等于无数据。不修改 API 或真实库存。
2. 根据品牌、目标国家/语言、分类、价位和用户数量准备相关样本；默认24条，通常20–50条。每个重点展示商品使用不同名称和适配图片，不能用编号副本冒充丰富真实目录。
3. 图片只使用已有商品素材/用户提供或核实可用的商品图，不能调用网站图片生成技能造商品图，不能自绘 SVG、编造 URL、重复同一图充当不同角度。无图要说明缺口，不能以通用假图完成商品视觉。
4. 调用 website_commerce(action="prepare",thread_id,project_id,products,count,seed,currency,locale)，一次准备数据与缺失 SDK；只有明确重建才 regenerate=true。旧会话可运行 ../website-builder/scripts/project.mjs，stdin action:"commerce",mode:"prepare"。该脚本自动获取真实会话 ID。
5. 输出 js/data.js 的 window.productData，ID 为 B+9位大写字母数字，final_price 为数字，按 [SDK 契约](../website-builder/references/commerce-data.md) 补齐字段；图片有多少真实角度就保留多少，不强凑3–5张。可选 original_price 大于售价，discount 从数值计算；无变体/评论用 []，不伪造真实评价。
6. 本技能不生成app.js，也不复制固定启动脚本；主建站技能随所选模板生成js/app.js并合并返回config_defaults，不覆盖现有主题、数据、SDK、购物车和订单。仅运行所需js/data.js、SDK和app.js进入生产directory；样本、seed、原始CSV/JSON/API响应、来源记录和生成脚本留在metadata_directory/work，不额外创建生产数据源文件。已有数据/API复用，不能为调用技能强行生成。
7. website_commerce(action="validate")，浏览器 SDK.init 后 SDK.count 等于实际条数，核对唯一 ID、分类、数值金额、折扣和图片加载。失败修正后再返回数量、来源、文件路径；不回显完整 SDK 或全量数据。

Mock 只用于演示，不把模拟评分、销量和评论写成真实经营数据；该技能负责商品文案与价格，网站文案技能不参与。

运行时仅使用一份js/sdk.js（同时提供SDK和兼容APP），依次加载sdk.js、data.js、app.js。SDK.init仅位于app.js，静态数据先同步初始化再注册组件，异步数据与页面就绪按[SDK契约](../website-builder/references/commerce-data.md)执行；不要在HTML或data.js重复初始化。已有自定义文件保留并按本轮授权显式合并，不批量改写已有网站。
