# ProductList-04

四列带背景对比色的精品推荐商品列表板块。

### 区域划分
- `section-title`: 标题栏区域。
- `product-grid`: 网格展示区域。

### 尺寸与响应式
- 桌面端：4 列网格排布。
- 移动端：2 列小屏自适应排布。

### 属性与接口
| 属性名 | 属性说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `containerId` | 商品挂载容器 ID | `string` | `'product-grid-04'` |

### 事件机制
- `product-navigate`: 商品卡片点击事件。

### 独立使用说明
板块支持独立调用 `loadProducts('product-grid-04')` 初始化挂载。
