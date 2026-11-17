# 项目本地 Git 提交

此规则用于生成的网站项目（project_directory），不是插件源码所在的 dev 仓库。

- 新项目用插件内置 isomorphic-git 初始化 main，写入 README.md 后创建首个本地提交。默认不配置远程地址，不推送。
- 每轮生成/修改完成后必须调用 website_project(action="finish",thread_id,project_id)。页面、共享文件、图片、文案或 README 的单独修改同样要收尾，不能因页面已 ready 就省略。逐页输出照常执行，不等提交再显示预览。
- finish 核对页面后，将本轮项目文件变化（新增、修改、删除，遵守 .gitignore）提交到 main；没有变化不制造空提交。初始化提交不代替整站生成完成时的提交。图片技能的 finish 只发布图片，主技能仍需执行项目 finish。
- 工具返回 git.branch、git.committed、git.oid 或未提交原因。校验失败先修复，再 finish；不能把 ready、截图加载成功或写入成功冒充已提交。不要通过系统 Git 补一次重复提交。
- 常规初始化、暂存和提交均使用插件内置 isomorphic-git，无 node_modules 或系统 Git 依赖。提交优先使用仓库已有 user.name/user.email；缺失时使用 Website Builder / website-builder@localhost 作为该次提交作者，不修改全局 Git 配置。

## 必须确认的异常

遇到 GIT_CONFIRMATION_REQUIRED、非 main、分离 HEAD、merge/rebase/cherry-pick/revert 进行中、未解决索引冲突、锁文件、异常索引或其他 Git 失败时，保留工作区与索引，不自动修复、不删除锁文件、不强行切回 main。

先向用户说明项目目录、当前状态、拟执行的处理及影响，取得明确确认；然后才使用系统环境中的 git，在 project_directory 中执行获准操作。不得用 isomorphic-git 自动合并，也不能换接口绕过确认。未经确认不执行 checkout/switch、merge、rebase、reset、stash、clean、amend 或冲突覆盖。

异常处理后重新调用 finish 核对并本地提交；即使用户确认了合并，也不因此获得 push 或配置远程仓库的授权。

只有用户明确要求GitLab推送/部署，并完成[严格部署确认](gitlab-deployment.md)时，才允许对应工具在该范围普通推送；上述初始化/finish仍不自动推送，确认合并本身不授权推送。

GitLab推送/部署入口当前暂停，相关规则仅作为恢复时参考。现用R2静态部署不创建Git远端或标签，不改变本地main提交规则。
