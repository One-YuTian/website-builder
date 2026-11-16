## Overview

Full checkout and order review page, integrating shipping address entry form, payment method selector, and right-aligned sticky order summary breakdown card.

### Mandatory Specifications
1. **No Step Numbering Badges**: Left form cards do NOT include circular 1 or 2 step numbering badges; headers display clean title skeletons directly.
2. **Zero Currency Symbols or Abbreviations**: Do NOT display currency symbols, units, or hardcoded acronyms such as COD badges; prices use pure numerical format or skeleton placeholders.
3. **Payment Methods Options**: The payment selection MUST provide:
   - **Cash on Delivery**: Default active and selected radio option.
   - **Online Payment**: Disabled state (radio disabled, opacity-60, cursor-not-allowed).

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Follows Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with PC max content width 1200px centered.
- Desktop (1024px+): 7:5 asymmetric two-column layout (form on left, sticky summary on right).
- Mobile (under 1024px): Single vertical column layout.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `step` | Current checkout step (1, 2, 3) | `number` | `1` |

### Events
- `checkout-submit`: Dispatched when submitting order with shipping & payment info.
