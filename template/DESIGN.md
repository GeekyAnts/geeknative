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
| Colors, spacing, radii and type scale (contracts/tokens.json) | Gestures, haptics and transitions |
| Icons by meaning (contracts/icons.json) | Icon artwork: SF Symbols, Material icons, Lucide |
| Screen structure and content order | Sheets, dialogs and menus |
| Accessibility labels and test IDs | System font (SF Pro, Roboto, the browser's system font) |

## Tokens

Defined in contracts/tokens.json and compiled into each app by `make gen`.

| Token | iOS | Android | Web (Tailwind) |
|---|---|---|---|
| Color `primary` | `AppColors.primary` | `AppTheme.colors.primary` | `bg-primary`, `text-primary` |
| Color `onPrimary` | `AppColors.onPrimary` | `AppTheme.colors.onPrimary` | `text-on-primary` |
| Spacing `md` | `AppSpacing.md` | `AppSpacing.md` | `p-md`, `gap-md` |
| Radius `lg` | `AppRadius.lg` | `AppRadius.lg` | `rounded-lg` |
| Type `title` | `AppTypography.title` | `AppTypography.title` | `text-title` |

**Color roles.** Every color has a light and a dark value. Add new colors by role (what they're for), not by hue.

- `background` / `onBackground`: screens.
- `surface` / `onSurface`: cards and grouped content on a screen.
- `surfaceVariant` / `onSurfaceVariant`: subtle fills and secondary text.
- `primary` / `onPrimary`: the brand color, for primary actions and selection.
- `outline`: borders and dividers.
- `error` / `onError`: errors and destructive actions.

**Type roles.** `display`, `headline`, `title`, `body`, `label`, `caption`. On iOS each maps to a Dynamic Type style; on Android and web, sizes scale with the user's font size setting.

**Fonts.** The apps use each platform's system font. Codegen doesn't support custom fonts yet.

## Components

How each platform builds the shared patterns. Add a row whenever a new pattern appears.

| Pattern | iOS | Android | Web |
|---|---|---|---|
| Screen | Screen in a `NavigationStack`, with a navigation title | `Scaffold` with a `TopAppBar`, both on the `background` token (Material's `surface` role is mapped to `background`; only cards use `surface`) | Page in the app shell (header and main) |
| Settings or form | `Form` with sections, on `background` with `surface` rows (`scrollContentBackground(.hidden)`) | Column with section headers | Sections in cards |
| Single choice | Inline `Picker` (checkmarks) | Radio buttons | Radio group |
| Card | `AppColors.surface` fill, `AppRadius.lg` corners | `Surface` in `AppTheme.colors.surface`, `AppRadius.lg` corners | `bg-surface rounded-lg` |
| Primary action | `.borderedProminent` button | `Button` | `button` with `bg-primary text-on-primary` |

## Accessibility

- Support Dynamic Type (iOS), font scaling (Android) and browser zoom (web).
- Every icon-only button has a label from contracts/strings.
- Touch targets are at least 44 pt on iOS and 48 dp on Android. On web, aim for 44 px or more (WCAG 2.5.8 requires 24 px at least), as the header link and the radio rows do.
- Text meets WCAG AA contrast (4.5:1 for body text) in light and dark mode.
