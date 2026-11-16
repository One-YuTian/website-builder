## Overview

Flash sale dual-column marketing block, featuring 1/3 left countdown poster banner and 2/3 right Swiper carousel slider with responsive flash sale cards.

### Mandatory Specifications
1. **Left Countdown Banner Base**: Must use solid theme background color (`bg-primary`) layered with a background cover image/texture (`bg-cover bg-center`) as the visual foundation for maximum urgency and promotional appeal.
2. **Right Product Carousel MUST use Swiper**: The right product section MUST be powered by a Swiper carousel track (`.flash-sale-swiper-07`) with prev/next navigation arrows.
3. **Card Component MUST use `FlashCard` (`<flashcard-01>`)**: All product slides in this flash sale section MUST use the dedicated `<flashcard-01>` component featuring flash sale prices, discount badges, and inventory progress bars. Replacing with generic product cards is strictly prohibited.

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
