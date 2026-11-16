## Overview

Promotional campaign section, featuring large left promo banner and 4-column right promotional product matrix.

### Mandatory Specifications
1. **Right Product Image Sizing**: Each promotional product item MUST use a 1:1 square aspect ratio (`aspect-square`), a solid light background underlay (`bg-accent/40`), and `object-cover` image scaling to fill the frame properly.
2. **Fixed Height Text with Ellipsis**: Bottom title/description containers MUST have a fixed height (`h-8` with `line-clamp-2 overflow-hidden text-ellipsis`). Any overflowing text must be clamped with an ellipsis to ensure all grid items maintain identical height alignment without ragged baselines.

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
