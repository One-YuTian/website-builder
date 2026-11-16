## Overview

Product Detail Page (PDP), integrating multi-view gallery preview, purchase decision region (title, price comparison, SKU swatches, quantity stepper, Add to Cart/Buy Now), and smart collapsible expandable panels for overflowing long content.

### Expand / Collapse (Read More) Pattern & Specifications
1. **Dynamic Overflow Detection**:
   - Collapsible sections (Description `max-h-24`, Specifications `max-h-56`, Reviews `max-h-72`) have defined max-height constraints.
   - On initialization, font/image load, window resize, and tab switching, the script dynamically compares `scrollHeight > clientHeight + 4`. If content is short and does NOT exceed the height limit, the bottom gradient fade mask (`.collapsible-fade`) and toggle button (`.collapsible-toggle`) **MUST REMAIN HIDDEN** (`hidden`).
   - The toggle button and fade mask appear only when actual content overflows the container height.
2. **Bidirectional Toggle Support**:
   - Clicking the toggle expands the container to full height (`max-h-none overflow-visible`), hides the gradient fade mask (`opacity-0 pointer-events-none hidden`), and rotates the chevron arrow 180° (`-rotate-135`).
   - Clicking again toggles it back to the collapsed state, restoring the max-height clamp, fade overlay, and chevron angle (`rotate-45`).
   - Expanded and collapsed height classes are mutually exclusive; never retain conflicting classes.
3. **Strict Fidelity Constraints**:
   - MUST preserve `.collapsible-content`, `.collapsible-fade`, and `.collapsible-toggle`.
   - DO NOT delete the bottom gradient mask.
   - DO NOT replace with native `<details><summary>` or plain inline text buttons ("Read more" / "Ver mais").
   - DO NOT move the toggle button outside the `.relative` container.
   - Re-measure overflow whenever a hidden tab (`.tab-panel`) becomes visible; never measure dimensions while hidden.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Follows Tailwind centered container (`w-full max-w-content mx-auto px-4 lg:px-6`) with PC max content width 1200px centered.
- Desktop (1024px+): 1:1 two-column layout (gallery ~550px, summary ~550px).
- Mobile (under 1024px): Adapts to single vertical column with swipeable gallery.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `productId` | Product ID displayed | `string` | `'product-01'` |

### Events
- `product-navigate`: Dispatched when clicking recommended product.
- `gallery-change`: Dispatched when switching thumbnail view.
