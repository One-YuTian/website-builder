# ProductList-02

五列密集型商品网格板块，由独立 HTML 模板与原生 JavaScript 循环追加 Card-01 节点组成。

### 区域划分
- `section-title`: 板块标题区域。
- `product-grid`: 五列商品网格区域。

### 尺寸与响应式
- 桌面端：5 列高密度网格排布。
- 移动端：自适应为 2 列（小屏）至 3 列（平板）。

### 属性与接口
| 属性名 | 属性说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `containerId` | 商品挂载容器 ID | `string` | `'product-grid-02'` |

### 事件机制
- `product-navigate`: 商品卡片点击事件。

### 独立使用说明
板块为独立模板，直接调用 `loadProducts('product-grid-02')` 完成渲染。
