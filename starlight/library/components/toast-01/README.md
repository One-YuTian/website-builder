# Toast-01

网站全局轻量浮层消息提示组件（Toast Notification），支持成功（Success）、错误（Error）、警告（Warning）和信息（Info）四类即时反馈提示，提供自动定时关闭、悬停/聚焦暂停计时、手动快速关闭以及全局 `window.Toast` 便捷调用门面。

### 区域划分
本组件各功能区域通过英文注释直接标注于代码实现中。

### 尺寸与响应式
- 桌面端：固定于视口右上角浮动显示，卡片最大宽度 384px（`max-w-sm`），垂直流式堆叠展示。
- 移动端：宽度自适应为 `calc(100vw - 2rem)`，与视口左右边界保持安全间距。

### 属性与接口
| 属性名 | 属性说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `position` | 浮动堆叠位置（如 `top-right`） | `string` | `'top-right'` |
| `max-toasts` | 最多同时并存的提示消息数量 | `number` | `4` |

### 全局 API (window.Toast)
- `Toast.show(options | message)`: 触发自定义配置的消息提示，返回该提示的唯一 ID。
- `Toast.success(message, options)`: 触发成功类型消息提示。
- `Toast.error(message, options)`: 触发错误类型消息提示。
- `Toast.warning(message, options)`: 触发警告类型消息提示。
- `Toast.info(message, options)`: 触发常规信息提示。
- `Toast.dismiss(id)`: 立即关闭并移除指定 ID 的提示消息。
- `Toast.clear()`: 清空全部当前活跃的消息提示。

### 事件机制
- `toast-show`: 当新提示消息渲染呈现时派发。
- `toast-dismiss`: 当某条提示消息关闭并移除时派发。

