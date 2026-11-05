# Header-05

全宽通栏集市型导航组件，含顶部高亮促销条与清晰横向主导航。

### 区域划分
- `header-content`: 顶部通栏区域，包含 Logo、输入框与操作图标。
- `search`: 居中大宽度搜索框。
- `navigation`: 下方大间距核心分类主导航栏。

### 尺寸与响应式
- 桌面端：内容宽度遵循全局 `--theme-content-max-width`，主栏 64px，底部导航 44px。
- 移动端：紧凑单行自适应，导航折叠至抽屉。

### 属性与接口
| 属性名 | 属性说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `theme` | 深色与浅色主题模式（反转颜色：light 为浅色背景，dark 为深色背景） | `'dark' \| 'light'` | `'light'` |
| `is-logged-in` | 登录状态控制 | `boolean` | `false` |
| `cart-count` | 购物车图标角标数量 | `number` | `0` |
| `wishlist-count` | 收藏夹图标角标数量 | `number` | `0` |

### 事件机制
- `header-navigate`: 页面导航路由事件。
- `header-search`: 搜索提交触发。
- `header-search-input`: 实时联想搜索输入。
- `header-cart`: 购物车打开动作。

### 独立使用说明
组件具备独立运行能力，支持通过 `theme="dark"` 或 `theme="light"` 属性在现有主题上进行背景与文本颜色反转。
