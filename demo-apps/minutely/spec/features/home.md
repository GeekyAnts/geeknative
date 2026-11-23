---
id: home
title: Home
status:
  ios: done
  android: done
  web: done
---

# Home

## Summary

The storefront. It promises fast delivery to the customer's address, gets them searching or browsing in one tap, and puts the bestsellers within reach.

## User stories

- As a shopper, I want to see how fast my order will arrive and where, so I trust the app before I start.
- As a shopper, I want to jump into a category or search right away, because I usually know what I need.

## Screens and states

**Home**, top to bottom:

1. **Header.** Title: the app name. Actions: a Cart button (`cart` icon, labeled `home.openCart`, with a badge showing the item count when the cart isn't empty) and a Settings button (`settings` icon, labeled `home.openSettings`).
2. **Delivery promise.** `common.deliveryIn` with `AppConfig.deliveryMinutes`, in `headline`, with the `fast` icon in an `accent` circle before it. Below it, the `location` icon and `common.deliveryAddress` in `label`, `onSurfaceVariant`.
3. **Search entry.** A full-width, field-shaped button: `search` icon and `search.placeholder` in `onSurfaceVariant`, on `surface` with an `outline` border and `AppRadius.full` corners, at least 48 high. Opens Search.
4. **Promo banner.** A card on `banner` with `AppRadius.xl` corners: a pill on `accent` / `onAccent` with the `fast` icon and `home.bannerEyebrow` (caption, bold); `home.bannerTitle` in `headline`, `onBanner`; `home.bannerBody` with `AppConfig.freeDeliveryThreshold`, `onBanner` at reduced emphasis. A large decorative 🛒 at the trailing edge, hidden from assistive technology.
5. **Shop by category.** `home.categoriesTitle` in `title`, then the 6 category tiles (spec/features/catalog.md) in a 3-column grid. A tile opens Category for that category.
6. **Bestsellers.** `home.bestsellersTitle` in `title`, then a horizontally scrolling rail of the bestseller product cards.
7. **Cart bar** at the bottom when the cart isn't empty (spec/features/cart.md). The content leaves room for it, so nothing is hidden behind it.

The catalog is local, so there are no loading or error states.

## Acceptance criteria

- AC-home-1: Home shows the app name as its title.
- AC-home-2: Home shows the delivery promise with `AppConfig.deliveryMinutes` minutes and the delivery address.
- AC-home-3: Home has an entry point that opens Settings.
- AC-home-4: Home shows all 6 categories, and choosing one opens the Category screen for it.
- AC-home-5: Home shows the bestseller products as product cards.
- AC-home-6: The search entry opens Search.
- AC-home-7: The Cart button opens Cart, and its badge shows the cart's item count when the cart isn't empty.

## Copy

`home.openSettings`, `home.openCart`, `home.bannerEyebrow`, `home.bannerTitle`, `home.bannerBody`, `home.categoriesTitle`, `home.bestsellersTitle`, `common.deliveryIn`, `common.deliveryAddress`, `search.placeholder`.

## Platform notes

- iOS: inline navigation title (the delivery promise is the page's headline); Cart and Settings are toolbar buttons. The search entry pushes Search, which focuses its field.
- Android: `TopAppBar` with the app name; Cart (`BadgedBox`) and Settings are app bar actions.
- Web: the site header holds the app name, the Cart button and the Settings gear on every page, so Home itself starts with the delivery promise. The page's `h1` is the app name, visually hidden (`sr-only`) so the delivery promise leads visually. The search entry is a link to `/search`. The category grid is 3 columns on narrow screens and 6 (one row) from the `md` breakpoint.

## Test IDs

- `home.openSettings`, `home.openCart`: the header buttons.
- `home.cartBadge`: the item count badge.
- `home.delivery`: the delivery promise.
- `home.search`: the search entry.
- `home.banner`: the promo banner.
- `category.<categoryId>`, `product.<productId>`: see spec/features/catalog.md.

## Assumptions and open questions

- Assumption: the delivery address is fixed copy until accounts and addresses exist.
- iOS tests navigation criteria (AC-home-3, 4, 6, 7) through the app's `Router`: each test calls the view model action and checks the route pushed onto `Router.path`. That covers where each action leads, but not the tap itself, because the template has no UI test target. Hand check on the simulator: tapping Settings, a category tile, the search entry and the Cart button opens that screen.
