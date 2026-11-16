## Overview

Classic Latin-American multi-category e-commerce homepage assembled from six core functional modules: top navigation header, hero carousel, service benefits, countdown flash sale, personalized product recommendations, and footer.

### Component Chain
`home-01: header-01 -> carousel-01 -> services-08 -> flashsale-01 -> productlist-01 -> footer-01`

### Included Components
| Component | Custom Element | Role & Function |
| --- | --- | --- |
| `Header-01` | `<header-01>` | Global site navigation, search bar, category shortcuts, and cart indicators |
| `Carousel-01` | `<carousel-01>` | Hero responsive promotional banner carousel with touch swipe and autoplay |
| `Services-08` | `<services-08>` | Customer trust badges and service commitments (Free Shipping, Warranty, Returns) |
| `FlashSale-01` | `<flashsale-01>` | Limited-time discount countdown section with `<flashcard-01>` progress cards |
| `ProductList-01` | `<productlist-01>` | Featured personalized product grid showcase with `<card-01>` cards |
| `Footer-01` | `<footer-01>` | Global site footer with sitemap navigation, newsletter signup, and copyright |

### Dimensions & Responsiveness
- Aligned to global content width (`w-full max-w-content mx-auto px-4 lg:px-6`).
- Mobile: Fully responsive stacked layout with native touch carousel gestures.

