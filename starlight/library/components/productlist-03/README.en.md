## Overview

Core e-commerce popular product carousel showcase block, integrating centered title skeleton placeholder, Swiper carousel track, and multi-breakpoint responsive product cards. Left and right navigation arrows are absolutely positioned over the carousel without occupying extra horizontal width.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.

### Dimensions & Responsiveness
- Outer container strictly follows Tailwind centered container (`w-full max-w-content mx-auto px-4 lg:px-6`) with PC max content width 1200px centered.
- Navigation arrows are absolutely positioned floating over the carousel sides, avoiding extra width overhead.
- Desktop (1024px+): 5-column carousel layout with 24px gutters.
- Tablet (768px~1023px): 4-column carousel layout with 20px gutters.
- Mobile (under 768px): Adapts to 2~3 compact carousel columns with 12~16px gap.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `containerId` | Mount container selector ID | `string` | `'product-slider-03'` |
| `limit` | Max product cards rendered | `number` | `8` |

### Events
- `product-navigate`: Dispatched when clicking an individual product card to view PDP.
