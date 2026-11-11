# Design

## Direction

A **Caldera Navy** editorial system: ivory grounds, deep navy as the brand colour, champagne gold as the accent, and warm stone as a secondary surface. Photography keeps its own colour; overlays are navy scrims, not a tinted wash. The product should feel like a private wedding atelier crossed with a destination-hospitality magazine — cinematic photography first, tools second. Glassmorphism is used with restraint: frosted bars and floating panels over imagery, never as decoration for its own sake.

## Consistency

`contracts/app.json` `"consistency"` is `strict`. Same features, screens and behavior on every platform, with native controls and navigation chrome.

## Same everywhere, native where it counts

| Same on every platform | Native to each platform |
|---|---|
| Features, flows and data | Navigation chrome (iOS tab bar, Android navigation bar, web glass site header) |
| Copy (contracts/strings) | Controls: pickers, switches, radio lists, date fields |
| Colors, spacing, radii, icon sizes and type scale (contracts/tokens.json) | Gestures, haptics and transitions |
| The typeface (Playfair Display via contracts/tokens.json `font`), including navigation titles, tab labels and bar-button text | The system back chevron glyph |
| Icons: the same drawing from one family (contracts/icons.json) | The system back chevron on iOS and other chrome icons |
| Screen structure and content order, including title alignment (leading on every platform) | Sheets, dialogs and menus |
| Glass panels over photography, editorial image-led Home | Native backdrop treatment: SwiftUI `.ultraThinMaterial`, Compose translucent surfaces, web `backdrop-blur` |
| Accessibility labels and test IDs | |

## Tokens

Defined in contracts/tokens.json and compiled into each app by `make gen`.

| Token | iOS | Android | Web (Tailwind) |
|---|---|---|---|
| Color `primary` (caldera navy `#1F3A4D`) | `AppColors.primary` | `AppTheme.colors.primary` | `bg-primary`, `text-primary` |
| Color `secondary` (warm stone `#D4C4B0`) | `AppColors.secondary` | `AppTheme.colors.secondary` | `bg-secondary`, `text-secondary` |
| Color `tertiary` (champagne `#C9A96A`) | `AppColors.tertiary` | `AppTheme.colors.tertiary` | `bg-tertiary`, `text-tertiary` |
| Color `background` (ivory `#F7F3EE`) | `AppColors.background` | `AppTheme.colors.background` | `bg-background` |
| Color `surfaceVariant` (warm stone `#E4E0D8`) | `AppColors.surfaceVariant` | `AppTheme.colors.surfaceVariant` | `bg-surface-variant` |
| Color `onBackground` (ink `#1B2429`) | `AppColors.onBackground` | `AppTheme.colors.onBackground` | `text-on-background` |
| Type `hero` | `AppTypography.hero` | `AppTypography.hero` | `text-hero` |
| Type `display` | `AppTypography.display` | `AppTypography.display` | `text-display` |
| Spacing `md` | `AppSpacing.md` | `AppSpacing.md` | `p-md`, `gap-md` |
| Radius `lg` | `AppRadius.lg` | `AppRadius.lg` | `rounded-lg` |
| Radius `xl` | `AppRadius.xl` | `AppRadius.xl` | `rounded-xl` |
| Icon size `md` | `AppIconSize.md` | `AppIconSize.md` | `size-icon-md` |
| Size `touchTarget` | `AppSize.touchTarget` | `AppSize.touchTarget` | `size-touch-target`, `min-h-touch-target` |
| Motion `snappy` (a spring) | `AppMotion.snappy` | `AppMotion.snappy()` | `ease-snappy duration-snappy` |
| Motion `standard` curve, `cinematic` duration | `AppMotion.standard(AppMotion.cinematic)` | `AppMotion.standard(AppMotion.cinematic)` | `ease-standard duration-cinematic` |
| Elevation `low` | `.shadow(AppElevation.low)` | `Modifier.shadow(AppElevation.low, shape)` | `shadow-low` |
| Elevation `glow` | `.shadow(AppElevation.glow)` | `Modifier.shadow(AppElevation.glow, shape)` | `shadow-glow` |

**Color roles.** Every color has a light and a dark value. Add new colors by role (what they're for), not by hue.

- `background` / `onBackground`: screens.
- `surface` / `onSurface`: cards and grouped content on a screen.
- `surfaceVariant` / `onSurfaceVariant`: subtle fills and secondary text.
- `primary` / `onPrimary`: the brand colour, for primary actions and selection.
- `secondary` / `onSecondary`: blush accents, chips, and secondary fills.
- `tertiary` / `onTertiary`: champagne-gold highlights, rules, and premium details.
- `inverse` / `onInverse`: ivory text and espresso scrims on photography, identical in light and dark so overlay copy stays readable.
- `outline`: borders and dividers.
- `error` / `onError`: errors and destructive actions.

Dark mode keeps the same temperature: deep navy grounds, ivory text, a lifted sea-glass primary, and gold that still reads as jewellery rather than warning.

**Type roles.** `hero`, `display`, `headline`, `title`, `body`, `label`, `caption`. `hero` is for the Home headline only. Playfair Display is the single typeface: large serif headings, generous tracking in labels, and readable body text. Use italic only where the platform font file supports it; never introduce a second family.

**Motion.** Durations, easing curves and springs live in contracts/tokens.json `motion`. Luxury motion is cinematic and restrained: fade and ease, never bounce. `snappy` bounce is kept low. Every animation respects reduce-motion: iOS via `AppMotion.reduced(_:_:)`, Android via the system animation scale, web via `motion-safe:`. Image zoom on hover, glass panel entrance, and the Home photograph's slow scale use `standard` with `normal`, `slow`, or `cinematic`.

**Elevation.** `low` and `high` for floating chrome. `glow` is reserved and kept very quiet — primary actions do not use a coloured halo.

**Typeface.** Playfair Display, files in contracts/fonts. Navigation titles, tab labels and bar-button text use it and the token colors. The back chevron stays the system glyph.

**Icons.** Lucide, from contracts/icons.json. Icons in content use the icon size tokens; icons in navigation chrome take the platform's default size.

## Components

How each platform builds the shared patterns. Add a row whenever a new pattern appears.

| Pattern | iOS | Android | Web |
|---|---|---|---|
| Screen | Screen in a tab's `NavigationStack`. Home hides the system navigation bar so iOS 26+ Liquid Glass cannot frost the photograph; overlay chrome sits on the image. Inner screens use a leading large title on `background` | `Scaffold` with a `TopAppBar` on `background` (Material's `surface` role maps to `background`; cards use `surface`). Home draws edge-to-edge photography under overlay chrome, not a Material app bar | Page in the app shell. Home and destination/venue detail are full-bleed (`Page width="full"`). Lists and forms use `Page` (`width="readable"` or `full` for grids). The shell does not add side padding; each screen owns its inset |
| Screen title | Leading-aligned large title on inner screens. Home shows the brand in overlay type on the photograph, not in a system bar | `TopAppBar`, leading-aligned, on inner screens. Home uses overlay type over the hero | `h1` at the start of inner pages, left-aligned. Home's headline is the hero `h1` |
| Primary navigation | Tab bar: Home, Destinations, Venues, Experiences, My Wedding. Packages is pushed from Home, Destinations, or the Plan CTA | Navigation bar with the same five destinations. Packages is pushed the same way | Glass header: Home, Destinations, Venues, Experiences, Packages, My Wedding, plus Plan Your Wedding, in a row. Below `md`, a menu button opens those destinations in a side drawer |
| Glass panel | `AppColors.surface.opacity(0.82)` plus `.background(.ultraThinMaterial)` and a thin `outline` stroke, `AppRadius.xl` | Translucent `Surface` at `surface` with high alpha, `outline` border, `AppRadius.xl` | `bg-surface/80 backdrop-blur-md border border-outline/80 rounded-xl shadow-high` |
| Card | `AppCard`: `surface` fill, `AppRadius.lg`, optional image header | `AppCard`: `Surface` in `surface`, `AppRadius.lg` | `AppCard`: `bg-surface rounded-lg`. Editorial destination panels may be full-bleed photographs with a glass caption |
| Primary action | `.buttonStyle(.primary)`: `onPrimary` on `primary`, capsule | `Button` in `primary` with `onPrimary` label | `button` with `bg-primary text-on-primary rounded-full` |
| Secondary action | Capsule stroke in `primary` | Outlined button | `border border-primary text-primary rounded-full` |
| Photography | `AsyncImage` with a slow scale on appear; overlays use a gradient from `onBackground` | Coil `AsyncImage` with the same overlay treatment | `<img>` with `motion-safe:transition duration-slow ease-standard` and `hover:scale-[1.03]`. Hero uses a cinematic ken-burns scale |
| Icon | `Image(AppIcon.settings)` | `Icon(AppIcons.settings, contentDescription = ...)` | `<AppIcons.settings className="size-icon-md" />` |

## Accessibility

- Support Dynamic Type (iOS), font scaling (Android) and browser zoom (web).
- Every icon-only button has a label from contracts/strings.
- Touch targets are at least `touchTarget` (48) on every platform.
- Text meets WCAG AA contrast (4.5:1 for body text) in light and dark mode. Gold is decorative — never the only colour of body text.
- Photographs always sit under a scrim or glass caption so overlay text stays readable.
