## Overview

New customer welcome modal block, integrating backdrop mask, gift icon skeleton, introductory discount headline, email subscription form, and claim CTA button.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Max width 480px centered on viewport, backdrop covering full screen.
- Mobile: Width calc(100vw - 32px) with compact padding.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `discountText` | Headline coupon text | `string` | `'15% OFF'` |
| `isOpen` | Modal visibility state | `boolean` | `true` |

### Events
- `modal-close`: Dispatched when clicking close button or backdrop.
- `modal-submit`: Dispatched when submitting email to claim coupon.
