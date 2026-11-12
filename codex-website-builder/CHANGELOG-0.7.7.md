# 0.7.7 修复插件启动失败

## 原因与修复

- 以mcp.json原配置启动可复现：ENOENT realpath F:\Projects\website-builder，MCP尚未注册就退出。上一版隔离测试覆盖了运行功能，但覆盖变量掩盖了真实路径配置错误。
- 本机mcp.json恢复到已有Q盘website参考目录和插件project生产目录；不移动、清理或重新生成已有项目/状态。
- createPreview不再在启动阶段解析可选参考库，只在参考站点读取/文件请求时解析。参考目录不可用时，项目工具、画布资源、项目写入及同步继续工作；显式参考读取返回错误，保留realpath与目录边界保护。
- 新增scripts/startup.test.mjs及test:startup，纳入prepare:plugin，防止仅用测试路径覆盖配置而遗漏真实启动问题。

## 验证

- TypeScript检查与服务端构建通过。
- 实际mcp.json启动：MCP握手、版本、工具发现、open_canvas及画布资源读取通过。
- 不存在参考库的隔离启动：握手、工具、画布、项目创建/写入ready及project_sync通过；显式参考读取失败，未自动创建缺失目录。
- 完整smoke：独立安装产物、14页预览、资源、CSP、路径边界及令牌访问通过。
