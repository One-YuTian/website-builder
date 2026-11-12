# 0.7.9-beta.1

- macOS/POSIX与Windows分别提供同名shell/CMD启动器，使用Codex托管Node，不依赖系统Node；启动器模式沿用官方插件布局。
- MCP配置移除机器绝对目录；项目默认PLUGIN_ROOT/project，可选参考库为PLUGIN_ROOT/reference；直接CLI调用同步展开PLUGIN_ROOT。
- beta分支只分发可安装构建产物、skills、资源、启动器和插件市场路径，排除开发依赖与生成项目；保留当前dev未提交修改。
- Windows使用Codex Node v24验证实际启动配置、MCP握手/工具/画布、缺失参考库容错与独立14页预览；macOS宿主未实测。
- 新版本project位于其安装根目录，不自动迁移旧绝对目录或旧版本缓存中的项目。可显式环境变量覆盖以保留持久目录。
