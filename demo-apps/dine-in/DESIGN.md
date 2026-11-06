# Design

How the app looks and feels on every platform. Token values live in contracts/tokens.json; this file explains how they're used.

## Direction

**A private members' club for dining.** The visual language combines a five-star hotel, a fine-dining room and a luxury lifestyle magazine: warm ivory paper, espresso-brown leather, brushed-gold details, candlelit photography and frosted glass.

- **Colour balance: 65 / 25 / 10.** About 65% warm ivory and beige (`background`, `surface`, `surfaceVariant`), 25% chocolate and espresso brown (`primary`, `espresso`, photography scrims, primary buttons, selected chips), 10% gold and glass (`accent`, `glass*`): overlines, stars, the active tab, thin rules. Never paint whole screens brown in light mode; dark mode flips to an espresso room lit by gold.
- **Atmosphere, not flat paper.** Ivory screens sit on a warm wash: a `muted` radial at the leading-top, a whisper of `accent` at the trailing edge, and a fine grain so the field never reads as empty beige. Photography, espresso bands and glass still sit on top; the wash is only the page field.
- **Editorial, not a directory.** Discover reads like a magazine: a full-bleed hero photograph, large serif headlines, overlines in spaced capitals, a short gold rule under those overlines, generous but never empty space, horizontal carousels of tall photo cards, an editorial "concierge's pick" spread. Avoid grids of identical small cards, dashboards and dense lists.
- **Two typefaces.** Cormorant Garamond (serif) for headings and restaurant names; Manrope (sans) for everything you read quickly: descriptions, buttons, prices, labels. Uppercase overlines use generous letter spacing.
- **Glass with intent.** Frosted, translucent warm-white surfaces float over photography and content: the bottom tab bar, the floating search bar, the booking panels, buttons on images, the sticky Reserve bar. Each glass surface has a hairline `glassBorder` and a soft `espresso`-tinted shadow. Glass is for things that float; content cards are solid `surface`.
- **Photography first.** Every restaurant has distinct, warm, candlelit imagery. Images always sit under a warm gradient scrim when text overlaps them, and show a shimmering `surfaceVariant` skeleton while loading.
- **Calm, expensive motion.** Springs for things you touch, gentle fades and slide-ups for things that appear, parallax on hero photography. Nothing bounces for attention.

## Consistency Target

`strict` in contracts/app.json: strict 1:1 mirroring across all screens, identical layouts, minimal platform deviation. All features are implemented on all three platforms.

Because the brand calls for custom chrome (serif in-content titles, a floating glass tab bar, glass buttons over photography), the app draws its own navigation chrome on every platform instead of the system navigation bar and tab bar. What stays native: the push and back transitions and the back gesture, sheets and dialogs, text input and keyboard, the system share and calendar screens, haptics, and the font of system dialogs. See spec/decisions.md (2026-11-04).

## Same everywhere, native where it counts

| Same on every platform | Native to each platform |
|---|---|
| Features, flows, data and stored keys | Push/pop transitions and the system back gesture |
| Copy (contracts/strings), including date, time and price formats | Sheets, confirmation dialogs and menus |
| Colors, spacing, radii, icon sizes and type scale (contracts/tokens.json) | Text fields, keyboard and focus behaviour |
| Both typefaces: Manrope (contracts/tokens.json `font`) and Cormorant Garamond (contracts/fonts/display, copied by `make assets`) | Haptics, the share sheet, the add-to-calendar screen, opening Maps and the phone dialer |
| Icons (contracts/icons.json) | How backdrop blur is produced (see Glass surface) |
| Screen structure, content order and in-content titles (leading-aligned serif) | |
| The floating glass tab bar and glass buttons over images | |
| Accessibility labels and test IDs | |

## Tokens

Defined in contracts/tokens.json and compiled into each app by `make gen`.

| Token | iOS | Android | Web (Tailwind) |
|---|---|---|---|
| Color `primary` | `AppColors.primary` | `AppTheme.colors.primary` | `bg-primary`, `text-primary` |
| Color `espresso` | `AppColors.espresso` | `AppTheme.colors.espresso` | `bg-espresso`, `text-on-espresso` |
| Spacing `md` | `AppSpacing.md` | `AppSpacing.md` | `p-md`, `gap-md` |
| Radius `lg` | `AppRadius.lg` | `AppRadius.lg` | `rounded-lg` |
| Icon size `md` | `AppIconSize.md` | `AppIconSize.md` | `size-icon-md` |
| Size `heroHeight` | `AppSize.heroHeight` | `AppSize.heroHeight` | `h-hero-height` |
| Type `title` | `AppTypography.title` (sans) / `AppSerif.title` (serif) | `AppTypography.title` / `AppSerif.title` | `text-title` + `font-serif` for serif |
| Motion `snappy`, `gentle` (springs) | `AppMotion.snappy` | `AppMotion.snappy()` | `ease-snappy duration-snappy` |
| Elevation `low`, `high` | `.shadow(AppElevation.low)` | `Modifier.shadow(AppElevation.low, shape)` | `shadow-low` |

**Color roles.**

- `background` / `onBackground`: screens (warm ivory `#F5F0E8`).
- `surface` / `onSurface`: solid cards and grouped content.
- `surfaceVariant` / `onSurfaceVariant`: beige fills (`#EAE0D2`), skeletons and secondary text.
- `primary` / `onPrimary`: brown brand color for links, selection outlines and secondary buttons.
- `espresso` / `onEspresso`: deep brown for primary buttons, selected chips, the active tab pill and dark editorial bands.
- `accent` / `onAccent`: muted gold for overlines, stars, rules and small highlights. Never for large fills or body text.
- `muted`: muted beige for dividers on beige and decorative fills.
- `glass`, `glassStrong`, `glassBorder`: translucent warm-white floating surfaces and their hairline borders. `glassStrong` is the fallback where the platform can't blur.
- `glassOnImage` / `onGlassOnImage`: dark translucent circles and pills placed on photographs (favourite, back, gallery counter).
- `scrim`: the bottom of the warm gradient over photographs with text on them (top of the gradient is transparent).
- `success`, `warning`, `error` (with `on*`): availability (`success` available, `warning` few or full, `error` closed or failed), statuses and validation.
- `outline`: hairline borders and dividers.

**Type roles.** Serif (Cormorant Garamond): `hero` (Discover hero, confirmation title), `display` (screen titles), `headline` (restaurant name on detail, section headings in editorial spreads), `title` (section titles, card restaurant names). Sans (Manrope): `subtitle`, `body`, `label`, `caption`, `overline` (uppercase, letter spacing `size.tracking`).

The generated `AppTypography` styles use Manrope. Each app has a small `AppSerif` helper in its design system with the same role names (`hero`, `display`, `headline`, `title`) that uses the size and line height of the matching typography token with the Cormorant Garamond face: SemiBold (600) for those roles, Medium Italic (500) for the italic accent (`AppSerif.italic(role)`), used once per screen at most for an emphasised phrase. Fonts: iOS registers `Resources/Fonts/CormorantGaramond-*.ttf` at launch and uses PostScript names `CormorantGaramond-SemiBold`, `CormorantGaramond-Medium`, `CormorantGaramond-MediumItalic` with `relativeTo:` the token's Dynamic Type style; Android uses `R.font.display_semi_bold`, `display_medium`, `display_medium_italic`; web declares `@font-face` "Cormorant Garamond" from `src/assets/fonts/` and a Tailwind `--font-serif` theme variable, used as `font-serif`.

**Motion.** Durations and springs from contracts/tokens.json `motion`. `snappy` spring for presses, toggles, chip selection, the favourite heart and the tab pill; `gentle` spring for sheets, the reservation progress bar and the success check; `decelerate` + `normal` for content that appears (fade in while sliding up by `spacing.xl`, staggered by `duration.fast / 3` per item, max 6 items); `page` duration for the hero parallax settle. Cards scale to 0.97 while pressed. Every animation respects reduce-motion: iOS via `AppMotion.reduced`, Android via the system animation scale, web via `motion-safe:`.

**Elevation.** `low` for solid cards that need lift (rarely); `high` for floating glass (tab bar, Reserve bar, search bar, sheets). Both are tinted with `espresso`.

## Components

How each platform builds the shared patterns. Each lives in the app's design-system folder with the same name everywhere.

| Pattern | Spec | iOS | Android | Web |
|---|---|---|---|---|
| `AppSerif` | Serif text styles (see Type roles) | `Font` statics | `TextStyle` vals | `font-serif` + `text-<role>` |
| `Overline` | `overline` type, uppercase, tracking `size.tracking`, `accent` (or `onGlassOnImage` on photos) | View | Composable | Component |
| `GoldRule` | A short `accent` bar (`spacing.xxs` tall, `spacing.xxl` wide, full radius) under editorial overlines | View | Composable | Component |
| `SectionHeader` | `Overline`, `GoldRule`, then a serif `title`; optional trailing "See all" link (`common.seeAll`, `label`, `primary`) | View | Composable | Component |
| `GlassSurface` | `glass` fill + backdrop blur `size.blur`, `glassBorder` hairline, radius by use, `high` shadow when floating | `.ultraThinMaterial` under a `glass` tint | Backdrop blur where available (API 31+ via the Haze library); otherwise a solid `glassStrong` fill. Same border and shadow | `bg-glass backdrop-blur-xl border border-glass-border` |
| `RemoteImage` | Photo from a URL, `fill`/`crop`, `surfaceVariant` shimmering skeleton while loading, `surfaceVariant` + `utensils` icon on failure | `AsyncImage` with a shared `URLCache` | Coil `AsyncImage` | `<img loading="lazy" decoding="async">` with skeleton until `onLoad` |
| `PhotoScrim` | Vertical gradient from transparent to `scrim` over the lower 60% of a photo with text | `LinearGradient` | `Brush.verticalGradient` | `bg-linear-to-b from-transparent to-scrim` |
| `PrimaryButton` | Height `size.button`, full radius, `espresso` fill, `onEspresso` `label` text, optional leading icon, press scale 0.97, disabled at 40% opacity, a progress indicator replaces the label while busy | ButtonStyle | Composable | `button` |
| `SecondaryButton` | Same shape, transparent with `primary` hairline border and `primary` text | ButtonStyle | Composable | `button` |
| `GlassIconButton` | `size.touchTarget` circle, `glassOnImage` fill (on photos) or `glass` (on content), icon `md`, label from strings | View | Composable | `button` with `aria-label` |
| `Chip` | Height `size.chip`, full radius, `label` text, optional icon. Unselected: `surface` fill with an `accent` hairline at 40% (brass-edged). Selected: `espresso` fill, `onEspresso` text. Snappy spring on change | View | Composable | `button` with `aria-pressed` |
| `FavouriteButton` | `GlassIconButton` with `heart` → `heartFilled` in `accent`; on toggle the icon scales 1 → 1.25 → 1 (bouncy spring); labels `restaurant.save` / `restaurant.unsave` | View | Composable | Component |
| `RatingBadge` | `starFilled` (`accent`, icon `sm`) + rating with one decimal (`label`), accessibility label `restaurant.ratingLabel` | View | Composable | Component |
| `PriceLevel` | `format.price`'s symbol repeated `priceLevel` times in `onSurface`, the rest up to 4 in `outline`; accessibility `restaurant.priceLabel` | View | Composable | Component |
| `AvailabilityIndicator` | Dot (`size.xs`... spacing `sm` diameter) + `caption`: `success` available, `warning` full, `error` closed (strings `restaurant.availability.*`) | View | Composable | Component |
| `RestaurantCard` (featured) | `featuredCardWidth` × `featuredCardHeight`, radius `xl`, full-bleed photo, `PhotoScrim`, `FavouriteButton` top-trailing, bottom inset `md`: a `GlassSurface` (`strong`, radius `lg`) holding cuisine overline, serif `title` name, neighbourhood · rating · price, availability | View | Composable | Component |
| `RestaurantListItem` | Full-width solid `surface` card, radius `lg`, photo `listImageHeight` on top with `FavouriteButton`, then a `GoldRule`, serif name, `RatingBadge` + review count, cuisine · neighbourhood · `PriceLevel`, tagline (2 lines), `AvailabilityIndicator` | View | Composable | Component |
| `RestaurantGridItem` | Two columns on phones (three on web ≥ 768 px, four ≥ 1200 px): square photo radius `lg`, serif name (2 lines), rating + price | View | Composable | Component |
| `CollectionCard` | `collectionCardWidth` × `collectionCardHeight`, radius `lg`, photo, `PhotoScrim`, bottom inset `md`: a `GlassSurface` (`strong`, radius `md`) with serif `title` + `caption` subtitle | View | Composable | Component |
| `TabBar` | Floating capsule, `GlassSurface`, height `size.tabBar`, inset `lg` from the sides and bottom safe area, max width 480 centred. Five items: icon `md` + `caption` label. Active item: `espresso` pill behind it with `onEspresso` content, moving between items with the snappy spring | View | Composable | `nav` |
| `ScreenHeader` | In-content, leading-aligned: optional `Overline`, `GoldRule`, serif `display` title, optional `body` subtitle in `onSurfaceVariant` | View | Composable | `header` with `h1` |
| `TopBar` (pushed screens) | Transparent over content; leading `GlassIconButton` back (`common.back`); optional trailing actions; becomes `GlassSurface` with a serif `title` once content scrolls under it | View | Composable | Component |
| `StickyActionBar` | Bottom floating `GlassSurface` (radius `xl`, inset `lg`) holding a primary action and optional summary text | View | Composable | Component |
| `EmptyState` | Centered: `accent` icon `xl` in a `surfaceVariant` circle, serif `title`, `body` text, optional `PrimaryButton` | View | Composable | Component |
| `ErrorState` | `EmptyState` with `alert` icon, `common.errorTitle`, `common.errorBody` and a `common.retry` button | View | Composable | Component |
| `Skeleton` | `surfaceVariant` blocks with a slow shimmer (gentle highlight sweep, 1.2 s loop; static when reduce-motion) | View | Composable | Component |
| `DemoNote` | `info` icon `sm` + `caption` in `onSurfaceVariant` on a `surfaceVariant` rounded `md` band, with a `common.demoBadge` pill in `accent` | View | Composable | Component |
| Text field | Height `size.button`, radius `md`, `surface` fill, `outline` hairline, `primary` border when focused, `error` border + `caption` message when invalid, leading icon | `TextField` styled | `OutlinedTextField` styled | `input` styled |
| Confirmation dialog | Native | `.confirmationDialog` / `.alert` | `AlertDialog` | `<dialog>` |
| Sheet | Native | `.sheet` with `.presentationDetents` | `ModalBottomSheet` | `<dialog>` styled as a bottom sheet on narrow screens, centred panel on wide |

Screen layout. Every screen sits on `background`. Content side padding is `lg` on phones; on web the page is centred, `max-w-6xl` for Discover, Explore, Saved and Reservations and `max-w-3xl` for forms, Profile, Settings and detail text columns (`<Page>`), with photography allowed to go full width. Scrollable tab screens leave bottom padding of `tabBar + xl` so content clears the tab bar.

## Accessibility

- Support Dynamic Type (iOS), font scaling (Android) and browser zoom (web).
- Every icon-only button has a label from contracts/strings.
- Touch targets are at least `touchTarget` (48) on every platform.
- Text meets WCAG AA contrast in light and dark mode: text on photos always sits on `PhotoScrim` or `glassOnImage`.
- Decorative images have empty alt text; restaurant and dish photos are labelled with the restaurant or dish name.
- Respect reduce motion: parallax, shimmer and stagger turn off.
