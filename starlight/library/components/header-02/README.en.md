## Overview

Global sticky top navigation bar component, integrating brand LOGO skeleton, site-wide predictive search bar, user authentication & account portal, wishlist & cart counter badges, and horizontal category navigation menu. Features sticky positioning upon scroll and lightweight slide-out mobile drawer navigation.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Desktop (1024px+): Fixed height 68px~76px, follows global Tailwind centered container（`w-full max-w-content mx-auto px-4 lg:px-6`） with max content width 1200px centered, supports sticky positioning during page scrolling.
- Tablet & Mobile (under 1024px): Horizontal category list collapses, main bar retains Logo, search, and action icons; hamburger button triggers 320px smooth slide-out drawer.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `theme` | Color theme mode, supports dark and light inversion | `'dark' \| 'light'` | `'dark'` |
| `is-logged-in` | User authentication state, toggles account portal display | `boolean` | `false` |
| `cart-count` | Badge counter number on shopping cart icon | `number` | `0` |
| `wishlist-count` | Badge counter number on wishlist icon | `number` | `0` |

### Events
- `header-navigate`: Dispatched when clicking brand logo, nav links, or account menu items.
- `header-search`: Dispatched when submitting search form or pressing enter.
- `header-search-input`: Dispatched in real time as search input content changes for predictive suggestions.
- `header-cart`: Dispatched when clicking the cart icon to open drawer.
