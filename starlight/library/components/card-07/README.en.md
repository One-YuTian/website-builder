## Overview

Standard e-commerce product card component built on Native Web Components. Supports 1:1 square image skeleton, discount & original price tags, 2-line clamped title skeleton, price comparison, add-to-cart & wishlist interactions, and dual Grid/List display modes.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Grid mode (grid): 1:1 square image ratio, card stretches across container column with max width 384px.
- List mode (list): Horizontal two-column layout with 140px fixed thumbnail on left and flexible information on right, max width 768px.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `product-id` | Unique product identifier | `string` | `'item-01'` |
| `view-mode` | Display layout mode | `'grid' \| 'list'` | `'grid'` |
| `discounted` | Whether the item is on promotional discount | `boolean` | `false` |

### Events
- `product-navigate`: Dispatched when clicking product image or title to navigate to PDP.
- `card-cart`: Dispatched when clicking add-to-cart button.
- `card-wishlist`: Dispatched when clicking wishlist heart button.
