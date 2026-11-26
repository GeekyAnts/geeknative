# Design

## Direction

Wanderly looks like a printed travel magazine brought to a phone: large photographs first, then a few precise words. Off-white pages, forest-green actions and coral highlights. Cards are rounded, sit in soft shadow, and never compete with the image. Overlay titles on photos are set in the display type, with a dark scrim so they stay readable. Motion is short and smooth — cards ease in, images fade from a placeholder. The three screens that must feel exceptional are Home, City details and the generated Itinerary.

## Consistency

`contracts/app.json` `"consistency"` is `strict` or `adapted` (default `adapted`). See AGENTS.md, Consistency, for what the agent does under each tier.

- **strict:** the same features, screens and behavior on every platform, with no `n/a`. Controls and navigation chrome stay native.
- **adapted:** same flows, data, copy and brand. `n/a` and shipping one platform first are allowed when the spec says so.

This product is **strict**.

## Same everywhere, native where it counts

| Same on every platform | Native to each platform |
|---|---|
| Features, flows and data | Navigation chrome (tab bar, navigation bar, top app bar, site header) |
| Copy (contracts/strings) | Controls: pickers, switches, radio lists, segmented controls, date pickers |
| Colors, spacing, radii, icon sizes and type scale (contracts/tokens.json) | Gestures, haptics and transitions |
| The typeface (contracts/tokens.json `font`, files in contracts/fonts) | The font of navigation bars and system controls |
| Icons: the same drawing from one family (contracts/icons.json) | The system back chevron on iOS and other chrome icons |
| Screen structure and content order, including title alignment (leading on every platform) | Sheets, dialogs and menus |
| Accessibility labels and test IDs | |
| Photograph, name, rating and metadata on every destination and place card | How the image is fetched and cached |

## Tokens

Defined in contracts/tokens.json and compiled into each app by `make gen`.

| Token | iOS | Android | Web (Tailwind) |
|---|---|---|---|
| Color `primary` | `AppColors.primary` | `AppTheme.colors.primary` | `bg-primary`, `text-primary` |
| Color `onPrimary` | `AppColors.onPrimary` | `AppTheme.colors.onPrimary` | `text-on-primary` |
| Color `accent` | `AppColors.accent` | `AppTheme.colors.accent` | `bg-accent`, `text-accent` |
| Color `overlay` | `AppColors.overlay` | `AppTheme.colors.overlay` | `bg-overlay`, `text-overlay` |
| Spacing `md` | `AppSpacing.md` | `AppSpacing.md` | `p-md`, `gap-md` |
| Radius `lg` | `AppRadius.lg` | `AppRadius.lg` | `rounded-lg` |
| Radius `xl` | `AppRadius.xl` | `AppRadius.xl` | `rounded-xl` |
| Icon size `md` | `AppIconSize.md` | `AppIconSize.md` | `size-icon-md` |
| Size `touchTarget` | `AppSize.touchTarget` | `AppSize.touchTarget` | `size-touch-target`, `min-h-touch-target` |
| Size `featured` | `AppSize.featured` | `AppSize.featured` | `h-featured` (spacing token) |
| Size `hero` | `AppSize.hero` | `AppSize.hero` | `h-hero` |
| Size `placeHero` | `AppSize.placeHero` | `AppSize.placeHero` | `h-place-hero` |
| Size `cardImage` | `AppSize.cardImage` | `AppSize.cardImage` | `h-card-image` |
| Size `thumb` | `AppSize.thumb` | `AppSize.thumb` | `size-thumb` |
| Type `title` | `AppTypography.title` | `AppTypography.title` | `text-title` |
| Motion `snappy` (a spring) | `AppMotion.snappy` | `AppMotion.snappy()` | `ease-snappy duration-snappy` |
| Motion `standard` curve, `fast` duration | `AppMotion.standard(AppMotion.fast)` | `AppMotion.standard(AppMotion.fast)` | `ease-standard duration-fast` |
| Elevation `low` | `.shadow(AppElevation.low)` | `Modifier.shadow(AppElevation.low, shape)` | `shadow-low` |

**Color roles.** Every color has a light and a dark value. Add new colors by role (what they're for), not by hue.

- `background` / `onBackground`: screens. Off-white in light mode, deep forest night in dark mode.
- `surface` / `onSurface`: cards and grouped content on a screen.
- `surfaceVariant` / `onSurfaceVariant`: subtle fills, image placeholders and secondary text.
- `primary` / `onPrimary`: forest green — primary actions, selected chips, tab selection.
- `accent` / `onAccent`: coral — saved hearts, ratings, small highlights. Not for long body text.
- `overlay` / `onOverlay`: photo scrims and the text/icons drawn on photographs.
- `outline`: borders and dividers.
- `error` / `onError`: errors and destructive actions.

**Photo scrim.** Hero photographs draw a bottom-to-top gradient from `overlay` to transparent. Title and meta on the photo use `onOverlay`. The solid end of the gradient is the overlay color; platforms may fade it (the overlay token is already a dark green, not pure black).

**Type roles.** `display`, `headline`, `title`, `body`, `label`, `caption`. Overlay titles on featured and city heroes use `display`. Section headers on Home and City details use `headline` or `title`. Cards use `title` for the name and `caption`/`label` for location and rating.

**Motion.** Durations, easing curves and springs live in contracts/tokens.json `motion`. Image appearance fades with `standard`/`normal`. Card press and heart toggle use `snappy`. Every animation respects reduce-motion: skip fades and springs, swap images immediately.

**Elevation.** Destination, place and trip cards use `low`. The itinerary day's floating primary actions and the trip-planner generate button may use `high` if they sit above content. Image-led cards always carry a shadow so photography lifts off the off-white page.

**Typeface.** Outfit, for all three apps. Geometric and editorial without being thin. Navigation bar titles and system controls keep the platform font.

**Icons.** Lucide, from contracts/icons.json. Hearts for saved use `accent` when filled and `onSurfaceVariant` when empty.

## Components

How each platform builds the shared patterns. Add a row whenever a new pattern appears.

| Pattern | iOS | Android | Web |
|---|---|---|---|
| Screen | Screen in a `NavigationStack`, with a large navigation title | `Scaffold` with a `TopAppBar`, both on the `background` token (Material's `surface` role is mapped to `background`; only cards use `surface`) | Page in the app shell: the header and page span the window with `px-lg` (`md:px-xl`) side padding, and the screen's content is a `Page`: a centered readable column (`width="readable"`, the default) for forms, settings, lists and detail screens, or the full width (`width="full"`) for Home, Explore, City details, Place details and Itinerary |
| Screen title | Leading-aligned large title (the default; don't use `.navigationBarTitleDisplayMode(.inline)`). Image-hero screens (City, Place, Itinerary) hide the large title and put the name on the photograph; the nav bar stays transparent over the hero then returns to `background` as the user scrolls if the platform supports it, otherwise a leading-aligned inline title after the hero is acceptable | `TopAppBar`, leading-aligned. Same exception for image-hero screens: the name lives on the photo | `h1` at the start of the page, left-aligned — except image-hero screens, where the visible title is the overlay on the photo and the `h1` may be visually overlaid (still present for accessibility) |
| Tabs | `TabView` with five roots, each a `NavigationStack` | Material 3 `NavigationBar` on the five root screens; hidden on pushed screens (city, place, planner, itinerary, settings) | Site header with five text links plus the app name; always visible |
| Settings or form | `Form` with sections, on `background` with `surface` rows (`scrollContentBackground(.hidden)`) | Column with section headers | Sections in cards |
| Single choice | Inline `Picker` (checkmarks) | Radio buttons | Radio group |
| Multi choice (interests, categories) | Tappable chips, `primary` fill when selected | Same chips | Same chips |
| Card | `AppColors.surface` fill, `AppRadius.lg` (or `xl` for photo cards), `AppElevation.low` | `Surface` in `AppTheme.colors.surface`, matching radius and token shadow | `bg-surface rounded-lg` (photo cards `rounded-xl`) `shadow-low` |
| Photo card | Top-aligned image at `cardImage` height, `xl` corners clipping the image, name and meta below or overlaid on the image for featured/hero | Same | Same |
| Featured / city hero | Full-width image at `featured` (Home) or `hero` (City) height, `xl` corners, bottom scrim, `onOverlay` title | Same | Same; Home and City use `Page width="full"` |
| Primary action | `.buttonStyle(.primary)` | `Button` with primary container | `button` with `bg-primary text-on-primary` |
| Accent action (Save) | Heart icon button, `accent` when saved | Same | Same |
| Remote photo | `RemoteImage`: loads the catalog URL, shows `surfaceVariant` placeholder, then the image; on failure shows the catalog `fallbackImageUrl`, then a `surfaceVariant` block if that fails too. Uses URLCache | `RemoteImage` with Coil (allowed dependency for this product) and the same placeholder → image → fallback sequence | `RemoteImage` (`img` with `loading="lazy"`), same sequence, `object-cover` |
| Icon | `Image(AppIcon.settings)` (a template image) | `Icon(AppIcons.settings, contentDescription = ...)` | `<AppIcons.settings className="size-icon-md" />` |

**Content order on Home** (must match everywhere): search → featured destination → trending destinations (horizontal photographs) → explore by category → popular attractions → travel inspiration.

**Content order on City details:** hero → facts row (best time, weather, currency, language) → description → attractions → hotels → restaurants → activities → travel tips → sticky/primary Plan a Trip.

**Content order on Itinerary:** hero (destination cover + trip name/dates) → budget breakdown → day sections (date, then trip items with photo, time, duration, name, description, complete / move / remove).

## Accessibility

- Support Dynamic Type (iOS), font scaling (Android) and browser zoom (web).
- Every icon-only button has a label from contracts/strings.
- Touch targets are at least `touchTarget` (48) on every platform: above 44 pt on iOS and 44 px on web, and exactly 48 dp on Android. Use the token instead of a number. On web, aim for 44 px or more (WCAG 2.5.8 requires 24 px at least), as the header link and the radio rows do.
- Text meets WCAG AA contrast (4.5:1 for body text) in light and dark mode.
- Overlay titles sit on the scrim, never on a bright untreated photograph.
- Images that convey a place have an accessibility label of that place's name (catalog data, not a string key). Decorative placeholders are hidden from accessibility.
