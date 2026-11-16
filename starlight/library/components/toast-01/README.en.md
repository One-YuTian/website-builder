## Overview

Global toast notification component for website messaging, supporting success, error, warning, and info feedback types. Provides auto-dismiss timers, pause-on-hover/focus, manual dismiss, and a global `window.Toast` caller facade.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.

### Dimensions & Responsiveness
- Desktop: Floated at top-right corner with max-width 384px (`max-w-sm`), stacking up to 4 concurrent cards.
- Mobile: Fluid width `calc(100vw - 2rem)` with safe screen gutters.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `position` | Fixed overlay stack position | `string` | `'top-right'` |
| `max-toasts` | Maximum number of simultaneous toast cards | `number` | `4` |

### Global API (window.Toast)
- `Toast.show(options | message)`: Triggers a custom notification and returns its unique ID.
- `Toast.success(message, options)`: Dispatches a success status toast.
- `Toast.error(message, options)`: Dispatches an error alert toast.
- `Toast.warning(message, options)`: Dispatches a warning status toast.
- `Toast.info(message, options)`: Dispatches an info status toast.
- `Toast.dismiss(id)`: Immediately dismisses the specified toast item.
- `Toast.clear()`: Clears all active toast notifications.

### Events
- `toast-show`: Dispatched when a toast card is added and rendered.
- `toast-dismiss`: Dispatched when a toast card is dismissed and removed.

