## Overview

Core e-commerce product shelf grid block, integrating section title, fast category filter tabs, 4~5 column responsive product card matrix, and bottom View All CTA.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Outer container strictly follows Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with PC max content width 1200px centered.
- Desktop (1024px+): 4~5 column grid layout with 16px~24px gutters.
- Tablet (768px~1023px): Adapts to 3-column grid.
- Mobile (under 768px): Adapts to 2 compact columns with 12px gap.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `containerId` | Mount container selector ID | `string` | `'product-grid-01'` |
| `limit` | Max product cards rendered | `number` | `8` |

### Events
- `product-navigate`: Dispatched when clicking an individual product card to view PDP.
- `filter-change`: Dispatched when switching category filter tabs.
