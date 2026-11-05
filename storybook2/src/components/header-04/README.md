# Header-04

具备全站分类折叠大面板（Mega Menu）的双栏电商导航组件。

### 区域划分
- `header-content`: 主导航区域，包含 Logo、输入框、认证及操作按钮。
- `categories-panel`: 桌面端次级栏展开的分类卡片面板区域。
- `mobile-categories`: 移动端侧滑抽屉中的分类手风琴区域。

### 尺寸与响应式
- 桌面端：内容宽度遵循全局 `--theme-content-max-width`，主栏 64px，分类副栏 44px。
- 移动端：双栏合并为单行吸顶，分类下拉折叠至抽屉菜单中。

### 属性与接口
| 属性名 | 属性说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `theme` | 深色与浅色主题模式（反转颜色：dark 为深色背景，light 为浅色背景） | `'dark' \| 'light'` | `'dark'` |
| `is-logged-in` | 登录状态控制 | `boolean` | `false` |
| `cart-count` | 购物车图标角标数量 | `number` | `0` |
| `wishlist-count` | 收藏夹图标角标数量 | `number` | `0` |

### 事件机制
- `header-navigate`: 页面导航路由事件（支持类目及商品）。
- `header-search`: 搜索提交触发。
- `header-search-input`: 实时联想搜索输入。
- `header-cart`: 购物车打开动作。

### 独立使用说明
组件具备完整独立的样式，可在任何预设主题基础上通过 `theme="light"` 或 `theme="dark"` 反转颜色。
