## Overview

Flash sale and limited-time promotional product card component built on Native Web Components. Integrates square image skeleton, high-saturation discount badge, price comparison, animated flash sale progress bar, and sold percentage notice.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Card width fills container grid column or Swiper slide with 1:1 aspect ratio image.
- Scales responsively across desktop and mobile while keeping text hierarchy clear.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `product-id` | Unique product identifier | `string` | `'flash-item-01'` |
| `sold-percent` | Sold stock percentage | `number` | `65` |

### Events
- `product-navigate`: Dispatched when clicking flash card to open PDP.
- `flashcard-buy`: Dispatched when clicking Buy Now button.
