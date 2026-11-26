# Product

## In one sentence

Minutely is a quick commerce app: browse groceries and everyday essentials, fill a cart in a few taps, and get it delivered in about 10 minutes.

## Who it's for

City shoppers who've run out of something and want it now: milk before breakfast, snacks for guests, detergent on laundry day. They know what they want, so the app gets them from opening it to placing an order in under a minute.

## Features

| Feature | Spec | Summary |
|---|---|---|
| Home | [spec/features/home.md](spec/features/home.md) | Delivery promise and address, search entry, promo banner, categories and bestsellers |
| Catalog | [spec/features/catalog.md](spec/features/catalog.md) | The product and category data, the product card, and the Category screen |
| Search | [spec/features/search.md](spec/features/search.md) | Find products by name as you type |
| Cart | [spec/features/cart.md](spec/features/cart.md) | Quantities, the floating cart bar, bill details and placing an order |
| Order | [spec/features/order.md](spec/features/order.md) | Order placed confirmation, with status and summary |
| Settings | [spec/features/settings.md](spec/features/settings.md) | Appearance (System, Light, Dark) and app version |

## Platforms

| Platform | Built with | Minimum |
|---|---|---|
| iOS | SwiftUI | iOS 17 |
| Android | Kotlin, Jetpack Compose | Android 7.0 (API 24) |
| Web | React, TanStack Start | Safari 16.4, Chrome 111, Firefox 128 |

## Glossary

Domain terms, defined once. Code uses these exact names on every platform.

| Term | Meaning |
|---|---|
| Product | Something you can buy: name, unit, price, MRP, artwork and category. |
| Category | A group of products, such as Fruits & Vegetables. Each has a tint for its tiles. |
| Unit | The pack size shown under a product name, such as "500 ml" or "6 pcs". |
| Price | What the customer pays for one unit, in whole rupees. |
| MRP | Maximum retail price for one unit, in whole rupees. Always at least the price. |
| Discount | `(mrp - price) * 100 / mrp`, rounded down to a whole percent. Shown only when above 0. |
| Cart | The products the customer intends to buy, each with a quantity of 1 or more. |
| Cart line | One product in the cart and its quantity. |
| Item count | The sum of quantities in the cart. |
| Item total | The sum of price × quantity over the cart. |
| Savings | The sum of (MRP − price) × quantity over the cart. |
| Delivery fee | `AppConfig.deliveryFee` when the item total is below `AppConfig.freeDeliveryThreshold`, otherwise 0. |
| Order | A placed cart: its lines, totals and the time it was placed. |

## Out of scope

- Accounts, sign-in and saved addresses: the delivery address is fixed for now.
- Online payment: orders are paid on delivery.
- A backend: the catalog is bundled and the cart and orders are stored on the device.
- Live order tracking, order history screens, product detail screens, and stock limits.
