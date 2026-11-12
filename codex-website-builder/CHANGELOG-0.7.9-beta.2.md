# 0.7.9-beta.2 启动修复

实际Codex日志报MCP server not found。0.7.9-beta.1混用了legacy与Agent Plugins配置：stdio中的env_vars字段不被严格格式接受，command中的PLUGIN_ROOT占位也不合法。

修复为./scripts/launch-node并移除env_vars；保留双平台启动器、托管Node探测与PLUGIN_ROOT/project目录。补充macOS应用包默认运行时路径，应对宿主环境变量过滤。增加配置形状回归，避免SDK直连绕过宿主解析。

既有项目不迁移、不删除。macOS未实机验证。
