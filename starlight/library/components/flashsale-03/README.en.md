## Overview

Flash sale and limited-time marketing section, integrating animated countdown timer blocks, promotional badges, flash cards with sold percentage progress, and View All CTA.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Follows Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with max content width 1200px centered.
- Desktop (1024px+): 3~4 flash cards side by side.
- Mobile (under 768px): 2 compact cards with smooth horizontal swipe.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `limit` | Max items displayed | `number` | `4` |
| `endTime` | Target end timestamp | `string` | `'2026-12-31'` |

### Events
- `flashsale-navigate`: Dispatched when clicking View All button.
- `product-navigate`: Dispatched when clicking flash card.
