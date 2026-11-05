# Header-03

居中胶囊搜索框与底部横向分类导航的高级电商导航组件。

### 区域划分
- `header-content`: 主区域，包含品牌区、居中大搜索框与操作区。
- `search`: 居中带醒目搜索按钮的交互区。
- `navigation`: 次级全站核心类目横向栏。

### 尺寸与响应式
- 桌面端：内容宽度遵循全局 `--theme-content-max-width`，双层整体高度约 108px。
- 移动端：单行紧凑排列，移动视口下隐藏搜索输入并收纳至侧边抽屉。

### 属性与接口
| 属性名 | 属性说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `theme` | 深色与浅色主题模式（反转颜色：dark 为深色背景，light 为浅色背景） | `'dark' \| 'light'` | `'dark'` |
| `is-logged-in` | 登录状态控制 | `boolean` | `false` |
| `cart-count` | 购物车图标角标数量 | `number` | `0` |
| `wishlist-count` | 收藏夹图标角标数量 | `number` | `0` |

### 事件机制
- `header-navigate`: 页面导航路由事件。
- `header-search`: 搜索提交触发。
- `header-search-input`: 实时联想搜索输入。
- `header-cart`: 购物车打开动作。

### 独立使用说明
组件具备独立样式与结构，通过 `theme="light"` 与 `theme="dark"` 实现基于现有全局配色反转的深浅双模式。
