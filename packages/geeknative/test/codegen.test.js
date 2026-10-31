import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { generate, generateAll } from '../src/codegen/index.js'
import { editJson, outputOf, TEMPLATE, tempProject } from './helpers.js'

test('generation is deterministic', () => {
  const run = () => generate(TEMPLATE).map((o) => [o.path, String(o.content)])
  assert.deepEqual(run(), run())
})

test('every app gets its generated files', () => {
  const paths = generate(TEMPLATE).map((o) => o.path)
  for (const expected of [
    'apps/ios/Config/Identity.xcconfig',
    'apps/ios/App/Generated/AppIdentity.swift',
    'apps/ios/App/Generated/Tokens.swift',
    'apps/ios/App/Generated/Strings.swift',
    'apps/ios/App/Generated/Localizable.xcstrings',
    'apps/ios/App/Generated/Icons.swift',
    'apps/ios/App/Generated/Icons.xcassets/icon/settings.imageset/settings.svg',
    'apps/ios/App/Generated/AppConfig.swift',
    'apps/ios/App/Generated/Colors.xcassets/AccentColor.colorset/Contents.json',
    'apps/android/app/identity.properties',
    'apps/android/app/src/main/kotlin/app/generated/AppIdentity.kt',
    'apps/android/app/src/main/kotlin/app/generated/Tokens.kt',
    'apps/android/app/src/main/kotlin/app/generated/Icons.kt',
    'apps/android/app/src/main/kotlin/app/generated/AppConfig.kt',
    'apps/android/app/src/main/res/values/generated_strings.xml',
    'apps/android/app/src/main/res/values/generated_colors.xml',
    'apps/android/app/src/main/res/values-night/generated_colors.xml',
    'apps/android/app/src/main/res/drawable/generated_icon_settings.xml',
    'apps/web/src/generated/app.ts',
    'apps/web/src/generated/tokens.css',
    'apps/web/src/generated/tokens.ts',
    'apps/web/src/generated/strings.ts',
    'apps/web/src/generated/icons.tsx',
    'apps/web/src/generated/config.ts',
  ]) {
    assert.ok(paths.includes(expected), `missing ${expected}`)
  }
})

test('app identity reaches every platform', () => {
  const dir = tempProject()
  editJson(path.join(dir, 'contracts', 'app.json'), (app) => {
    Object.assign(app, { name: 'Acme Notes', id: 'com.acme.notes', version: '2.1.0', build: 7 })
  })
  const outputs = generate(dir)

  const xcconfig = outputOf(outputs, 'Identity.xcconfig')
  assert.match(xcconfig, /^APP_DISPLAY_NAME = Acme Notes$/m)
  assert.match(xcconfig, /^APP_BUNDLE_ID = com\.acme\.notes$/m)
  assert.match(xcconfig, /^APP_VERSION = 2\.1\.0$/m)
  assert.match(xcconfig, /^APP_BUILD = 7$/m)

  const properties = outputOf(outputs, 'identity.properties')
  assert.match(properties, /^applicationId=com\.acme\.notes$/m)
  assert.match(properties, /^versionName=2\.1\.0$/m)
  assert.match(properties, /^versionCode=7$/m)

  assert.match(outputOf(outputs, 'AppIdentity.swift'), /static let name = "Acme Notes"/)
  assert.match(outputOf(outputs, 'AppIdentity.kt'), /const val NAME = "Acme Notes"/)
  assert.match(outputOf(outputs, 'generated/app.ts'), /name: "Acme Notes"/)
  assert.match(outputOf(outputs, 'values/generated_strings.xml'), /<string name="app_name" translatable="false">Acme Notes<\/string>/)
})

test('strings: placeholders become typed, positional arguments on each platform', () => {
  const outputs = generate(TEMPLATE)

  const swift = outputOf(outputs, 'Strings.swift')
  assert.match(swift, /static func settingsAboutVersion\(version: String, build: Int\) -> String/)
  assert.match(swift, /static var settingsTitle: String \{ NSLocalizedString\("settings\.title", comment: ""\) \}/)

  const catalog = JSON.parse(outputOf(outputs, 'Localizable.xcstrings'))
  assert.equal(catalog.sourceLanguage, 'en')
  assert.equal(catalog.strings['settings.about.version'].localizations.en.stringUnit.value, 'Version %1$@ (%2$lld)')
  assert.equal(catalog.strings['settings.title'].extractionState, 'manual')

  const xml = outputOf(outputs, 'values/generated_strings.xml')
  assert.match(xml, /<string name="settings_about_version">Version %1\$s \(%2\$d\)<\/string>/)
  assert.match(xml, /<string name="home_welcome_title">You\\'re all set<\/string>/)

  const ts = outputOf(outputs, 'generated/strings.ts')
  assert.match(ts, /settingsAboutVersion: \(args: \{ version: string; build: number \}\) => text\("settings\.about\.version", args\)/)
  assert.match(ts, /get settingsTitle\(\) \{/)
})

test('strings: special characters are escaped for each platform', () => {
  const dir = tempProject()
  editJson(path.join(dir, 'contracts', 'strings', 'en.json'), (strings) => {
    strings['notes.tricky'] = 'Save 50% & "quote" <b>'
  })
  const outputs = generate(dir)
  assert.match(
    outputOf(outputs, 'values/generated_strings.xml'),
    /<string name="notes_tricky" formatted="false">Save 50% &amp; \\"quote\\" &lt;b&gt;<\/string>/,
  )
  const catalog = JSON.parse(outputOf(outputs, 'Localizable.xcstrings'))
  assert.equal(catalog.strings['notes.tricky'].localizations.en.stringUnit.value, 'Save 50% & "quote" <b>')
  assert.match(outputOf(outputs, 'generated/strings.ts'), /"notes\.tricky": "Save 50% & \\"quote\\" <b>"/)
})

test('strings: plurals and extra locales', () => {
  const dir = tempProject()
  const strings = path.join(dir, 'contracts', 'strings')
  editJson(path.join(strings, 'en.json'), (en) => {
    en['notes.count'] = { one: '{count} note', other: '{count} notes' }
  })
  writeFileSync(
    path.join(strings, 'fr.json'),
    JSON.stringify({ 'settings.title': 'Réglages', 'notes.count': { one: '{count} note', other: '{count} notes' } }),
  )
  writeFileSync(path.join(strings, 'pt-BR.json'), JSON.stringify({ 'settings.title': 'Configurações' }))
  writeFileSync(path.join(strings, 'zh-Hans.json'), JSON.stringify({ 'settings.title': '设置' }))
  const outputs = generate(dir)
  const paths = outputs.map((o) => o.path)

  for (const folder of ['values-fr', 'values-pt-rBR', 'values-b+zh+Hans']) {
    assert.ok(paths.includes(`apps/android/app/src/main/res/${folder}/generated_strings.xml`), `missing ${folder}`)
  }
  assert.match(outputOf(outputs, 'values/generated_strings.xml'), /<plurals name="notes_count">\s*<item quantity="one">%1\$d note<\/item>/)
  assert.doesNotMatch(outputOf(outputs, 'values-fr/generated_strings.xml'), /app_name/)

  const catalog = JSON.parse(outputOf(outputs, 'Localizable.xcstrings'))
  assert.equal(catalog.strings['notes.count'].localizations.en.variations.plural.one.stringUnit.value, '%1$lld note')
  assert.equal(catalog.strings['settings.title'].localizations.fr.stringUnit.value, 'Réglages')

  assert.match(outputOf(outputs, 'Strings.swift'), /static func notesCount\(count: Int\) -> String/)
  const ts = outputOf(outputs, 'generated/strings.ts')
  assert.match(ts, /notesCount: \(count: number\) => plural\("notes\.count", count\)/)
  assert.match(ts, /export const locales = \["en","fr","pt-BR","zh-Hans"\] as const/)
})

test('strings: a zero form is used for a count of 0 on every platform, even in English', async () => {
  const dir = tempProject()
  editJson(path.join(dir, 'contracts', 'strings', 'en.json'), (en) => {
    en['events.count'] = { zero: 'No events', one: '{count} event', other: '{count} events' }
    en['notes.count'] = { one: '{count} note', other: '{count} notes' }
  })
  const outputs = generate(dir)

  // Android: <plurals> ignores "zero" in English, so AppPlurals picks a separate string for 0.
  const xml = outputOf(outputs, 'values/generated_strings.xml')
  assert.match(xml, /<string name="events_count_zero">No events<\/string>/)
  assert.doesNotMatch(xml, /notes_count_zero/, 'only plurals with a zero form get one')
  const kotlin = outputOf(outputs, 'AppPlurals.kt')
  assert.match(kotlin, /fun eventsCount\(count: Int\): String =\n\s+if \(count == 0\) stringResource\(R\.string\.events_count_zero, count\)/)
  assert.match(kotlin, /fun notesCount\(count: Int\): String = pluralStringResource\(R\.plurals\.notes_count, count, count\)/)

  // Web: Intl.PluralRules has no zero category in English, so plural() checks for 0 itself.
  const file = path.join(dir, 'strings.ts')
  writeFileSync(file, outputOf(outputs, 'generated/strings.ts'))
  const { strings } = await import(file)
  assert.equal(strings.eventsCount(0), 'No events')
  assert.equal(strings.eventsCount(1), '1 event')
  assert.equal(strings.eventsCount(2), '2 events')
  assert.equal(strings.notesCount(0), '0 notes')

  // iOS: the string catalog already uses "zero" for 0 in every language.
  const catalog = JSON.parse(outputOf(outputs, 'Localizable.xcstrings'))
  assert.equal(catalog.strings['events.count'].localizations.en.variations.plural.zero.stringUnit.value, 'No events')
})

test('strings: without plurals, no AppPlurals.kt is generated', () => {
  assert.ok(!generate(TEMPLATE).some((o) => o.path.endsWith('AppPlurals.kt')))
})

test('tokens: colors, spacing, radii and type on every platform', () => {
  const outputs = generate(TEMPLATE)

  const swift = outputOf(outputs, 'Tokens.swift')
  assert.match(swift, /static let primary = Color\(light: 0x4F46E5FF, dark: 0xA5B4FCFF\)/)
  assert.match(swift, /enum AppSpacing \{[\s\S]*static let md: CGFloat = 12/)
  assert.match(swift, /enum AppIconSize \{[\s\S]*static let md: CGFloat = 24/)
  assert.match(swift, /static let title: Font = \.custom\("Inter-SemiBold", size: 20, relativeTo: \.title3\)/)

  const kotlin = outputOf(outputs, 'Tokens.kt')
  assert.match(kotlin, /val LightAppColors = AppColorTokens\([\s\S]*primary = Color\(0xFF4F46E5\)/)
  assert.match(kotlin, /val DarkAppColors = AppColorTokens\([\s\S]*primary = Color\(0xFFA5B4FC\)/)
  assert.match(kotlin, /^\s+surface = background,$/m, 'Material surface follows the background token')
  assert.match(kotlin, /^\s+surfaceContainer = surface,$/m)
  assert.match(kotlin, /val md = 12\.dp/)
  assert.match(kotlin, /object AppIconSize \{[\s\S]*val md = 24\.dp/)
  assert.match(kotlin, /val title = TextStyle\(fontFamily = AppFontFamily, fontWeight = FontWeight\.SemiBold, fontSize = 20\.sp, lineHeight = 26\.sp\)/)
  assert.match(kotlin, /titleLarge = AppTypography\.title,/)

  const css = outputOf(outputs, 'tokens.css')
  assert.match(css, /@theme \{[\s\S]*--color-primary: #4f46e5;/)
  assert.match(css, /\.dark \{[\s\S]*--color-primary: #a5b4fc;/)
  assert.match(css, /--color-on-surface-variant: #566074;/)
  assert.match(css, /--spacing-md: 12px;/)
  assert.match(css, /--spacing-icon-md: 24px;/, 'icon sizes are spacing values, so size-icon-md works')
  assert.match(css, /--radius-full: calc\(infinity \* 1px\);/)
  assert.match(css, /--text-title: 1\.25rem;/)
  assert.match(css, /--color-foreground: var\(--color-on-background\);/, 'shadcn/ui aliases')

  assert.match(outputOf(outputs, 'values/generated_colors.xml'), /<color name="token_on_surface_variant">#FF566074<\/color>/)
  assert.match(outputOf(outputs, 'values-night/generated_colors.xml'), /<color name="token_primary">#FFA5B4FC<\/color>/)

  const accent = JSON.parse(outputOf(outputs, 'AccentColor.colorset/Contents.json'))
  assert.equal(accent.colors[0].color.components.red, '0x4F')
  assert.equal(accent.colors[1].appearances[0].value, 'dark')
})

test('tokens: spacing names never shrink Tailwind width utilities like max-w-md', () => {
  const css = outputOf(generate(TEMPLATE), 'tokens.css')
  // Tailwind looks up max-w-md in --max-width-* before --spacing-*, so these keep it a container width.
  for (const name of ['xs', 'sm', 'md', 'lg', 'xl']) {
    for (const prefix of ['width', 'min-width', 'max-width']) {
      assert.match(css, new RegExp(`--${prefix}-${name}: var\\(--container-${name}\\);`))
    }
  }
  assert.doesNotMatch(css, /--max-width-xxl/, 'names Tailwind has no container for are left alone')
  assert.match(css, /--spacing-md: 12px;/, 'padding and gaps still use the spacing tokens')
})

test('tokens: fixed sizes reach every platform, and share the web spacing scale safely', () => {
  const outputs = generate(TEMPLATE)
  assert.match(outputOf(outputs, 'Tokens.swift'), /enum AppSize \{\n    static let touchTarget: CGFloat = 48\n\}/)
  assert.match(outputOf(outputs, 'Tokens.kt'), /object AppSize \{\n    val touchTarget = 48\.dp\n\}/)
  assert.match(outputOf(outputs, 'tokens.css'), /--spacing-touch-target: 48px;/, 'size-touch-target, min-h-touch-target in Tailwind')

  for (const [size, message] of [
    [{ md: 40 }, /size\.md has the same name as spacing\.md/],
    [{ iconButton: 40 }, /size\.iconButton can't start with "icon"/],
  ]) {
    const root = tempProject()
    editJson(path.join(root, 'contracts', 'tokens.json'), (tokens) => (tokens.size = size))
    assert.throws(() => generate(root), message)
  }

  const root = tempProject()
  editJson(path.join(root, 'contracts', 'tokens.json'), (tokens) => delete tokens.size)
  assert.doesNotMatch(outputOf(generate(root), 'Tokens.swift'), /AppSize/, 'the group is optional')
})

test('tokens: text sizes and numeric tokens reach every platform as numbers', async () => {
  const outputs = generate(TEMPLATE)
  assert.match(outputOf(outputs, 'Tokens.swift'), /enum AppTextSize \{[\s\S]*static let title: CGFloat = 20/)
  assert.match(outputOf(outputs, 'Tokens.kt'), /object AppTextSize \{[\s\S]*val title = 20\.sp/)

  // The web gets the same numbers in TypeScript, not only as CSS.
  const dir = tempProject()
  const file = path.join(dir, 'tokens.ts')
  writeFileSync(file, outputOf(outputs, 'generated/tokens.ts'))
  const tokens = await import(file)
  assert.equal(tokens.AppTextSize.title, 20)
  assert.equal(tokens.AppSpacing.md, 12)
  assert.equal(tokens.AppIconSize.lg, 32)
  assert.equal(tokens.AppSize.touchTarget, 48)
})

test('fonts: the shared typeface reaches every platform from the same files', () => {
  const outputs = generate(TEMPLATE)

  const swift = outputOf(outputs, 'Tokens.swift')
  assert.match(swift, /static let body: Font = \.custom\("Inter-Regular", size: 16, relativeTo: \.body\)/)
  assert.match(swift, /enum AppFonts \{[\s\S]*"Inter-Regular\.ttf",\n\s+"Inter-Medium\.ttf",[\s\S]*CTFontManagerRegisterFontsForURL\(url as CFURL, \.process, nil\)/)

  const kotlin = outputOf(outputs, 'Tokens.kt')
  assert.match(kotlin, /^import app\.R$/m)
  assert.match(kotlin, /val AppFontFamily = FontFamily\(\n\s+Font\(R\.font\.generated_inter_regular, FontWeight\.Normal\),\n\s+Font\(R\.font\.generated_inter_medium, FontWeight\.Medium\),/)

  const css = outputOf(outputs, 'tokens.css')
  assert.match(css, /@font-face \{\n  font-family: 'Inter';\n  font-style: normal;\n  font-weight: 600;\n  font-display: swap;\n  src: url\('\.\/fonts\/Inter-SemiBold\.ttf'\) format\('truetype'\);\n\}/)
  assert.match(css, /--font-sans: 'Inter', ui-sans-serif, system-ui/)

  const regular = readFileSync(path.join(TEMPLATE, 'contracts', 'fonts', 'Inter-Regular.ttf'))
  for (const suffix of ['App/Generated/Fonts/Inter-Regular.ttf', 'res/font/generated_inter_regular.ttf', 'web/src/generated/fonts/Inter-Regular.ttf']) {
    const output = outputs.find((o) => o.path.endsWith(suffix))
    assert.ok(output && Buffer.isBuffer(output.content) && output.content.equals(regular), `${suffix} is the file from contracts/fonts`)
  }
})

test('fonts: with the system family each platform keeps its own font, sized by Dynamic Type on iOS', () => {
  const dir = tempProject()
  editJson(path.join(dir, 'contracts', 'tokens.json'), (tokens) => {
    tokens.font = { family: 'system' }
    tokens.typography.body.size = 17 // Dynamic Type's body
    tokens.typography.label.size = 15 // and subheadline
  })
  const outputs = generate(dir)
  const swift = outputOf(outputs, 'Tokens.swift')
  assert.match(swift, /static let title: Font = \.title3\.weight\(\.semibold\)/)
  assert.match(swift, /static let files: \[String\] = \[\]/)
  const kotlin = outputOf(outputs, 'Tokens.kt')
  assert.doesNotMatch(kotlin, /AppFontFamily|import app\.R/)
  assert.match(kotlin, /val title = TextStyle\(fontWeight = FontWeight\.SemiBold, fontSize = 20\.sp/)
  const css = outputOf(outputs, 'tokens.css')
  assert.doesNotMatch(css, /@font-face/)
  assert.match(css, /--font-sans: ui-sans-serif/)
  assert.ok(!outputs.some((o) => o.path.endsWith('.ttf')), 'no font files are copied')
})

test('tokens: a color without a dark value uses its light value in dark mode', () => {
  const dir = tempProject()
  editJson(path.join(dir, 'contracts', 'tokens.json'), (tokens) => {
    tokens.color.success = { light: '#16A34A' }
  })
  const outputs = generate(dir)
  assert.match(outputOf(outputs, 'Tokens.swift'), /static let success = Color\(light: 0x16A34AFF, dark: 0x16A34AFF\)/)
  assert.match(outputOf(outputs, 'Tokens.kt'), /val success: Color,/)
})

test('icons: one Lucide drawing reaches every platform', () => {
  const outputs = generate(TEMPLATE)
  const gear = 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0' // the circle in Lucide's "settings", as a path

  assert.match(outputOf(outputs, 'Icons.swift'), /static let settings = ImageResource\(name: "icon\/settings", bundle: \.main\)/)
  assert.match(outputOf(outputs, 'icon/settings.imageset/settings.svg'), new RegExp(`stroke="#000000" stroke-width="2"[\\s\\S]*<path d="${gear}"/>`))
  const imageset = JSON.parse(outputOf(outputs, 'icon/back.imageset/Contents.json'))
  assert.equal(imageset.properties['template-rendering-intent'], 'template')
  assert.equal(imageset.properties['preserves-vector-representation'], true)
  assert.equal(imageset.images[0]['language-direction'], 'left-to-right', 'back flips in right-to-left layouts')
  assert.equal(JSON.parse(outputOf(outputs, 'Icons.xcassets/icon/Contents.json')).properties['provides-namespace'], true)

  const kotlin = outputOf(outputs, 'Icons.kt')
  assert.match(kotlin, /import app\.R/)
  assert.match(kotlin, /val settings: ImageVector\n\s+@Composable get\(\) = ImageVector\.vectorResource\(R\.drawable\.generated_icon_settings\)/)
  assert.doesNotMatch(kotlin, /material\.icons/)
  const back = outputOf(outputs, 'drawable/generated_icon_back.xml')
  assert.match(back, /android:autoMirrored="true"/)
  assert.match(back, /android:strokeColor="#FF000000" android:strokeWidth="2" android:strokeLineCap="round"/)
  assert.doesNotMatch(outputOf(outputs, 'drawable/generated_icon_settings.xml'), /autoMirrored/)
  assert.match(outputOf(outputs, 'drawable/generated_icon_settings.xml'), new RegExp(`android:pathData="${gear}"`))

  const tsx = outputOf(outputs, 'generated/icons.tsx')
  assert.doesNotMatch(tsx, /lucide-react/)
  assert.match(tsx, /settings: \(props: IconProps\) => \(\n\s+<Icon box=\{24\} line=\{2\} \{\.\.\.props\}>/)
  assert.match(tsx, /back: \(props: IconProps\) => \(\n\s+<Icon box=\{24\} line=\{2\} mirrored \{\.\.\.props\}>/)
  assert.match(tsx, new RegExp(`<path d="${gear}" />`))
})

test('icons: a custom SVG in contracts/icons is drawn like any other icon', () => {
  const dir = tempProject()
  mkdirSync(path.join(dir, 'contracts', 'icons'))
  writeFileSync(
    path.join(dir, 'contracts', 'icons', 'logo.svg'),
    '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="8"/></svg>',
  )
  editJson(path.join(dir, 'contracts', 'icons.json'), (icons) => {
    icons.logo = { svg: 'logo.svg' }
  })
  const outputs = generate(dir)
  assert.match(outputOf(outputs, 'icon/logo.imageset/logo.svg'), /viewBox="0 0 48 48"[\s\S]*<path d="M8 0h32a8 8 0 0 1 8 8[^"]*" fill="#000000" stroke="none"\/>/)
  assert.match(outputOf(outputs, 'drawable/generated_icon_logo.xml'), /android:viewportWidth="48"[\s\S]*android:fillColor="#FF000000" \/>/)
  assert.match(outputOf(outputs, 'generated/icons.tsx'), /logo: \(props: IconProps\) => \(\n\s+<Icon box=\{48\} line=\{2\}/)
})

test('config: environments and typed values reach every platform', () => {
  const dir = tempProject()
  editJson(path.join(dir, 'contracts', 'config.json'), (config) => {
    config.values = {
      apiBaseUrl: { type: 'url', description: 'Backend API.', development: 'http://localhost:8080', staging: 'https://s.example.com', production: 'https://a.example.com' },
      betaFeatures: { type: 'boolean', development: true, staging: true, production: false },
      pageSize: { type: 'int', development: 10, staging: 20, production: 20 },
    }
  })
  const outputs = generate(dir)

  const swift = outputOf(outputs, 'AppConfig.swift')
  assert.match(swift, /#elseif APP_ENV_staging\n\s+return \.staging/)
  assert.match(swift, /\/\/\/ Backend API\.\n\s+static let apiBaseUrl: URL = \{/)
  assert.match(swift, /case \.development: return URL\(string: "http:\/\/localhost:8080"\)!/)
  assert.match(swift, /static let betaFeatures: Bool = \{[\s\S]*case \.production: return false/)
  assert.match(swift, /static let pageSize: Int = /)

  const kotlin = outputOf(outputs, 'AppConfig.kt')
  assert.match(kotlin, /DEVELOPMENT\("development"\), STAGING\("staging"\), PRODUCTION\("production"\);/)
  assert.match(kotlin, /import app\.BuildConfig/)
  assert.match(kotlin, /val apiBaseUrl: String = when \(AppEnvironment\.current\) \{\n\s+AppEnvironment\.DEVELOPMENT -> "http:\/\/localhost:8080"/)
  assert.match(kotlin, /val betaFeatures: Boolean = [\s\S]*AppEnvironment\.PRODUCTION -> false/)

  const ts = outputOf(outputs, 'generated/config.ts')
  assert.match(ts, /apiBaseUrl: pick<string>\(\{ development: "http:\/\/localhost:8080", staging: "https:\/\/s\.example\.com"/)
  assert.match(ts, /betaFeatures: pick<boolean>\(\{ development: true, staging: true, production: false \}\)/)
  assert.match(ts, /pageSize: pick<number>/)
  assert.match(ts, /VITE_APP_ENVIRONMENT \|\| /, 'an empty VITE_APP_ENVIRONMENT falls back to the default')
})

test('config: with no values, nothing unused is generated', () => {
  const outputs = generate(TEMPLATE)
  assert.match(outputOf(outputs, 'AppConfig.swift'), /enum AppConfig \{\}/)
  assert.match(outputOf(outputs, 'AppConfig.kt'), /object AppConfig \{\}/)
  // The web tsconfig sets noUnusedLocals, so an unused `pick` would fail the type-check.
  assert.doesNotMatch(outputOf(outputs, 'generated/config.ts'), /pick/)
})

/** A project that declares one secret, optionally with a .env. */
function projectWithSecret(env) {
  const dir = tempProject()
  editJson(path.join(dir, 'contracts', 'config.json'), (config) => {
    config.secrets = { mapsApiKey: { type: 'string', description: 'Google Maps SDK key' } }
  })
  if (env !== undefined) writeFileSync(path.join(dir, '.env'), env)
  return dir
}

test('secrets: the template declares none, so no secret files or local outputs exist', () => {
  const { outputs, warnings } = generateAll(TEMPLATE)
  assert.deepEqual(warnings, [])
  assert.ok(outputs.every((o) => !o.local))
  assert.ok(!outputs.some((o) => /AppSecrets|secrets\.server|\.env\.example/.test(o.path)))
})

test('secrets: without a .env, values are empty and a warning says how to fix it', () => {
  const { outputs, warnings } = generateAll(projectWithSecret())
  assert.match(outputOf(outputs, 'AppSecrets.swift'), /static let mapsApiKey = ""/)
  assert.match(outputOf(outputs, 'AppSecrets.kt'), /val mapsApiKey: String = ""/)
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /\.env is missing: MAPS_API_KEY is empty in AppSecrets\. Copy \.env\.example to \.env/)
})

test('secrets: values from .env are inlined on mobile and only named on the web', () => {
  const { outputs, warnings } = generateAll(projectWithSecret('MAPS_API_KEY="abc$123"\n'))
  assert.deepEqual(warnings, [])
  assert.match(outputOf(outputs, 'AppSecrets.swift'), /static let mapsApiKey = "abc\$123"/)
  assert.match(outputOf(outputs, 'AppSecrets.kt'), /val mapsApiKey: String = "abc\\\$123"/, 'Kotlin escapes $')
  for (const suffix of ['AppSecrets.swift', 'AppSecrets.kt']) {
    assert.ok(outputs.find((o) => o.path.endsWith(suffix))?.local, `${suffix} is local`)
  }
  const web = outputs.find((o) => o.path.endsWith('secrets.server.ts'))
  assert.ok(web && !web.local)
  assert.doesNotMatch(String(web.content), /abc/, 'the committed web file never contains the value')
  assert.match(String(web.content), /mapsApiKey: "MAPS_API_KEY"/)
  assert.match(String(web.content), /\/\/\/ <reference types="node" \/>/)
})

test('secrets: the web file is identical with or without a .env', () => {
  const content = (env) => outputOf(generateAll(projectWithSecret(env)).outputs, 'secrets.server.ts')
  assert.equal(content(), content('MAPS_API_KEY=x\n'))
})

test('secrets: .env.example lists every key and says it is generated', () => {
  const example = outputOf(generate(projectWithSecret()), '.env.example')
  assert.match(example, /^# GENERATED by geeknative from contracts\/config\.json/)
  assert.match(example, /# Google Maps SDK key\nMAPS_API_KEY=\n/)
})

test('secrets: a .env missing one of several keys names only that key', () => {
  const dir = tempProject()
  editJson(path.join(dir, 'contracts', 'config.json'), (config) => {
    config.secrets = { mapsApiKey: { type: 'string' }, analyticsKey: { type: 'string' } }
  })
  writeFileSync(path.join(dir, '.env'), 'MAPS_API_KEY=x\n')
  assert.deepEqual(generateAll(dir).warnings, ['.env lacks ANALYTICS_KEY: ANALYTICS_KEY is empty in AppSecrets.'])
})

test('every generated file says it is generated and where it comes from', () => {
  for (const output of generate(TEMPLATE)) {
    if (output.path.endsWith('.json') || output.path.endsWith('.xcstrings')) continue // JSON has no comments
    if (Buffer.isBuffer(output.content)) continue // copied font files
    assert.match(String(output.content), /GENERATED by geeknative from contracts\//, output.path)
  }
})
