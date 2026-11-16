## Overview

User registration and account creation page, containing full name, email, dedicated country code prefix phone number field, password strength meter, confirm password, terms agreement checkbox, and sign in link.

### Mandatory Specifications
- **Separated Country Code Prefix**: The mobile phone input MUST isolate the international dial code prefix (such as `+1`, `+63`, `+55`) into an independent attached addon block (`inline-flex items-center px-3.5 rounded-l-xl border border-r-0 bg-accent/40 text-sm font-semibold select-none`) displayed alongside the phone number input. Mixing dial code and mobile number in a single plain text input is strictly prohibited.

### Regions
Functional regions are annotated directly in the component code implementation via English comments.


### Dimensions & Responsiveness
- Centered card max width 480px, vertically centered on screen.
- Mobile: Width calc(100vw - 32px) with comfortable touch targets.

### Attributes & Props
| Attribute | Description | Type | Default |
| --- | --- | --- | --- |
| `title` | Registration headline | `string` | `'Create Account'` |

### Events
- `auth-register`: Dispatched when submitting registration form.
- `auth-navigate`: Dispatched when clicking sign-in link.
