---
id: search
title: Search
status:
  ios: done
  android: done
  web: done
---

# Search

## Summary

Find a product by typing part of its name or its category, with results updating as you type.

## Screens and states

**Search**, opened from Home's search entry.

- A search field with `search.placeholder`, focused when the screen opens, and a clear button (`clear` icon, labeled `search.clear`) while it has text.
- **Prompt** (the query is blank): the `search` icon large in a `surfaceVariant` circle, `search.promptTitle` (title) and `search.promptBody` (body, `onSurfaceVariant`), centered.
- **Results**: `search.resultCount` (label, `onSurfaceVariant`), then a two-column grid of product cards (the same card and Add behavior as everywhere else).
- **No results**: the `noResults` icon large, `search.noResultsTitle` with the trimmed query, and `search.noResultsBody`, centered.
- The cart bar when the cart isn't empty.
- Search is local and instant, so there's no loading or error state.

## Behavior and rules

`CatalogRepository.search(query)`:

1. Trim the query and lowercase it. If it's empty, return nothing (the screen shows the prompt).
2. Split it on whitespace into words.
3. A product matches when every word appears in `lowercase(name + " " + categoryName)`.
4. Return matches in catalog order.

Examples: `"MILK"` → milk. `"choco"` → cookies, chocolate. `"fruit"` → the 5 products in Fruits & Vegetables. `"salted chips"` → chips. `"xyz"` → nothing.

The query is not stored; leaving Search and coming back starts empty.

## Acceptance criteria

- AC-search-1: A blank (or whitespace-only) query shows the prompt and no results.
- AC-search-2: Results follow the matching rule above, case-insensitively, in catalog order (all five examples hold).
- AC-search-3: A query with no matches shows the no-results state, naming the query.
- AC-search-4: Results show the result count, and their Add buttons put products in the cart.

## Copy

`search.title`, `search.placeholder`, `search.clear`, `search.promptTitle`, `search.promptBody`, `search.noResultsTitle`, `search.noResultsBody`, `search.resultCount`.

## Platform notes

- iOS: the field is in the content at the top of the screen (not `.searchable`), styled like Home's search entry, so the two look the same; navigation title `search.title`, inline. Keyboard submit just dismisses the keyboard.
- Android: the field sits in the top app bar area, under a back button labeled `common.back`.
- Web: the page's `h1` is `search.title`, visually hidden (`sr-only`), because the search field leads the page. The query is kept in the URL (`/search?q=milk`) so results can be shared and survive a reload; it's replaced as you type, not pushed, so Back leaves Search.

## Test IDs

- `search.field`, `search.clear`, `search.prompt`, `search.empty`, `search.resultCount`.

## Assumptions and open questions

- Assumption: no typo tolerance and no recent searches yet.
- iOS tests AC-search-4 through the view models (Add changes the cart quantity), not by tapping. Hand check on the simulator: tapping Add on a result shows the stepper with 1.
