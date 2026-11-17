# R2 静态网站部署

仅用户明确要求部署、或用户主动点击详情页部署按钮时执行。普通建站完成后仍仅本地提交main，不自动上传。旧GitLab配置、UI入口和MCP注册已在server/index.ts、首页/详情入口注释，源码与原有工具实现保留；暂停期间不要调用GitLab工具。

## 只读 S3 配置

Codex插件管理页仅显示“S3配置”组：R2_ACCOUNT_ID、R2_BUCKET_NAME、R2_ACCESS_KEY_ID、R2_SECRET_ACCESS_KEY、R2_DEPLOY_HOST。所有值不可通过界面修改；两个凭据字段仅显示掩码，不返回真实密钥。配置由管理员通过scripts/provision-r2.mjs从stdin预置到插件独立数据目录，凭据本机加密存储，不进入源码、网站src、README、截图、日志或提交。环境变量可用于未预置机器的管理员配置。不存在凭据时明确失败，不使用他人凭据或编造部署成功。

## 部署语义

- website_r2_deploy(action=start/status/cancel, thread_id, project_id)只处理真实当前会话绑定项目；UI通过当前面板绑定调用。第一次点击部署按钮打开按钮左侧的内部Popup并开始同步，后续打开可查看结果或选择重新部署。
- 使用插件独立纯JS脚本assets/r2/s3.mjs实现S3 SigV4，region=auto，端点为https://<ACCOUNT_ID>.r2.cloudflarestorage.com；无AWS npm包、CLI或系统进程依赖。
- 项目ID原样作为唯一部署目录：只上传src内部文件到<project_id>/<相对路径>。不上传material、项目根README、.git或元数据，也不修改本地源码。S3目录由文件前缀形成，不额外生成空目录对象。
- 启动前要求项目状态为completed；生成中、修改中、暂停、失败或计划未完成均拒绝部署，不创建部署任务或访问云端。检查页面已就绪且src/index.html存在，记录文件路径、大小与SHA256，上传后核对远端HEAD；上传全部成功且本地未变化后，才删除本项目精确前缀下本地不存在的旧对象。分页读取全部云端对象，严禁触及其他项目目录。
- 最后再次核对对象完整列表、大小、SHA256元数据和本地快照，全部相同才返回completed及https://<project_id>.<R2_DEPLOY_HOST>。
- 持有跨进程部署写锁，UI/MCP禁止编辑页面与素材；取消会中止后续请求并等待进行中的操作收尾后解锁。取消、失败或本地变化不报告部署完成；已上传的部分内容保留，重新部署再次完整同步，不自动回滚。

## 域名路由前置条件

上传R2对象不会自动建立DNS、证书或Worker。上述子域名链接要求管理员已为*.R2_DEPLOY_HOST配置通配符DNS/TLS，并将子域名第一段作为项目ID映射到存储桶对应目录。R2的S3凭据不能替代Cloudflare DNS/Workers管理权限；没有这些条件时只保证存储桶同步成功，不能声称外网已可访问。

下面是可交由管理员配置的Worker路由示意，不在插件部署时自动发布。WEBSITE_BUCKET绑定目标R2桶，DEPLOY_HOST由管理员设置。默认目录页补index.html，不提供跨项目路径访问。

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const suffix = '.' + env.DEPLOY_HOST;
    const id = url.hostname.endsWith(suffix) ? url.hostname.slice(0, -suffix.length) : '';
    if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(id) || !['GET', 'HEAD'].includes(request.method)) {
      return new Response('Not found', { status: 404 });
    }
    let path;
    try { path = decodeURIComponent(url.pathname); } catch { return new Response('Not found', { status: 404 }); }
    if (/[\\\x00-\x1f]/.test(path) || path.split('/').some(part => part === '.' || part === '..')) {
      return new Response('Not found', { status: 404 });
    }
    if (path.endsWith('/')) path += 'index.html';
    const object = await env.WEBSITE_BUCKET.get(id + '/' + path.replace(/^\/+/, ''));
    if (!object) return new Response('Not found', { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'no-cache');
    return new Response(request.method === 'HEAD' ? null : object.body, { headers });
  }
};
```

开发验证仅使用隔离Mock和回环S3服务；真实桶上传、清理与域名访问留给用户手动触发和核验。
