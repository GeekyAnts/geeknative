---
id: cart
title: Cart
status:
  ios: done
  android: done
  web: done
---

# Cart

## Summary

What the customer is about to buy: quantities they can change anywhere, a floating bar that shows the running total, and a Cart screen with the bill and a Place order button.

## User stories

- As a shopper, I want to add things from any screen and always see my running total.
- As a shopper, I want to see exactly what I'll pay, and how close I am to free delivery, before I order.

## Data

`CartRepository` holds the cart for the whole app; every screen observes the same instance, so a change on one screen shows on all of them at once.

```
CartLine { productId: String, quantity: Int }   // quantity >= 1
```

- `lines`: observable, in the order products were first added.
- `quantity(productId)`: the line's quantity, or 0.
- `add(productId)`: +1; a new product is appended with quantity 1.
- `remove(productId)`: −1; at 0 the line is removed. Removing a product that isn't in the cart does nothing.
- `clear()`: empties the cart.

Stored on the device under the key `cart.items` as a JSON array, the same on every platform:

```json
[{"productId":"banana","quantity":2},{"productId":"milk","quantity":1}]
```

On load, lines whose product isn't in the catalog or whose quantity is below 1 are dropped, and unreadable data counts as an empty cart. If the remaining lines list the same product more than once, they are merged into one line at the position of the first, with their quantities added: `[{"productId":"banana","quantity":2},{"productId":"milk","quantity":1},{"productId":"banana","quantity":1}]` loads as banana × 3, milk × 1. The implementations are `UserDefaultsCartRepository` (iOS), `DataStoreCartRepository` (Android), `LocalStorageCartRepository` (web), and `InMemoryCartRepository` everywhere for previews and tests.

### Cart summary

Computed from the lines and the catalog (`CartSummary`, a pure function so every platform tests the same math):

| Field | Rule |
|---|---|
| `itemCount` | sum of quantities |
| `itemTotal` | sum of price × quantity |
| `mrpTotal` | sum of mrp × quantity |
| `savings` | `mrpTotal - itemTotal` |
| `deliveryFee` | 0 if the cart is empty or `itemTotal >= AppConfig.freeDeliveryThreshold`, else `AppConfig.deliveryFee` |
| `toPay` | `itemTotal + deliveryFee` |
| `amountToFreeDelivery` | `max(0, AppConfig.freeDeliveryThreshold - itemTotal)` |

## Screens and states

**Cart bar** (component `CartBar`), floating at the bottom of Home, Category and Search when `itemCount > 0`:

- A `primary` / `onPrimary` bar with `AppRadius.lg` corners and a soft shadow, inset by `AppSpacing.lg` from the screen edges and above the system's bottom inset.
- Leading: the `cart` icon in a slightly lighter circle, then two lines: `common.itemCount` (caption) and the item total, `common.price` (title weight).
- Trailing: `cartBar.viewCart` (label, bold) and the `chevronRight` icon.
- The whole bar is one button that opens Cart. It slides in from the bottom when the first item is added.

**Cart**, title `cart.title`:

- **Empty**: a large `cart` icon in a `surfaceVariant` circle, `cart.emptyTitle` (title), `cart.emptyBody` (body, `onSurfaceVariant`) and a primary button `cart.startShopping` that returns to Home.
- **With items**, scrolling, top to bottom:
  1. **Delivery card**: the `delivery` icon in an `accent` circle; `common.deliveryIn` (title) and `cart.shipment` (caption, `onSurfaceVariant`).
  2. **Lines card**: a row per line: a small artwork tile (emoji on the category tint), the name (label, up to 2 lines) and unit (caption), the `QuantityStepper`, and at the trailing edge the line price (price × quantity) with the line MRP struck through when it's higher.
  3. **Free delivery card**: below the threshold, `cart.freeDeliveryNudge` with `amountToFreeDelivery` and a progress bar filled to `itemTotal / freeDeliveryThreshold` in `primary` on `surfaceVariant`; at or above it, `cart.freeDeliveryUnlocked` in `primary` and a full bar.
  4. **Bill card**: `cart.billTitle` (title). Rows: `cart.itemTotal` → item total, followed by the MRP total struck through when there are savings (the price first, then the struck MRP, as everywhere: DESIGN.md, Money); `cart.deliveryFee` → `cart.free` in `primary` when 0, otherwise the fee; a divider; `cart.toPay` → `toPay`, both bold. When `savings > 0`, a strip below: the `savings` icon and `cart.savings`, in `primary`, on `surfaceVariant`.
  5. **Address card**: the `location` icon, `cart.deliverTo` (caption) and `common.deliveryAddress` (body).
  6. **Checkout bar**, pinned to the bottom on `surface` with a top `outline` border: leading, `toPay` (title) over `cart.paymentNote` (caption); trailing, a large primary button `cart.placeOrder`.

## Behavior and rules

- The stepper on a cart line changes the same cart as the product cards. Decreasing a line to 0 removes it, and removing the last line shows the empty state.
- Placing an order (`CartViewModel.placeOrder`) builds an Order from the current lines and summary (spec/features/order.md), saves it with `OrdersRepository`, clears the cart, and replaces Cart with Order placed for that order.
- Place order is disabled while an order is being placed, so a double tap places one order.

## Acceptance criteria

- AC-cart-1: `add` appends a new product with quantity 1 or increases an existing one; `remove` decreases it and removes the line at 0.
- AC-cart-2: The cart survives a restart, stored under `cart.items` in the JSON above; unknown products, quantities below 1 and unreadable data are dropped, and duplicate lines for one product are merged by adding their quantities.
- AC-cart-3: The summary's `itemCount`, `itemTotal`, `mrpTotal` and `savings` follow the rules above.
- AC-cart-4: Delivery is free at or above `AppConfig.freeDeliveryThreshold` and costs `AppConfig.deliveryFee` below it; `toPay` and `amountToFreeDelivery` follow the rules above.
- AC-cart-5: The cart bar shows only when the cart isn't empty, shows the item count and item total, and opens Cart.
- AC-cart-6: An empty Cart shows the empty state, and Start shopping returns to Home.
- AC-cart-7: Placing an order saves an order with the cart's lines and totals, empties the cart, and opens Order placed for that order.

Worked example for tests (threshold 199, fee 25): banana × 2 and milk × 1 → itemCount 3, itemTotal 126, mrpTotal 148, savings 22, deliveryFee 25, toPay 151, amountToFreeDelivery 73. Adding detergent × 1 → itemTotal 325, deliveryFee 0, toPay 325, amountToFreeDelivery 0.

## Copy

`cartBar.viewCart`, `cart.*`, `common.itemCount`, `common.price`, `common.mrp` (the accessibility label of the struck line MRP and MRP total), `common.inCart` (the cart line stepper's count, see spec/features/catalog.md), `common.deliveryIn`, `common.deliveryAddress`.

## Platform notes

- iOS: the cart bar and the checkout bar sit in `.safeAreaInset(edge: .bottom)`. Placing an order plays a success haptic.
- Android: the cart bar sits in the `Scaffold`'s bottom slot with `AnimatedVisibility`; the checkout bar is the Cart `Scaffold`'s `bottomBar`; the top app bar has a back button labeled `common.back`.
- Web: the cart bar is fixed to the bottom of the viewport, centered and at most the content's width. The cart is in localStorage, so the server renders an empty cart and the stored cart appears once the page hydrates.

## Test IDs

- `cartBar`: the cart bar.
- `cart.empty`, `cart.startShopping`: the empty state and its button.
- `cart.line.<productId>`: a cart line (its stepper uses the `product.<productId>.*` IDs).
- `cart.itemTotal`, `cart.deliveryFee`, `cart.toPay`, `cart.savings`, `cart.freeDelivery`: the bill values.
- `cart.placeOrder`: the Place order button.

## Assumptions and open questions

- Assumption: no coupons, tips, handling fee or taxes yet.
- Assumption: one fixed address and pay-on-delivery, so placing an order needs no further input.
- iOS tests AC-cart-5, 6 and 7 through view models and the `Router` (the route pushed, replaced or popped), not by tapping, because the template has no UI test target. Hand check on the simulator: tapping the cart bar opens Cart, Start shopping returns to Home, and Place order opens Order placed.
