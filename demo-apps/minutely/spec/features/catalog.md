---
id: catalog
title: Catalog
status:
  ios: done
  android: done
  web: done
---

# Catalog

## Summary

The products and categories the store sells, how a product is shown (the product card), and the Category screen that lists one category's products.

## User stories

- As a shopper, I want to browse a category so that I can see everything of one kind in one place.
- As a shopper, I want to add a product to my cart straight from where I see it, without opening another screen.

## Data

The catalog is bundled with each app and read through `CatalogRepository` (local implementation: `LocalCatalogRepository`). When a backend arrives, only the repository changes. Every app holds exactly this data, in this order.

```
Category { id: String, name: String, emoji: String }
Product  { id: String, name: String, unit: String, price: Int, mrp: Int, emoji: String, categoryId: String, isBestseller: Bool }
```

`CatalogRepository`:
- `categories()` → all categories, in the order below.
- `products(categoryId)` → that category's products, in the order below.
- `product(id)` → one product, or none.
- `bestsellers()` → products with `isBestseller`, in catalog order.
- `search(query)` → see spec/features/search.md.

Names, units and emoji are catalog data, not copy: they will come from a backend, so they live in the repository, not in contracts/strings.

### Categories

Each category's tile color is the token `tile<Id>`, for example `tileFruits`.

| id | name | emoji | tile token |
|---|---|---|---|
| `fruits` | Fruits & Vegetables | 🥦 | `tileFruits` |
| `dairy` | Dairy, Bread & Eggs | 🥛 | `tileDairy` |
| `snacks` | Snacks & Munchies | 🍿 | `tileSnacks` |
| `drinks` | Cold Drinks & Juices | 🧃 | `tileDrinks` |
| `household` | Cleaning Essentials | 🧽 | `tileHousehold` |
| `personal` | Personal Care | 🧴 | `tilePersonal` |

### Products

| id | name | unit | price | mrp | emoji | categoryId | bestseller |
|---|---|---|---|---|---|---|---|
| `banana` | Robusta Banana | 6 pcs | 49 | 60 | 🍌 | fruits | yes |
| `apple` | Shimla Apple | 4 pcs | 129 | 160 | 🍎 | fruits | yes |
| `tomato` | Hybrid Tomato | 500 g | 24 | 30 | 🍅 | fruits | no |
| `avocado` | Hass Avocado | 1 pc | 149 | 199 | 🥑 | fruits | no |
| `carrot` | Ooty Carrot | 500 g | 39 | 45 | 🥕 | fruits | no |
| `milk` | Toned Milk | 500 ml | 28 | 28 | 🥛 | dairy | yes |
| `eggs` | Farm Fresh Eggs | 6 pcs | 54 | 60 | 🥚 | dairy | no |
| `bread` | Whole Wheat Bread | 400 g | 45 | 50 | 🍞 | dairy | yes |
| `cheese` | Cheese Slices | 200 g | 135 | 150 | 🧀 | dairy | no |
| `butter` | Salted Butter | 100 g | 58 | 60 | 🧈 | dairy | no |
| `chips` | Classic Salted Chips | 52 g | 20 | 20 | 🍟 | snacks | no |
| `popcorn` | Butter Popcorn | 90 g | 45 | 55 | 🍿 | snacks | no |
| `cookies` | Choco Chip Cookies | 150 g | 60 | 75 | 🍪 | snacks | yes |
| `chocolate` | Dark Chocolate 70% | 100 g | 175 | 199 | 🍫 | snacks | yes |
| `pretzels` | Salted Pretzels | 100 g | 99 | 120 | 🥨 | snacks | no |
| `cola` | Cola Can | 300 ml | 40 | 40 | 🥤 | drinks | no |
| `orange-juice` | Fresh Orange Juice | 1 L | 125 | 150 | 🍊 | drinks | yes |
| `coconut-water` | Tender Coconut Water | 200 ml | 55 | 60 | 🥥 | drinks | no |
| `cold-brew` | Cold Brew Coffee | 250 ml | 120 | 150 | ☕ | drinks | no |
| `water` | Mineral Water | 1 L | 20 | 20 | 💧 | drinks | no |
| `sponges` | Scrub Sponges | 3 pcs | 49 | 60 | 🧽 | household | no |
| `detergent` | Liquid Detergent | 1 L | 199 | 249 | 🫧 | household | yes |
| `kitchen-towels` | Kitchen Towels | 2 rolls | 89 | 110 | 🧻 | household | no |
| `broom` | Soft Broom | 1 pc | 149 | 199 | 🧹 | household | no |
| `garbage-bags` | Garbage Bags | 30 pcs | 79 | 99 | 🗑️ | household | no |
| `toothpaste` | Herbal Toothpaste | 150 g | 95 | 110 | 🪥 | personal | no |
| `shampoo` | Daily Shampoo | 340 ml | 245 | 299 | 🧴 | personal | no |
| `soap` | Moisturising Soap | 4 × 100 g | 160 | 200 | 🧼 | personal | yes |
| `lip-balm` | Lip Balm | 4.5 g | 99 | 125 | 💄 | personal | no |
| `razor` | Classic Razor | 1 pc | 149 | 175 | 🪒 | personal | no |

## Screens and states

**Product card** (component `ProductCard`, used on Home, Category and Search)

- Artwork: the product's emoji, large and centered, on its category's tile color, with `AppRadius.lg` corners.
- When the discount is above 0, a badge in the top-leading corner of the artwork: `common.percentOff`, on `deal` / `onDeal`.
- Below the artwork: the unit (caption, `onSurfaceVariant`), the name (label weight, up to 2 lines), then the price (`common.price`, title-ish weight) and, when the MRP is higher, the MRP struck through after it (`common.price`, caption, `onSurfaceVariant`). Assistive technology reads the struck MRP as `common.mrp` ("MRP ₹60"), so it isn't mistaken for a second price.
- The add control (component `QuantityStepper`), at the trailing edge of the price row:
  - Quantity 0: an outlined `common.add` button in `primary`, labeled for accessibility with `common.addItem`.
  - Quantity 1 or more: a filled `primary` stepper: `remove` icon button, the quantity, `add` icon button. Labels: `common.decrease` and `common.increase`. The quantity's accessibility value is `common.inCart` ("2 in cart").
- Two cards per row in grids; fixed width in horizontal rails.

**Category tile** (component `CategoryTile`, used on Home)

- The category emoji on its tile color, with the category name below (caption or label, up to 2 lines, centered). Three per row.

**Category**, opened from a category tile on Home.

- Title: the category name.
- A horizontally scrolling row of category chips (every category, the current one selected). Choosing another chip switches the screen to that category without pushing a new screen.
- A two-column grid of that category's product cards.
- The cart bar (spec/features/cart.md) when the cart isn't empty.
- The catalog is local and always present, so there's no loading or error state; an unknown category id shows the first category.

## Behavior and rules

- Discount: `(mrp - price) * 100 / mrp` in integer arithmetic (rounded down). `mrp == price` means no badge and no struck-through MRP.
- Every product's quantity shown on a card is its cart quantity (spec/features/cart.md), so the same product shows the same quantity everywhere.

## Acceptance criteria

- AC-catalog-1: The catalog has the 6 categories and 30 products above, in that order, with those exact fields.
- AC-catalog-2: A product's discount is `(mrp - price) * 100 / mrp` rounded down, and no discount is shown when the MRP equals the price.
- AC-catalog-3: `bestsellers()` returns the 9 bestseller products in catalog order.
- AC-catalog-4: The Category screen lists exactly the chosen category's products, and choosing another chip shows that category's products.
- AC-catalog-5: Tapping Add on a product card puts one of that product in the cart, and the card then shows the stepper with quantity 1.

## Copy

`common.price`, `common.mrp` (accessibility label of every struck-through MRP), `common.percentOff`, `common.add`, `common.addItem`, `common.increase`, `common.decrease`, `common.inCart` (accessibility value of the stepper's count).

## Platform notes

- iOS: chips are a horizontal `ScrollView` of capsule buttons; the grid is a `LazyVGrid` with two flexible columns. Tapping a stepper button plays a light haptic (`.sensoryFeedback(.increase/.decrease)`). The count's accessibility label is the product name, with `common.inCart` as its value, so VoiceOver reads "Robusta Banana, 2 in cart".
- Android: chips are Material 3 `FilterChip`s in a `LazyRow`; the grid is a `LazyVerticalGrid` with two columns.
- Web: chips are links (`/category/$categoryId`), so each category has its own URL; the grid is CSS grid, two columns on narrow screens and up to four on wide ones.

## Test IDs

- `product.<productId>`: a product card.
- `product.<productId>.add`: its Add button.
- `product.<productId>.increase`, `product.<productId>.decrease`: its stepper buttons.
- `product.<productId>.quantity`: its visible quantity number (the `common.inCart` text is its accessibility value, not a separate element with an ID).
- `category.<categoryId>`: a category tile on Home.
- `category.chip.<categoryId>`: a chip on the Category screen.

## Assumptions and open questions

- Assumption: artwork is emoji for now, so the app needs no image hosting. A backend can replace `emoji` with an image URL later.
- Assumption: prices are whole rupees; no paise.
- Assumption: no stock limits or per-order maximums yet.
- iOS tests AC-catalog-4 and 5 through the view models (the chosen category, the cart quantity), not by tapping. Hand check on the simulator: tapping a chip switches the grid, and tapping Add shows the stepper with 1.
