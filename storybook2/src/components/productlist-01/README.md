# ProductList-01

四列标准商品网格板块，由独立 HTML 模板与原生 JavaScript 循环追加 Card-01 节点组成。

### 区域划分
- `section-title`: 板块标题区域。
- `product-grid`: 网格列表容器区域。

### 尺寸与响应式
- 桌面端：4 列网格排布，遵循全局内容宽度。
- 移动端：2 列紧凑网格自适应。

### 属性与接口
| 属性名 | 属性说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `containerId` | 商品挂载容器 ID | `string` | `'product-grid-01'` |

### 事件机制
- `product-navigate`: 点击单张商品卡片由 Card-01 冒泡触发。

### 独立使用说明
板块为纯原生结构，支持独立调用 `loadProducts('product-grid-01')` 挂载渲染。
