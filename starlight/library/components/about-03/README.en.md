## Overview

About Us corporate brand page, integrating full-width hero banner, brand founding story narrative, key metrics dashboard, milestone timeline, and core team member showcase.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Follows Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with PC max content width 1200px centered.
- Desktop (1024px+): Magazine style multi-column layout with generous whitespace.
- Mobile (under 1024px): Adapts to single vertical column with 2-column stats grid.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `theme` | Theme mode | `'light' \| 'dark'` | `'light'` |

### Events
- `about-navigate`: Dispatched when clicking team social link or CTA.
