# Design

<!--
How the app looks and feels on every platform. Your coding agent updates this when you ask for
design changes. Token values live in contracts/tokens.json; this file explains how they're used.
-->

## Direction

**Fresh, fast and friendly.** A grocery store that feels like a well-lit market: a soft green-white background, crisp white cards, a deep fresh green for every action, and a sunny yellow that means "fast". Product artwork sits on pastel tiles, one tint per category, so shelves read at a glance. Type is Plus Jakarta Sans: rounded and warm, bold for prices and headlines.

- **Green is for doing.** `primary` marks every action the shopper takes: Add, the stepper, the cart bar, Place order, free delivery.
- **Yellow is for speed.** `accent` appears only next to the delivery promise (the `fast` and `delivery` icons and the banner's eyebrow).
- **Orange is for deals.** `deal` is only the discount badge.
- **Calm surfaces, generous space.** Cards are `surface` on `background` with `AppRadius.lg` corners and no borders; sections are separated by `AppSpacing.xl`. Shadows only on things that float (the cart bar).
- **Motion is quick and physical.** Steppers spring between Add and the count; the cart bar slides up; the Order placed check scales in. Nothing takes longer than 300 ms, and all motion respects the system's reduce-motion setting.

## Same everywhere, native where it counts

| Same on every platform | Native to each platform |
|---|---|
| Features, flows and data | Navigation chrome (navigation bar, top app bar, site header) |
| Copy (contracts/strings) | Controls: pickers, switches, radio lists, segmented controls |
| Colors, spacing, radii, icon sizes and type scale (contracts/tokens.json) | Gestures, haptics and transitions |
| The typeface (contracts/tokens.json `font`, files in contracts/fonts) | The font of navigation bars and system controls |
| Icons: the same drawing from one family (contracts/icons.json) | The system back chevron on iOS and other chrome icons |
| Screen structure and content order | Sheets, dialogs and menus |
| Accessibility labels and test IDs | |

## Tokens

Defined in contracts/tokens.json and compiled into each app by `make gen`.

| Token | iOS | Android | Web (Tailwind) |
|---|---|---|---|
| Color `primary` | `AppColors.primary` | `AppTheme.colors.primary` | `bg-primary`, `text-primary` |
| Color `onPrimary` | `AppColors.onPrimary` | `AppTheme.colors.onPrimary` | `text-on-primary` |
| Spacing `md` | `AppSpacing.md` | `AppSpacing.md` | `p-md`, `gap-md` |
| Radius `lg` | `AppRadius.lg` | `AppRadius.lg` | `rounded-lg` |
| Icon size `md` | `AppIconSize.md` | `AppIconSize.md` | `size-icon-md` |
| Type `title` | `AppTypography.title` | `AppTypography.title` | `text-title` |

**Color roles.** Every color has a light and a dark value. Add new colors by role (what they're for), not by hue.

- `background` / `onBackground`: screens.
- `surface` / `onSurface`: cards and grouped content on a screen.
- `surfaceVariant` / `onSurfaceVariant`: subtle fills and secondary text.
- `primary` / `onPrimary`: the brand color, for primary actions and selection.
- `outline`: borders and dividers.
- `error` / `onError`: errors and destructive actions.
- `accent` / `onAccent`: speed: the delivery promise's icon circle and the banner's eyebrow pill.
- `banner` / `onBanner`: the promo banner on Home.
- `deal` / `onDeal`: the discount badge on product cards.
- `tileFruits`, `tileDairy`, `tileSnacks`, `tileDrinks`, `tileHousehold`, `tilePersonal`: the pastel behind product and category artwork, one per category (`tile` + the category id with its first letter capitalized). Text on tiles uses `onSurface`.

**Type roles.** `display`, `headline`, `title`, `body`, `label`, `caption`. Each has a size, line height and weight that every app uses. On iOS each role also names the Dynamic Type style it scales with; on Android sizes are sp and on web rem, so text follows the user's text size setting everywhere. Line height applies on Android and web (SwiftUI text takes its line spacing from the font).

**Typeface.** One font family for all three apps: `font.family` in contracts/tokens.json, with one file per weight in contracts/fonts. The starter uses Inter. To switch, run `make font FAMILY="Open Sans"` (any Google Fonts family) or `make font FAMILY=system` for each platform's own font; for a font that isn't on Google Fonts, put its .ttf files in contracts/fonts and list them under `font.files`. Every weight the type scale uses must have a file. Navigation bar titles and system controls keep the platform font. With `system`, iOS text sizes come from Dynamic Type, so each role's size must match its iOS style (`make gen` says so if not).

**Artwork.** Product and category artwork is the catalog's emoji, centered on the category tint. Emoji are data from the catalog, not copy. Purely decorative emoji (the banner's 🛒) are hidden from assistive technology.

**Money.** Every amount is whole rupees, formatted with `common.price` ("₹49"). A struck-through MRP always follows the price it was reduced to, never precedes it.

**Icons.** One family, Lucide, drawn identically on every platform from the same shape data: pick a name at https://lucide.dev/icons and add it to contracts/icons.json (`"settings": "settings"`). For artwork Lucide doesn't have, put a simple single-color SVG in contracts/icons and point at it (`"logo": { "svg": "logo.svg" }`). Mark directional icons `"mirrored": true` so they flip in right-to-left layouts. Icons in content use the icon size tokens; icons in navigation chrome take the platform's default size. Icons take the current text color.

## Components

How each platform builds the shared patterns. Add a row whenever a new pattern appears.

| Pattern | iOS | Android | Web |
|---|---|---|---|
| Screen | Screen in a `NavigationStack`, with a navigation title | `Scaffold` with a `TopAppBar`, both on the `background` token (Material's `surface` role is mapped to `background`; only cards use `surface`) | Page in the app shell (header and main) |
| Settings or form | `Form` with sections, on `background` with `surface` rows (`scrollContentBackground(.hidden)`) | Column with section headers | Sections in cards |
| Single choice | Inline `Picker` (checkmarks) | Radio buttons | Radio group |
| Card | `AppColors.surface` fill, `AppRadius.lg` corners | `Surface` in `AppTheme.colors.surface`, `AppRadius.lg` corners | `bg-surface rounded-lg` |
| Primary action | `.borderedProminent` button | `Button` | `button` with `bg-primary text-on-primary` |
| Icon | `Image(AppIcon.settings)` (a template image) | `Icon(AppIcons.settings, contentDescription = ...)` | `<AppIcons.settings className="size-icon-md" />` |
| Product card | `ProductCard` view: artwork tile, discount badge, unit, name, price row with `QuantityStepper` | `ProductCard` composable | `ProductCard` component |
| Quantity stepper | `QuantityStepper`: outlined Add button, springs into a filled `primary` capsule with − count + | `QuantityStepper` with `AnimatedContent` | `QuantityStepper` with a CSS transition |
| Category tile | `CategoryTile`: emoji on its tint, name below | `CategoryTile` | `CategoryTile` (a link) |
| Cart bar | `CartBar` in `.safeAreaInset(edge: .bottom)` | `CartBar` in the `Scaffold` bottom slot, `AnimatedVisibility` | `CartBar`, fixed to the viewport bottom |
| Section header | `Text` in `AppTypography.title` | `Text` in `AppTypography.title` | `h2.text-title` |
| Field-shaped button (search entry) | `NavigationLink` styled as a capsule field | `Surface(onClick)` styled as a field | `Link` styled as a field |
| Empty state | Centered icon in a `surfaceVariant` circle, title, body, optional primary button | same | same |

## Accessibility

- Support Dynamic Type (iOS), font scaling (Android) and browser zoom (web).
- Every icon-only button has a label from contracts/strings.
- Touch targets are at least 44 pt on iOS and 48 dp on Android. On web, aim for 44 px or more (WCAG 2.5.8 requires 24 px at least), as the header link and the radio rows do.
- Text meets WCAG AA contrast (4.5:1 for body text) in light and dark mode.
