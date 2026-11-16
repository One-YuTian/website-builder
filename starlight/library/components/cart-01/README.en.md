## Overview

Standard e-commerce shopping cart drawer & component, supporting stream of cart items, quantity stepper, single item removal, subtotal/shipping/coupon calculation, and Proceed to Checkout CTA.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Drawer mode: Slides out from right edge on both desktop and mobile, fixed width 380px~420px, full height 100dvh.
- Page mode: Follows Tailwind container (w-full max-w-content mx-auto px-4 lg:px-6) centered with width 768px~960px.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `itemCount` | Number of unique items in cart | `number` | `2` |

### Events
- `cart-checkout`: Dispatched when clicking checkout button.
- `cart-update`: Dispatched when modifying item quantity or removing item.
