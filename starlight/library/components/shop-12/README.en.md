## Overview

Shop catalog page, integrating page title, multi-dimensional filter sidebar, sorting toolbar, item counter, and responsive multi-column product card grid.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Follows Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with PC max content width 1200px centered.
- Desktop (1024px+): 4 equal columns with optional 260px filter sidebar on left.
- Mobile (under 768px): 2 compact columns with wrapped toolbar.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `defaultSort` | Default sorting rule | `string` | `'default'` |
| `itemCount` | Initial product count | `number` | `8` |

### Events
- `product-navigate`: Dispatched when clicking product card.
- `shop-sort`: Dispatched when changing sorting order.
