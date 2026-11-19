# Playbook: engineering change

Use for tooling, dependencies, build settings, refactoring and performance work that doesn't change what users see.

1. **No spec changes** unless behavior changes. If it does, treat it as a feature or a bug instead.
2. **Keep the apps mirrored.** If you change how state, navigation, data or dependencies work on one platform, make the matching change on the others, or record why not in spec/decisions.md.
3. **Dependencies.** Prefer platform and first-party libraries, and ask before adding a large dependency. The iOS app has no third-party packages; adding one changes the Xcode project, so ask first.
4. **Generated code.** Never edit generated files. Change the contract, or for a bug in the generator, report it upstream: codegen lives in the geeknative package.
5. **Environments and secrets.** Per-environment values go in contracts/config.json, one value per environment. Secret values never go in contracts or code: declare the name under `secrets`, put the value in .env, and run `make gen`.
6. **Verify** with `make check` for every platform you touched.
