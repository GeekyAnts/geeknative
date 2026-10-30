---
title: Contracts
description: The format of every file in contracts/, its validation rules, and the code it generates on each platform.
---

`contracts/` holds everything that must be identical in all three apps. `make gen` validates it and generates platform code. Generated files are committed and never edited by hand.

## app.json

```json
{
  "name": "GeekNative",
  "id": "com.example.geeknative",
  "version": "1.0.0",
  "build": 1,
  "defaultLocale": "en"
}
```

| Field | Rule | Becomes |
|---|---|---|
| `name` | Not empty; no `$`, `//` or line breaks | The display name on iOS and Android, and the web page title |
| `id` | Reverse-DNS, like `com.acme.notes` | iOS bundle ID and Android application ID |
| `version` | Like `1.0.0` | iOS marketing version, Android `versionName` |
| `build` | A whole number, 1 or more | iOS build number, Android `versionCode` |
| `defaultLocale` | A language code like `en` or `pt-BR`; defaults to `en` | The source locale for strings |

In code: `AppIdentity.name` and `AppIdentity.version` (iOS), `AppIdentity.NAME` and `AppIdentity.VERSION` (Android), `AppIdentity.name` and `AppIdentity.version` (web).

## tokens.json

```json
{
  "color": {
    "primary": { "light": "#4F46E5", "dark": "#A5B4FC" },
    "onPrimary": { "light": "#FFFFFF", "dark": "#1E1B4B" }
  },
  "spacing": { "xs": 4, "sm": 8, "md": 12, "lg": 16, "xl": 24, "xxl": 32 },
  "radius": { "sm": 6, "md": 10, "lg": 16, "full": 9999 },
  "icon": { "sm": 16, "md": 24, "lg": 32 },
  "motion": {
    "duration": { "fast": 150, "normal": 250 },
    "easing": { "standard": [0.2, 0, 0, 1] },
    "spring": { "snappy": { "duration": 300, "bounce": 0.15 } }
  },
  "elevation": {
    "low": { "y": 1, "blur": 3, "opacity": 0.12 },
    "brand": { "y": 8, "blur": 24, "opacity": 0.3, "color": "primary" }
  },
  "typography": {
    "title": { "size": 20, "lineHeight": 26, "weight": 600, "ios": "title3", "android": "titleLarge" }
  },
  "font": {
    "family": "Inter",
    "files": { "400": "Inter-Regular.ttf", "600": "Inter-SemiBold.ttf" }
  }
}
```

**Names** are camelCase letters and digits starting lowercase, and can't be reserved words in Swift, Kotlin or TypeScript (like `default` or `class`).

**Colors** are `#RRGGBB` or `#RRGGBBAA`. `dark` is optional and defaults to `light`. These colors are required: `background`, `onBackground`, `surface`, `onSurface`, `surfaceVariant`, `onSurfaceVariant`, `primary`, `onPrimary`, `outline`, `error` and `onError`. You can add more.

**Spacing, radius and icon** values are numbers of points (iOS), dp (Android) or pixels (web). A radius of 9999 or more is fully rounded on the web. Icon sizes are the sizes icons are drawn at in content.

**Typography** entries need:

| Field | Rule |
|---|---|
| `size`, `lineHeight` | Positive numbers (points on iOS, sp on Android, converted to rem on web) |
| `weight` | 100, 200, ... 900. With a shared font, every weight used here needs a file under `font.files`. |
| `ios` | The Dynamic Type style it scales with: `largeTitle`, `title`, `title2`, `title3`, `headline`, `subheadline`, `body`, `callout`, `footnote`, `caption`, `caption2` |
| `android` | The Material 3 type style it fills: `displayLarge` to `displaySmall`, `headlineLarge` to `headlineSmall`, `titleLarge` to `titleSmall`, `bodyLarge` to `bodySmall`, `labelLarge` to `labelSmall` |

A `body` style is required. Every platform uses `size`; `lineHeight` applies on Android and web. On iOS the style scales relative to its Dynamic Type style, so text follows the user's text size setting.

**Motion** is optional. Names must be unique across its three groups.

| Group | Rule |
|---|---|
| `duration` | Positive numbers of milliseconds |
| `easing` | Four cubic-bezier numbers `[x1, y1, x2, y2]`, with x values from 0 to 1 |
| `spring` | `duration` in milliseconds and `bounce` from 0 up to (not including) 1, as SwiftUI defines them. Android gets the same spring as a damping ratio of `1 - bounce` and a stiffness of `(2π / duration)²`. The web gets a CSS `linear()` curve sampled from it, with the time the spring takes to settle as its duration. |

**Elevation** is optional: one shadow per name, with `y` (offset), `blur`, `opacity` (0 to 1) and an optional `color` naming a color token (black if left out). A tinted shadow follows dark mode.

**Font** is the typeface all three apps share:

| Field | Rule |
|---|---|
| `family` | The font's family name as the files carry it (`"Inter"`), or `"system"` for each platform's own font |
| `files` | A map from weight to a `.ttf` or `.otf` file in `contracts/fonts/`. Each file must really be that family and weight, and every weight the typography uses must be present. Not allowed with `"system"`. |
| `web` | Optional: a map from weight to a `.woff2` (or `.woff`) file to serve on the web instead of the mobile file |

`make font FAMILY="Open Sans"` downloads a Google Fonts family and fills this in; see the [CLI reference](/docs/reference/cli/#font). With `"system"`, each style's `size` must equal its iOS style's default size (`body` is 17, `subheadline` 15, `title3` 20, and so on), because iOS then takes the size from Dynamic Type.

### Generated

| Token | iOS | Android | Web |
|---|---|---|---|
| Colors | `AppColors.primary` (adapts to dark mode) and the global accent color | `AppTheme.colors.primary`, mapped onto Material 3 roles; `@color/token_primary` resources with night variants | `--color-primary` in a Tailwind `@theme`: `bg-primary`, `text-on-primary` |
| Spacing | `AppSpacing.md` | `AppSpacing.md` | `--spacing-md`: `p-md`, `gap-md`. Width utilities named like Tailwind's container sizes (`w-md`, `max-w-md`, `min-w-sm`) keep the container size, so `max-w-md` is 28rem, not 12px. For a spacing-sized width, write `w-(--spacing-md)`. |
| Radius | `AppRadius.lg` | `AppRadius.lg`, and Material 3 shapes | `--radius-lg`: `rounded-lg` |
| Icon sizes | `AppIconSize.md` | `AppIconSize.md` | `--spacing-icon-md`: `size-icon-md` |
| Type | `AppTypography.title`, as `Font.custom("Inter-SemiBold", size: 20, relativeTo: .title3)` | `AppTypography.title`, with `fontFamily = AppFontFamily`, and Material 3 typography | `--text-title`: `text-title` |
| Motion | `AppMotion.fast` (seconds), `AppMotion.standard(_:)` and `AppMotion.snappy` (`Animation`), and `AppMotion.reduced(_:_:)` for Reduce Motion | `AppMotion.fast` (ms), `AppMotion.standard<T>()` (`tween`), `AppMotion.standardEasing` and `AppMotion.snappy<T>()` (`spring`) | `--transition-duration-fast`, `--ease-standard`, `--ease-snappy`: `duration-fast`, `ease-standard`, `ease-snappy duration-snappy` |
| Elevation | `.shadow(AppElevation.low)` | `Modifier.shadow(AppElevation.low, shape)` (in the template's `AppTheme.kt`) | `--shadow-low`: `shadow-low` |
| Font | The files in `App/Generated/Fonts/`, registered at launch by `AppFonts.register()` (called from `AppMain`) | The files as `res/font/generated_*` resources behind `AppFontFamily` | The files in `src/generated/fonts/`, with one `@font-face` per weight and `--font-sans` set to the family |

With `"family": "system"`, `AppTypography.title` is `.title3.weight(.semibold)` on iOS, Android styles have no `fontFamily`, and `--font-sans` is the system stack.

On Android, screens and app bars sit on `background` (as on iOS) and `surface` is used for cards. A color named after another Material 3 role (like `secondary`) replaces that role's default. On the web, the theme also defines shadcn/ui's variable names (`foreground`, `card`, `muted`, `border`, ...) mapped onto the tokens, so shadcn/ui components pick up the design. Dark values apply when `<html>` has the `dark` class.

## strings/

One JSON file per locale: `contracts/strings/en.json`, `contracts/strings/fr.json`, and so on. The default locale's file (from `app.json`) is the source; other files translate its keys.

```json
{
  "settings.title": "Settings",
  "settings.about.version": "Version {version} ({build:int})",
  "notes.count": { "one": "{count} note", "other": "{count} notes" }
}
```

| Rule | Detail |
|---|---|
| Keys | Dot-separated camelCase words: `settings.appearance.title`. Two keys can't map to the same name. `app.name` isn't allowed (the name comes from `app.json`). |
| Placeholders | `{name}` is a string, `{name:int}` an integer. |
| Plurals | An object with `zero`, `one`, `two`, `few`, `many` and `other` forms. `other` is required, and the only placeholder allowed is `{count}`. A `zero` form is used for a count of 0 in every language on every platform, even where the language's plural rules have no zero category (English): iOS does this itself, and the generated web and Android code (`AppPlurals`) do it too. |
| Translations | Must use the same placeholders and plural shape as the source, and can't add keys the source doesn't have. Missing keys fall back to the source. |

### Generated

| Key | iOS | Android | Web |
|---|---|---|---|
| `settings.title` | `Strings.settingsTitle` | `stringResource(R.string.settings_title)` | `strings.settingsTitle` |
| `settings.about.version` | `Strings.settingsAboutVersion(version:build:)` | `stringResource(R.string.settings_about_version, version, build)` | `strings.settingsAboutVersion({ version, build })` |
| `notes.count` | `Strings.notesCount(count:)` | `AppPlurals.notesCount(count)` (or `AppPlurals.notesCount(resources, count)` outside composables) | `strings.notesCount(count)` |

Files: `App/Generated/Localizable.xcstrings` and `Strings.swift` on iOS; `res/values/generated_strings.xml` (plus `values-fr`, `values-pt-rBR`, `values-b+zh+Hans` and so on) on Android, which also gets `app_name`; `src/generated/strings.ts` on web, with `setLocale()`.

## icons.json

Every icon is drawn from the same shape data on all three platforms, so it looks the same everywhere.

```json
{
  "$family": "lucide",
  "settings": "settings",
  "back": { "icon": "arrow-left", "mirrored": true },
  "logo": { "svg": "logo.svg" }
}
```

| Field | Value |
|---|---|
| `$family` | The icon family names come from. Optional; `lucide` is the only one geeknative ships, with all of [Lucide's](https://lucide.dev/icons) icons built in. |
| `$strokeWidth` | Optional stroke width for the whole set, in Lucide's 24-unit grid (default 2) |
| A name: `"settings"` | A Lucide icon name. A name that isn't in the catalog fails `make gen`. |
| `{ "icon": "arrow-left", "mirrored": true }` | The same, flipped in right-to-left layouts |
| `{ "svg": "logo.svg" }` | Your own single-color SVG in `contracts/icons/`: a square `viewBox`, built from `path`, `circle`, `ellipse`, `rect`, `line`, `polyline` and `polygon`, without transforms, gradients, masks or text |

Icons take the current text color. In code: `Image(AppIcon.settings)` on iOS, `Icon(AppIcons.settings, contentDescription = ...)` on Android, and `<AppIcons.settings className="size-icon-md" />` on web.

### Generated

| Platform | Files |
|---|---|
| iOS | `App/Generated/Icons.xcassets`, one template image set per icon (vector data kept, so it scales); `Icons.swift` with an `ImageResource` per icon |
| Android | `res/drawable/generated_icon_<name>.xml` vector drawables (`autoMirrored` when mirrored); `Icons.kt` with an `ImageVector` per icon |
| Web | `src/generated/icons.tsx`: one inline SVG component per icon, with no icon library dependency |

## config.json

Settings that differ per environment, like a backend URL or a feature flag. Every environment's values are compiled into each app, and the build picks one.

```json
{
  "environments": ["development", "staging", "production"],
  "values": {
    "apiBaseUrl": {
      "type": "url",
      "description": "Base URL of the backend API.",
      "development": "http://localhost:8080",
      "staging": "https://staging.example.com",
      "production": "https://api.example.com"
    },
    "betaFeatures": { "type": "boolean", "development": true, "staging": true, "production": false }
  }
}
```

| Field | Rule |
|---|---|
| `environments` | A list of names. It must include `development` and `production`, which debug and release builds use by default. |
| `values` | Named settings. Names follow the same rules as token names. |
| `type` | `string`, `url` (absolute, like `https://api.example.com`), `boolean` or `int` |
| `description` | Optional. Becomes a doc comment on every platform. |
| One key per environment | Required for every value. There is no fallback between environments. |

The starter project declares the three environments above and no values, because it has no backend yet.

### Generated

| Value | iOS | Android | Web |
|---|---|---|---|
| Current environment | `AppEnvironment.current` | `AppEnvironment.current` | `environment` |
| `apiBaseUrl` | `AppConfig.apiBaseUrl` (a `URL`) | `AppConfig.apiBaseUrl` | `AppConfig.apiBaseUrl` |

Types map to `URL`, `String`, `Bool` and `Int` on iOS, `String`, `Boolean` and `Int` on Android, and `string`, `boolean` and `number` on the web.

### Choosing the environment

Debug builds use `development` and release builds use `production`. To build another environment:

| Platform | How |
|---|---|
| iOS | `APP_ENVIRONMENT` in `Config/Debug.xcconfig` and `Config/Release.xcconfig`. Override with `xcodebuild APP_ENVIRONMENT=staging`. |
| Android | `./gradlew -PappEnvironment=staging`. The value becomes `BuildConfig.APP_ENVIRONMENT`. |
| Web | The `VITE_APP_ENVIRONMENT` environment variable. Without it, the dev server uses `development` and a build uses `production`. |

An unknown environment name fails when the app starts, with a message listing the valid names.

### Secrets

Secrets are declared by name. Their values never go in `contracts/`.

```json
{
  "secrets": {
    "mapsApiKey": { "type": "string", "description": "Google Maps SDK key" }
  }
}
```

A secret's name becomes a key in `.env` at the project root: `mapsApiKey` is `MAPS_API_KEY`. `type` must be `"string"`. A secret with a `value` field is rejected, so a real key can't be committed by mistake. There is one value per key, not one per environment.

`make gen` reads `.env` and generates:

| Platform | Generated | Committed |
|---|---|---|
| iOS | `AppSecrets.mapsApiKey`, with the value written into `App/Generated/AppSecrets.swift` | No, it is git-ignored |
| Android | `AppSecrets.mapsApiKey`, with the value written into `generated/AppSecrets.kt` | No, it is git-ignored |
| Web | `AppSecrets.mapsApiKey` from `src/generated/secrets.server.ts`, which reads `process.env.MAPS_API_KEY` on the server | Yes, it holds names only |

The web module throws if it runs in the browser. Use it only in server functions and API routes.

`make gen` also writes `.env.example`, which lists every key and is committed. Copy it to `.env` and fill it in. If `.env` is missing a key, the value is empty and `make gen` prints a warning, so a fresh clone still builds. `make doctor` reports the same thing.

Mobile apps embed the values they are built with, so treat the built app as readable by anyone who has it. Keep keys that must stay private on a server.

## All generated files

| Platform | Files |
|---|---|
| iOS | `apps/ios/App/Generated/`: `AppIdentity.swift`, `AppConfig.swift`, `AppSecrets.swift` (only with secrets), `Tokens.swift`, `Strings.swift`, `Icons.swift`, `Localizable.xcstrings`, `Colors.xcassets` (accent color), `Icons.xcassets`, `Fonts/`; `apps/ios/Config/Identity.xcconfig` |
| Project root | `.env.example` (only with secrets) |
| Android | `apps/android/app/src/main/kotlin/app/generated/`: `AppIdentity.kt`, `AppConfig.kt`, `AppSecrets.kt` (only with secrets), `Tokens.kt`, `Icons.kt`; `res/values/generated_colors.xml`, `res/values-night/generated_colors.xml`, `res/values*/generated_strings.xml`, `res/drawable/generated_icon_*.xml`, `res/font/generated_*`; `apps/android/app/identity.properties` |
| Web | `apps/web/src/generated/`: `app.ts`, `config.ts`, `secrets.server.ts` (only with secrets), `tokens.css`, `strings.ts`, `icons.tsx`, `fonts/` |

## Validation errors

Problems are reported with the file and field, so an agent can fix them directly:

```text
✖ contracts/tokens.json color.primary.light must be a hex color like "#4F46E5" or "#4F46E5CC" (got "#4F46E").
✖ contracts/strings/fr.json "settings.about.version" must use the same placeholders and plural shape as en.json.
✖ contracts/config.json values.apiBaseUrl is missing a value for "staging". Every value needs every environment.
✖ contracts/config.json secrets.mapsApiKey has "value". Secrets are names only: put the value in .env as MAPS_API_KEY.
✖ contracts/icons.json "star" "sparkly-star" is not a Lucide icon. Browse https://lucide.dev/icons for names like "settings" or "arrow-left".
✖ contracts/fonts/Inter-Regular.ttf has weight 400, but font.files lists it under "500".
✖ contracts/tokens.json font "Inter" has no file for weight 600, which typography uses. Add "600" to font.files. Run `make font FAMILY="Inter"` to download the files and fill this in.
```
