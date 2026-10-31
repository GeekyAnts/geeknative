# Playbook: feature or behavior change

1. **Spec.** For a new feature, copy .geeknative/templates/feature.md to `spec/features/<id>.md` (`id` in kebab-case). For a change, edit the existing spec. Write acceptance criteria that are testable and platform-neutral, numbered `AC-<id>-1`, `AC-<id>-2`, ...
2. **States.** Cover loading, empty, error and success for every screen that loads or saves data. Missing states are the most common way apps drift apart.
3. **Data.** Describe what's stored and in what format (keys, values, types), so every app stores it the same way. New data goes through a repository interface with a local implementation; there's no backend yet.
4. **Navigation.** If the feature adds a screen, add it to spec/navigation.md.
5. **Contracts.** Add copy to `contracts/strings/<locale>.json` (every locale), including the labels platform controls need (a `common.done` or `common.ok` for date and time picker dialogs, `common.cancel` for confirmations) rather than reusing a word that means something else, icons to contracts/icons.json and any new design tokens to contracts/tokens.json. Run `make gen`.
6. **Implement** on iOS, Android and web, each following its `apps/<platform>/AGENTS.md` and using the same names everywhere: `<Name>Screen`, `<Name>ViewModel`, `<Name>Repository`.
7. **Test** each acceptance criterion on each platform, with the AC ID in the test name. A `(ui)` criterion needs a test that drives the real UI: an XCUITest in apps/ios/AppUITests, a Compose UI test on Android, a web test that renders into a DOM. `make parity` shows 🟡 for a `(ui)` criterion that only other tests name.
8. **Verify** with `make check`, and fix until it passes. Then check by reading the code:
   - Every new string key and icon is used on all three platforms, or its single-platform use is written in the spec's Platform notes.
   - No hex colors, raw sizes or arbitrary Tailwind values outside generated files; no user-visible text outside contracts/.
   - `<Name>Screen`, `<Name>ViewModel` (`use<Name>ViewModel` on web) and `<Name>Repository`, test IDs, storage keys, stored values and fallbacks match across the apps.
   - Icon-only controls have a label from strings, and touch targets meet 44 pt (iOS), 48 dp (Android) and 44 px (web).
   - Every intentional platform difference is written in DESIGN.md or the spec's Platform notes.
9. **Record.** Set each platform's status in the spec's front matter (`done`, `in-progress`, `planned`, or `n/a` for a feature that's not on that platform). Run `make parity`. Add new features to PRODUCT.md's feature list.
