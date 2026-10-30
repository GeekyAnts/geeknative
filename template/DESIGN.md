# Design

<!--
How the app looks and feels on every platform. Your coding agent updates this when you ask for
design changes. Token values live in contracts/tokens.json; this file explains how they're used.
-->

## Direction

_Not described yet. Describe the look you want (for example "calm and minimal" or "bold and playful") and your coding agent will set colors, type and spacing to match._

## Same everywhere, native where it counts

| Same on every platform | Native to each platform |
|---|---|
| Features, flows and data | Navigation chrome (navigation bar, top app bar, site header) |
| Copy (contracts/strings) | Controls: pickers, switches, radio lists, segmented controls |
| Colors, spacing, radii, icon sizes and type scale (contracts/tokens.json) | Gestures, haptics and transitions |
| The typeface (contracts/tokens.json `font`, files in contracts/fonts) | The font of navigation bars and system controls |
| Icons: the same drawing from one family (contracts/icons.json) | The system back chevron on iOS and other chrome icons |
| Screen structure and content order, including title alignment (leading on every platform) | Sheets, dialogs and menus |
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
| Motion `snappy` (a spring) | `AppMotion.snappy` | `AppMotion.snappy()` | `ease-snappy duration-snappy` |
| Motion `standard` curve, `fast` duration | `AppMotion.standard(AppMotion.fast)` | `AppMotion.standard(AppMotion.fast)` | `ease-standard duration-fast` |
| Elevation `low` | `.shadow(AppElevation.low)` | `Modifier.shadow(AppElevation.low, shape)` | `shadow-low` |

**Color roles.** Every color has a light and a dark value. Add new colors by role (what they're for), not by hue.

- `background` / `onBackground`: screens.
- `surface` / `onSurface`: cards and grouped content on a screen.
- `surfaceVariant` / `onSurfaceVariant`: subtle fills and secondary text.
- `primary` / `onPrimary`: the brand color, for primary actions and selection.
- `outline`: borders and dividers.
- `error` / `onError`: errors and destructive actions.

**Type roles.** `display`, `headline`, `title`, `body`, `label`, `caption`. Each has a size, line height and weight that every app uses. On iOS each role also names the Dynamic Type style it scales with; on Android sizes are sp and on web rem, so text follows the user's text size setting everywhere. Line height applies on Android and web (SwiftUI text takes its line spacing from the font).

**Motion.** Durations, easing curves and springs live in contracts/tokens.json `motion`, so an animation takes the same time and feels the same on every platform. Use a spring for things the user moves or toggles, `standard` for things that change on their own, `decelerate` for things that enter and `accelerate` for things that leave. Every animation respects the system's reduce-motion setting: iOS passes it through `AppMotion.reduced(_:_:)`, Android follows the system animation scale, and web wraps motion in `motion-safe:`. Which transitions a screen uses (push, sheet, fade) stays native.

**Elevation.** Shadows live in contracts/tokens.json `elevation`. Use them only for things that float above the content (a bottom bar, a floating button, a dragged card). A shadow can be tinted with a color token (`"color": "primary"`), so it follows dark mode.

**Typeface.** One font family for all three apps: `font.family` in contracts/tokens.json, with one file per weight in contracts/fonts. The starter uses Inter. To switch, run `make font FAMILY="Open Sans"` (any Google Fonts family) or `make font FAMILY=system` for each platform's own font; for a font that isn't on Google Fonts, put its .ttf files in contracts/fonts and list them under `font.files`. Every weight the type scale uses must have a file. Navigation bar titles and system controls keep the platform font. With `system`, iOS text sizes come from Dynamic Type, so each role's size must match its iOS style (`make gen` says so if not).

**Icons.** One family, Lucide, drawn identically on every platform from the same shape data: pick a name at https://lucide.dev/icons and add it to contracts/icons.json (`"settings": "settings"`). For artwork Lucide doesn't have, put a simple single-color SVG in contracts/icons and point at it (`"logo": { "svg": "logo.svg" }`). Mark directional icons `"mirrored": true` so they flip in right-to-left layouts. Icons in content use the icon size tokens; icons in navigation chrome take the platform's default size. Icons take the current text color.

## Components

How each platform builds the shared patterns. Add a row whenever a new pattern appears.

| Pattern | iOS | Android | Web |
|---|---|---|---|
| Screen | Screen in a `NavigationStack`, with a large navigation title | `Scaffold` with a `TopAppBar`, both on the `background` token (Material's `surface` role is mapped to `background`; only cards use `surface`) | Page in the app shell: the header and page span the window with `px-lg` (`md:px-xl`) side padding, and the screen's content is a `Page`: a centered readable column (`width="readable"`, the default) for forms, settings, lists and detail screens, or the full width (`width="full"`) for content that uses it, like grids and side-by-side panes |
| Screen title | Leading-aligned large title (the default; don't use `.navigationBarTitleDisplayMode(.inline)`) | `TopAppBar`, which is leading-aligned (not `CenterAlignedTopAppBar`) | `h1` at the start of the page, left-aligned |
| Settings or form | `Form` with sections, on `background` with `surface` rows (`scrollContentBackground(.hidden)`) | Column with section headers | Sections in cards |
| Single choice | Inline `Picker` (checkmarks) | Radio buttons | Radio group |
| Card | `AppColors.surface` fill, `AppRadius.lg` corners | `Surface` in `AppTheme.colors.surface`, `AppRadius.lg` corners | `bg-surface rounded-lg` |
| Primary action | `.borderedProminent` button | `Button` | `button` with `bg-primary text-on-primary` |
| Icon | `Image(AppIcon.settings)` (a template image) | `Icon(AppIcons.settings, contentDescription = ...)` | `<AppIcons.settings className="size-icon-md" />` |

## Accessibility

- Support Dynamic Type (iOS), font scaling (Android) and browser zoom (web).
- Every icon-only button has a label from contracts/strings.
- Touch targets are at least 44 pt on iOS and 48 dp on Android. On web, aim for 44 px or more (WCAG 2.5.8 requires 24 px at least), as the header link and the radio rows do.
- Text meets WCAG AA contrast (4.5:1 for body text) in light and dark mode.
