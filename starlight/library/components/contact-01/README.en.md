## Overview

Contact Us customer care and business inquiries page, integrating contact info card matrix (address, phone, email, hours), online feedback form, and full-width interactive map.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Follows Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with PC max content width 1200px centered.
- Desktop (1024px+): 1:1 two-column layout (contact info on left, form on right).
- Mobile (under 768px): Adapts to single vertical column with full-width submit button.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `formTitle` | Form headline title | `string` | `'Get in Touch'` |

### Events
- `contact-submit`: Dispatched when submitting contact form with form payload.
