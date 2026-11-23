# Navigation

The app's screens, their route names, and how each platform presents them. Route names are the same in every app: `Route.cart` on iOS, `Route.Cart` on Android and `/cart` on web.

| Screen | Route | Web path | Reached from |
|---|---|---|---|
| Home | `home` | `/` | App start |
| Category | `category(categoryId)` | `/category/$categoryId` | A category tile on Home |
| Search | `search` | `/search` | The search field on Home |
| Cart | `cart` | `/cart` | The cart bar (Home, Category, Search), the cart button in the header |
| Order placed | `orderPlaced(orderId)` | `/orders/$orderId` | Placing an order in Cart |
| Settings | `settings` | `/settings` | Home's Settings entry |

## Rules

- One stack, rooted at Home. There are no tabs: a quick commerce session is short and goes Home → (Category or Search) → Cart → Order placed.
- Placing an order replaces Cart with Order placed, so Back from Order placed returns to where the customer was before Cart, not to an empty cart. "Continue shopping" on Order placed returns to Home (it clears the stack back to Home on mobile; it links to `/` on web).
- The cart bar floats at the bottom of Home, Category and Search whenever the cart has at least one item.

## Per platform

- **iOS:** one `NavigationStack` rooted at Home. Screens are pushed by appending a `Route` (apps/ios/App/Core/Navigation/Route.swift).
- **Android:** one Navigation 3 back stack starting at `Route.Home`. Screens are pushed with `backStack.add(...)` (apps/android/.../core/navigation).
- **Web:** TanStack Router file routes in apps/web/src/routes. Every screen has a URL. The site header shows the app name (a link to Home), the cart button with the item count, and the Settings gear.

When you add a screen, add a row here. Use the web path as the mobile deep link path when deep links are added.

For the showcase (`previews/shots.json`), iOS and Android open a screen directly from launch arguments: `-screenshotScreen` (`home`, `category`, `search`, `cart`, `order-placed`, `settings`), `-screenshotAppearance` (`light`, `dark`), `-screenshotCategoryId` and `-screenshotOrderId`. Android reads the same names as string intent extras. The back stack is the screen's natural one (Home underneath). Web uses the paths above, with `cart.items` and `orders.history` seeded in localStorage.
