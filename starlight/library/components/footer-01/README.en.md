## Overview

Standard e-commerce site footer component, integrating brand LOGO skeleton, corporate mission statement, multi-column category navigation matrix, social media icons, security trust badges, and copyright/compliance bar with adaptive responsive grid layout.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Follows global design system, outer container uses Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with PC max content width 1200px centered.
- Desktop (1024px+): 3 to 4 column grid layout side by side with 32px~48px gutter spacing.
- Mobile (under 1024px): Adapts to single-column vertical flow with generous spacing between columns, ensuring touch targets are at least 44px high.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `columns` | Number of columns in main footer layout | `number` | `3` |

### Events
- `footer-navigate`: Dispatched when user clicks any footer navigation link or social icon.
