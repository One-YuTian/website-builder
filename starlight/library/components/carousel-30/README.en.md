## Overview

Full-width hero visual carousel showcase block, supporting multi-aspect ratio scaling, touch drag gestures, auto-rotation timer, bottom dot pagination indicators, and left/right navigation arrows, with dedicated breakpoint viewport adaptation.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Follows global design system, outer container uses Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with PC max content width 1200px centered.
- Desktop (1024px+): Fixed height 500px~550px with stable text overlay alignment.
- Mobile (under 1024px): Adapts to 16:9 or 50:21 aspect ratio with smooth swipe touch gestures.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `stageSelector` | Mount container selector | `string` | `'#carousel-stage'` |
| `interval` | Auto-play interval in milliseconds | `number` | `5000` |
| `paused` | Whether auto-rotation is paused | `boolean` | `false` |

### Events
- `carousel-navigate`: Dispatched when clicking a carousel slide banner.
- `carousel-change`: Dispatched when slide transition finishes, providing current active index.
