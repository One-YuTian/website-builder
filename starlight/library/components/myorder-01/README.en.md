## Overview

Customer account My Orders management page, integrating breadcrumb trail, comprehensive order cards list (order ID, status badge, order items snapshot, items count, payment method, order total, and View Details / Buy Again actions), and empty state fallback.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.

### Dimensions & Responsiveness
- Outer container strictly follows Tailwind centered container (`w-full max-w-content mx-auto px-4 lg:px-6`) with PC max content width 1200px centered.
- Order cards list gracefully flows in vertical stack with responsive gutters.
- Order card footer flex layout gracefully stacks vertically on smaller viewports and aligns horizontally on desktop.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `limit` | Maximum orders rendered per view | `number` | `10` |

### Events
- `order-navigate`: Dispatched when clicking View Details, Buy Again, or Continue Shopping.
