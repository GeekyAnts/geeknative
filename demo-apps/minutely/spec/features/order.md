---
id: order
title: Order
status:
  ios: done
  android: done
  web: done
---

# Order

## Summary

Confirms a placed order: when it'll arrive, its number, its status, and what's in it.

## Data

```
OrderLine { productId: String, name: String, unit: String, emoji: String, categoryId: String, price: Int, mrp: Int, quantity: Int }
Order     { id: String, placedAt: Int (milliseconds since 1970), lines: [OrderLine], itemCount: Int, itemTotal: Int, savings: Int, deliveryFee: Int, toPay: Int }
```

- Lines copy the product's details at the time of ordering, so an order still reads correctly if the catalog changes.
- `id` is `"MN"` followed by `placedAt % 1000000`, zero-padded to 6 digits. For example, `placedAt` 1761800123456 → `MN123456`.
- `OrdersRepository`: `save(order)`, `order(id)` (or none). Stored on the device under the key `orders.history` as a JSON array of orders using exactly the field names above, newest first, keeping at most the 20 newest. Unreadable data counts as no orders. Implementations follow the cart's naming (`UserDefaultsOrdersRepository`, `DataStoreOrdersRepository`, `LocalStorageOrdersRepository`, `InMemoryOrdersRepository`).
- The view model that places orders takes a clock (a function returning the current time in milliseconds), so tests can fix `placedAt`.

## Screens and states

**Order placed**, title `order.title`, for one order id.

- **Found**, top to bottom:
  1. **Hero**, centered: the `orderPlaced` icon large in a `primary` circle (`onPrimary` icon) that scales in when the screen appears; `order.placedTitle` (headline); `order.placedBody` with `AppConfig.deliveryMinutes` (body, `onSurfaceVariant`); `order.number` in a `surfaceVariant` pill.
  2. **Status card**: `order.trackingTitle` (title), then a vertical timeline of four steps: `order.stepConfirmed` (done: filled `primary` dot with the `check` icon in `onPrimary`, icon size `sm`), `order.stepPacking` (current: `primary` ring, label bold), `order.stepOnTheWay` and `order.stepDelivered` (pending: `outline` ring, `onSurfaceVariant` label), joined by a line.
  3. **Summary card**: `order.summaryTitle` (title) and `common.itemCount`; a row per line: artwork tile; `order.lineQuantity` with the name and quantity (label) over the unit (caption, `onSurfaceVariant`), as on cart lines; and the line price; a divider; `order.total` → `toPay` in bold.
  4. A primary button `order.continueShopping` that returns to Home.
- **Not found** (unknown id): the `receipt` icon large, `order.notFoundTitle`, `order.notFoundBody` and `order.continueShopping`.
- Orders are local, so there's no loading or error state (web reads them after hydration; until then it shows nothing rather than the not-found state).

## Acceptance criteria

- AC-order-1: An order's id is `MN` and `placedAt % 1000000` zero-padded to 6 digits.
- AC-order-2: Saved orders survive a restart, stored under `orders.history`, newest first, at most 20.
- AC-order-3: Order placed shows the order number, the delivery time, each line and the total to pay.
- AC-order-4: An unknown order id shows the not-found state.
- AC-order-5: Continue shopping returns to Home.

## Copy

`order.*` (including `order.lineQuantity`, "Robusta Banana × 2"), `common.itemCount`, `common.price`. Icons: `orderPlaced`, `check`, `receipt`.

## Platform notes

- iOS: Cart is replaced by Order placed on the stack (the last path element is swapped), and Continue shopping clears the path. Plays a success haptic on appearing.
- Android: the back stack's Cart entry is replaced by `Route.OrderPlaced(orderId)`; Continue shopping pops back to Home.
- Web: navigating with `replace: true` to `/orders/$orderId`; Continue shopping links to `/`.

## Test IDs

- `order.number`, `order.total`, `order.line.<productId>`, `order.notFound`, `order.continueShopping`.

## Assumptions and open questions

- Assumption: the status is a static illustration of the first steps; live tracking needs a backend.
- iOS tests AC-order-5 through the `Router` (Continue shopping clears the path), not by tapping. Hand check on the simulator: tapping Continue shopping returns to Home.
