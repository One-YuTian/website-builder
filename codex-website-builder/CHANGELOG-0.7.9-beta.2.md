# 0.7.9-beta.2 启动修复

实际Codex日志报MCP server not found。0.7.9-beta.1混用了legacy与Agent Plugins配置：stdio中的env_vars字段不被严格格式接受，command中的PLUGIN_ROOT占位也不合法。

修复为./scripts/launch-node并移除env_vars；保留双平台启动器、托管Node探测与PLUGIN_ROOT/project目录。补充macOS应用包默认运行时路径，应对宿主环境变量过滤。增加配置形状回归，避免SDK直连绕过宿主解析。

既有项目不迁移、不删除。macOS未实机验证。

## 验证结果

- 已在Codex app-server宿主通过mcpServerStatus/list读取实际安装服务：name=website-builder，serverInfo.version=0.7.9-beta.2，工具数11，toolsError=null；未创建聊天、未调用模型。
- 独立启动配置、参考库缺失容错、14页预览与资源/CSP/目录边界回归通过。
- 已同步origin/beta，刷新Git市场并安装beta.2；原有生产项目不改写。当前已打开的桌面会话可能仍需重新打开插件面板或重启后重新加载配置。
- 解析依据：https://github.com/openai/codex/blob/main/codex-rs/codex-mcp/src/agent_plugin_config.rs 。Agent Plugins格式严格拒绝未知字段，command只接收bare executable或./相对路径；PLUGIN_ROOT占位仍可用于args/env/cwd。
