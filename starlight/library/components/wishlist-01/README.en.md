## Overview

Wishlist and saved items catalog page, integrating page headline, item counter, product card grid with fast Move to Cart and item removal operations.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Follows Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with PC max content width 1200px centered.
- Desktop (1024px+): 4 equal columns.
- Mobile (under 768px): 2 compact columns.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `itemCount` | Total items in wishlist | `number` | `4` |

### Events
- `wishlist-remove`: Dispatched when removing item from wishlist.
- `wishlist-move-to-cart`: Dispatched when moving item to shopping cart.
