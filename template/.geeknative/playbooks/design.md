# Playbook: design change

Use for look and feel: colors, type, spacing, corner radii, dark mode, density, or "make it feel more ...".

1. **Direction first.** For a broad request ("warmer", "more premium"), update the Direction section of DESIGN.md in a sentence or two, so later changes stay consistent with it.
2. **Tokens before code.** Change values in contracts/tokens.json. Keep light and dark values in step and text readable (WCAG AA: 4.5:1 for body text). Run `make gen`. Most visual changes need nothing else, because every app reads the tokens.
3. **New tokens are roles.** Name new colors by purpose (`success`, `warning`), not by hue (`green`). Every app gets them on the next `make gen`.
4. **Components.** If a change affects a pattern (for example, every card gets a border), update the Components table in DESIGN.md, then change that pattern in all three apps.
5. **Stay native.** Change brand elements (color, type, spacing, imagery) everywhere, but keep platform conventions (navigation bars, system controls, gestures) native unless the user explicitly asks otherwise.
6. **Verify** with `make check`. If you can, launch the apps (`make run-ios`, `make run-android`, `make run-web`) and look at the result.
