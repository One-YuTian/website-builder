# Starlight 组件库文档与生成系统

基于 **Astro** 与 **Starlight** 构建的独立组件库与文档站点，收录全部原生 Web Components、Blocks 与 Pages 模板。

## 特性亮点

1. **真实交互式组件预览 (`ComponentPreview`)**：
   - 支持实时渲染组件，并提供 **桌面 (100%)**、**平板 (768px)**、**移动端 (390px)** 一键响应式切换工具栏。
   - 内部集成 Tailwind CSS、Noto Sans SC 字体及公共骨架规范。

2. **完整组件源代码展示**：
   - 包含组件本身实现类（如 `Card01`, `Header01`, `Footer01`, `Carousel01`）。
   - 包含所依赖的共享基类实现。
   - 提供独立可运行的单文件 HTML 代码（Standalone HTML Snippet）。

3. **内置设计规范与骨架体系**：
   - 详细收录全局设计配置（`library/config/theme.js`）、在线资源清单（`library/config/resources.js`）、骨架底层（`library/components/skeleton.js`）及通用渲染工具（`library/components/shared/markup.js`）。

4. **独立的 LLM 纯英文规范文档与技能模板同步**：
   - 自动生成 100% 纯英文、0 中文、0 Emoji、0 货币符号的专供 AI Coding Agent 读取的 `.txt` 规范文档，并自动同步至技能模板目录。

## 运行指令

在 `./starlight` 目录下运行：

```bash
# 启动本地开发与实时预览服务（默认端口 4321）
npm run dev

# 编译生成静态站点并索引全文字符（输出到 dist 目录）
npm run build

# 本地预览编译后的静态站点产物
npm run preview
```

