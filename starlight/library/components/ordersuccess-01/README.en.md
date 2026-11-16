## Overview

Order success and receipt confirmation page, integrating green success checkmark skeleton, order ID banner, estimated delivery window, shipping summary, and continue shopping CTAs.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Centered single column card layout, follows Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with max width 680px centered.
- Mobile: Width calc(100vw - 32px), buttons stacked vertically for easy one-hand tapping.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `orderId` | Order confirmation ID | `string` | `'ORD-2026-9988'` |

### Events
- `order-navigate`: Dispatched when clicking View Order or Continue Shopping.
