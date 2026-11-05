# Card-01

标准电商商品卡片组件，支持网格（Grid）与列表（List）双展示模式。

### 区域划分
- `image-area`: 商品主图区域。
- `content-area`: 标题与价格信息区域。

### 尺寸与响应式
- 网格模式：正方形 1:1 图片比例，最大宽度 384px。
- 列表模式：横向排版，最大宽度 768px。

### 属性与接口
| 属性名 | 属性说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `product-id` | 商品唯一标识符 | `string` | `'product-01'` |
| `view-mode` | 排版模式（`'grid'` 或 `'list'`） | `string` | `'grid'` |
| `discounted` | 是否展示折扣原价标记 | `boolean` | `false` |

### 事件机制
- `product-navigate`: 商品点击跳转事件。

### 独立使用说明
组件具备独立运行能力，可在 ProductList 板块或独立布局中无缝使用。
