## Overview

Promotional campaign banner section, supporting equal multi-column or asymmetric mosaic layouts with rich background marketing imagery, discount tags, and fast CTAs.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Follows Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with max content width 1200px centered.
- Desktop (1024px+): 2~3 column layout with 240px~360px card heights.
- Mobile (under 768px): Single column vertical stacking.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `columns` | Number of promotional banner columns | `number` | `2` |

### Events
- `promo-navigate`: Dispatched when clicking banner card or CTA button.
