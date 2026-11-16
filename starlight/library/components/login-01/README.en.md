## Overview

User login authentication page, featuring centered rounded card, brand LOGO skeleton, email/password fields, remember me checkbox, forgot password link, social login, and register link.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Centered card max width 440px, generous vertical padding, vertically centered.
- Mobile: Width calc(100vw - 32px), button height >= 48px.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `title` | Headline title | `string` | `'Welcome Back'` |

### Events
- `auth-login`: Dispatched when submitting login form with credentials.
- `auth-navigate`: Dispatched when clicking register or forgot password.
