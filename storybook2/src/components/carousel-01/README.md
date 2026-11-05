# Carousel-01

全宽响应式主轮播板块组件，移动端严格遵循原站 50:21 真实高宽比，桌面端固定 550px 高度。

### 区域划分
- `carousel-stage`: 轮播主体舞台区域。
- `pagination`: 居中指示点区域。

### 尺寸与响应式
- 移动端：视口小于 1024px 时宽高比为 `aspect-[50/21]`。
- 桌面端：视口达到 1024px 及以上时高度固定为 550px。

### 属性与接口
| 属性名 | 属性说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `stageSelector` | 初始化挂载容器选择器 | `string` | `'#carousel-01-stage'` |

### 事件机制
- `carousel-navigate`: 轮播图点击跳转事件。

### 独立使用说明
板块采用独立 HTML 模板配合原生 JavaScript 函数驱动，不封装为 Web Component。
