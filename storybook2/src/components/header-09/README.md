# Header-09

集成式单通栏导航栏组件，包含标志、四项导航、紧凑搜索栏以及快捷操作按钮。

## 区域划分
- `logo`: 品牌标志展示区域。
- `desktop-nav`: 桌面端主分类导航区域。
- `search-bar`: 紧凑型内联搜索栏与联想词面板区域。
- `auth`: 用户身份与操作面板区域。
- `mobile-drawer`: 移动端侧滑抽屉区域。

## 尺寸与响应式
- 桌面端：单栏高度约 56px，多元素紧凑均匀排布。
- 移动端：导航与搜索简化，菜单收纳至侧边抽屉。

## 属性与接口
| 属性名 | 属性说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `is-logged-in` | 用户登录状态标记 | `boolean` | `false` |
| `cart-count` | 购物车徽标商品数量 | `number` | `0` |
| `wishlist-count` | 收藏夹徽标商品数量 | `number` | `0` |
| `theme` | 主题反转模式（深色/浅色） | `string` | `'dark'` |

## 事件机制
- `header-navigate`: 导航栏各项跳转触发事件。
- `header-search`: 搜索表单提交事件。
- `header-search-input`: 搜索输入联想触发事件。

## 独立使用说明
组件作为独立 WebComponent 引入，支持深浅色模式切换与多状态联动。

