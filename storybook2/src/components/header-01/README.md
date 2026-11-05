# Header-01

响应式粘性双栏导航条组件，桌面端双层排版，移动端滑出式抽屉菜单。

### 区域划分
- `header-content`: 顶部主区域，包含 Logo、搜索栏与操作图标。
- `search`: 居中搜索区域，支持输入建议下拉。
- `account-panel`: 个人账户快速操作面板。
- `navigation`: 次级全站横向导航链接。

### 尺寸与响应式
- 桌面端：内容宽度遵循全局 `--theme-content-max-width`（默认 1200px），粘性吸顶固定高度 72px。
- 移动端：抽屉宽度 320px，图标尺寸 40px，自适应小屏视口。

### 属性与接口
| 属性名 | 属性说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `theme` | 深色与浅色主题模式（反转颜色：dark 为深色背景浅色字，light 为浅色背景深色字） | `'dark' \| 'light'` | `'dark'` |
| `is-logged-in` | 登录状态控制 | `boolean` | `false` |
| `cart-count` | 购物车图标角标数量 | `number` | `0` |
| `wishlist-count` | 收藏夹图标角标数量 | `number` | `0` |

### 事件机制
- `header-navigate`: 页面导航路由事件。
- `header-search`: 搜索提交触发。
- `header-search-input`: 实时联想搜索输入。
- `header-cart`: 购物车打开动作。
- `header-logout`: 登出动作触发。

### 独立使用说明
组件为独立的 Web Component，支持通过 `theme="light"` 或 `theme="dark"` 属性在现有主题基础上完成深浅色颜色反转。
