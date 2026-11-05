# Header-02

带顶部公告条和渐变背景的双栏粘性导航组件，右对齐搜索栏，全自适应移动抽屉。

### 区域划分
- `top-bar`: 顶部辅助信息与快速链接区域。
- `promotion`: 促销提示文字占位区。
- `header-content`: 主导航区域，含 Logo、搜索栏与操作图标。
- `dialog`: 移动端侧滑导航抽屉。

### 尺寸与响应式
- 桌面端：内容宽度遵循全局 `--theme-content-max-width`，主栏高度 76px。
- 移动端：视口小于 768px 时自动隐藏顶部栏，抽屉全屏贴边展开。

### 属性与接口
| 属性名 | 属性说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `theme` | 深色与浅色主题模式（反转颜色：dark 为深色渐变背景，light 为浅色背景） | `'dark' \| 'light'` | `'dark'` |
| `is-logged-in` | 登录状态控制 | `boolean` | `false` |
| `cart-count` | 购物车图标角标数量 | `number` | `0` |
| `wishlist-count` | 收藏夹图标角标数量 | `number` | `0` |

### 事件机制
- `header-navigate`: 页面导航路由事件。
- `header-search`: 搜索提交触发。
- `header-search-input`: 实时联想搜索输入。
- `header-cart`: 购物车打开动作。

### 独立使用说明
组件具备独立运行能力，支持通过 `theme="light"` 或 `theme="dark"` 在现有主题预设下进行背景和前景色反转。
