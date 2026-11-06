---
title: Design changes
description: How look-and-feel requests flow through DESIGN.md and design tokens into all three apps.
---

Requests about colors, type, spacing, corner radii, dark mode or "make it feel more ..." are **Design** requests. The agent follows `.geeknative/playbooks/design.md`.

## Tokens before code

Most visual changes are a change to `contracts/tokens.json` followed by `make gen`. Every app reads its colors, spacing, radii and type from the generated code, so one edit restyles all three:

| Token | iOS | Android | Web (Tailwind) |
|---|---|---|---|
| Color `primary` | `AppColors.primary` | `AppTheme.colors.primary` | `bg-primary`, `text-primary` |
| Color `onPrimary` | `AppColors.onPrimary` | `AppTheme.colors.onPrimary` | `text-on-primary` |
| Spacing `md` | `AppSpacing.md` | `AppSpacing.md` | `p-md`, `gap-md` |
| Radius `lg` | `AppRadius.lg` | `AppRadius.lg` | `rounded-lg` |
| Icon size `md` | `AppIconSize.md` | `AppIconSize.md` | `size-icon-md` |
| Type `title` | `AppTypography.title` | `AppTypography.title` | `text-title` |

Every color has a light and a dark value, and the agent keeps text readable in both (WCAG AA, 4.5:1 for body text).

## Direction first

For a broad request ("warmer", "more premium", "calmer"), the agent first updates the Direction section of DESIGN.md in a sentence or two. Later changes stay consistent with it.

## Roles, not hues

New colors are named by purpose (`success`, `warning`), not by hue (`green`). That keeps the meaning stable when the palette changes, and every app gets the new color on the next `make gen`.

The built-in roles are:

| Role | Used for |
|---|---|
| `background` / `onBackground` | Screens |
| `surface` / `onSurface` | Cards and grouped content on a screen |
| `surfaceVariant` / `onSurfaceVariant` | Subtle fills and secondary text |
| `primary` / `onPrimary` | The brand color, for primary actions and selection |
| `outline` | Borders and dividers |
| `error` / `onError` | Errors and destructive actions |

## Components

If a change affects a pattern (for example, every card gets a border), the agent updates the Components table in DESIGN.md, then changes that pattern in all three apps. The table records how each platform builds each shared pattern:

| Pattern | iOS | Android | Web |
|---|---|---|---|
| Screen | Screen in a `NavigationStack`, with a navigation title | `Scaffold` with a `TopAppBar` | Page in the app shell |
| Single choice | Inline `Picker` (checkmarks) | Radio buttons | Radio group |
| Card | `AppCard` | `AppCard` | `AppCard` |

## Stay native

Brand elements (color, type, spacing, imagery) change everywhere. Platform conventions stay native unless you explicitly ask otherwise: navigation bars, system controls, gestures and sheets. DESIGN.md's "Same everywhere, native where it counts" table lists which is which.

## Type and fonts

Typography tokens are roles: `display`, `headline`, `title`, `body`, `label` and `caption`, each with a size, line height and weight that every app uses. On iOS each also names the Dynamic Type style it scales with, on Android sizes are in sp and on web in rem, so text follows the user's text size setting everywhere. See the [contracts reference](/docs/reference/contracts/#tokensjson).

All three apps share one typeface. New projects start with Inter, and the same font files are bundled into each app. To change it, the agent runs `make font FAMILY="Open Sans"` (any Google Fonts family) and every app picks it up; `make font FAMILY=system` goes back to each platform's own font. Navigation bars and system controls keep the platform's font, as the "native where it counts" table says.

## Icons

Icons are named by meaning in `contracts/icons.json` and drawn from one family, Lucide, so the same icon looks the same on every platform: `make gen` turns each one into an asset-catalog image on iOS, a vector drawable on Android and an inline SVG component on the web. To add one, the agent picks a name at [lucide.dev](https://lucide.dev/icons); for artwork Lucide doesn't have, it drops a simple single-color SVG into `contracts/icons/`. Icons in content use the icon size tokens (`AppIconSize.md`, `size-icon-md`); a wrong name fails `make gen` instead of a build.

## Check the result

The agent runs `make check`, and if it can, launches the apps with `make run-ios`, `make run-android` and `make run-web` to look at the result.
