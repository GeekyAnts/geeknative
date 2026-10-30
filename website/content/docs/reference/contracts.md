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
  "typography": {
    "title": { "size": 20, "lineHeight": 26, "weight": 600, "ios": "title3", "android": "titleLarge" }
  },
  "font": { "family": "system" }
}
```

**Names** are camelCase letters and digits starting lowercase, and can't be reserved words in Swift, Kotlin or TypeScript (like `default` or `class`).

**Colors** are `#RRGGBB` or `#RRGGBBAA`. `dark` is optional and defaults to `light`. These colors are required: `background`, `onBackground`, `surface`, `onSurface`, `surfaceVariant`, `onSurfaceVariant`, `primary`, `onPrimary`, `outline`, `error` and `onError`. You can add more.

**Spacing and radius** values are numbers of points (iOS), dp (Android) or pixels (web). A radius of 9999 or more is fully rounded on the web.

**Typography** entries need:

| Field | Rule |
|---|---|
| `size`, `lineHeight` | Positive numbers (sp on Android, converted to rem on web) |
| `weight` | 100, 200, ... 900 |
| `ios` | The Dynamic Type style it maps to: `largeTitle`, `title`, `title2`, `title3`, `headline`, `subheadline`, `body`, `callout`, `footnote`, `caption`, `caption2` |
| `android` | The Material 3 type style it fills: `displayLarge` to `displaySmall`, `headlineLarge` to `headlineSmall`, `titleLarge` to `titleSmall`, `bodyLarge` to `bodySmall`, `labelLarge` to `labelSmall` |

A `body` style is required. On iOS, sizes come from Dynamic Type for the mapped style, so text follows the user's text size setting.

**Font family** must be `"system"` for now.

### Generated

| Token | iOS | Android | Web |
|---|---|---|---|
| Colors | `AppColors.primary` (adapts to dark mode) and the global accent color | `AppTheme.colors.primary`, mapped onto Material 3 roles; `@color/token_primary` resources with night variants | `--color-primary` in a Tailwind `@theme`: `bg-primary`, `text-on-primary` |
| Spacing | `AppSpacing.md` | `AppSpacing.md` | `--spacing-md`: `p-md`, `gap-md` |
| Radius | `AppRadius.lg` | `AppRadius.lg`, and Material 3 shapes | `--radius-lg`: `rounded-lg` |
| Type | `AppTypography.title` | `AppTypography.title`, and Material 3 typography | `--text-title`: `text-title` |

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
| Plurals | An object with `zero`, `one`, `two`, `few`, `many` and `other` forms. `other` is required, and the only placeholder allowed is `{count}`. |
| Translations | Must use the same placeholders and plural shape as the source, and can't add keys the source doesn't have. Missing keys fall back to the source. |

### Generated

| Key | iOS | Android | Web |
|---|---|---|---|
| `settings.title` | `Strings.settingsTitle` | `stringResource(R.string.settings_title)` | `strings.settingsTitle` |
| `settings.about.version` | `Strings.settingsAboutVersion(version:build:)` | `stringResource(R.string.settings_about_version, version, build)` | `strings.settingsAboutVersion({ version, build })` |
| `notes.count` | `Strings.notesCount(count:)` | `pluralStringResource(R.plurals.notes_count, count, count)` | `strings.notesCount(count)` |

Files: `App/Generated/Localizable.xcstrings` and `Strings.swift` on iOS; `res/values/generated_strings.xml` (plus `values-fr`, `values-pt-rBR`, `values-b+zh+Hans` and so on) on Android, which also gets `app_name`; `src/generated/strings.ts` on web, with `setLocale()`.

## icons.json

```json
{
  "settings": { "ios": "gearshape", "android": "Icons.Filled.Settings", "web": "Settings" },
  "back": { "ios": "chevron.backward", "android": "Icons.AutoMirrored.Filled.ArrowBack", "web": "ArrowLeft" }
}
```

| Field | Value |
|---|---|
| `ios` | An SF Symbol name |
| `android` | A Material icon: `Icons.Filled.Name`, `Icons.Outlined.Name`, `Icons.Rounded.Name`, `Icons.Sharp.Name` or `Icons.TwoTone.Name`, optionally with `AutoMirrored.` after `Icons.` |
| `web` | A Lucide icon component name, like `Settings` |

In code: `Image(systemName: AppIcon.settings)` on iOS, `Icon(AppIcons.settings, contentDescription = ...)` on Android, and `<AppIcons.settings className="size-6" />` on web.

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
| iOS | `apps/ios/App/Generated/`: `AppIdentity.swift`, `AppConfig.swift`, `AppSecrets.swift` (only with secrets), `Tokens.swift`, `Strings.swift`, `Icons.swift`, `Localizable.xcstrings`, `Colors.xcassets` (accent color); `apps/ios/Config/Identity.xcconfig` |
| Project root | `.env.example` (only with secrets) |
| Android | `apps/android/app/src/main/kotlin/app/generated/`: `AppIdentity.kt`, `AppConfig.kt`, `AppSecrets.kt` (only with secrets), `Tokens.kt`, `Icons.kt`; `res/values/generated_colors.xml`, `res/values-night/generated_colors.xml`, `res/values*/generated_strings.xml`; `apps/android/app/identity.properties` |
| Web | `apps/web/src/generated/`: `app.ts`, `config.ts`, `secrets.server.ts` (only with secrets), `tokens.css`, `strings.ts`, `icons.ts` |

## Validation errors

Problems are reported with the file and field, so an agent can fix them directly:

```text
✖ contracts/tokens.json color.primary.light must be a hex color like "#4F46E5" or "#4F46E5CC" (got "#4F46E").
✖ contracts/strings/fr.json "settings.about.version" must use the same placeholders and plural shape as en.json.
✖ contracts/config.json values.apiBaseUrl is missing a value for "staging". Every value needs every environment.
✖ contracts/config.json secrets.mapsApiKey has "value". Secrets are names only: put the value in .env as MAPS_API_KEY.
✖ contracts/icons.json "star" needs "android": a Material icon like "Icons.Filled.Settings" or "Icons.AutoMirrored.Filled.ArrowBack".
```
