## Overview

E-commerce trust guarantees and customer service highlights section, showcasing official genuine authenticity, free express delivery, hassle-free returns, and 24/7 live support in equal grid columns.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Follows Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with max content width 1200px centered.
- Desktop (1024px+): 3~4 equal columns horizontally aligned with generous padding.
- Mobile (under 768px): Single column vertical stacking or compact 2-column grid.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `columns` | Number of service feature columns | `number` | `4` |

### Events
- `service-click`: Dispatched when clicking service card to view detailed policy.
