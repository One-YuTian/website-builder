## Overview

Category showcase and navigation block, integrating section title, round/square category thumbnail cards, and item counter badges with smooth hover micro-interactions.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Follows Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with max content width 1200px centered.
- Desktop (1024px+): 4~6 column circular or square cards evenly distributed.
- Mobile (under 768px): Adapts to 3 compact columns or horizontal swipe slider.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `limit` | Max categories displayed | `number` | `6` |

### Events
- `category-navigate`: Dispatched when clicking a category card, providing category ID.
