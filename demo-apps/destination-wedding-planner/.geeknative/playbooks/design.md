# Playbook: design change

Use for look and feel: colors, type, the typeface, icons, spacing, corner radii, dark mode, density, or "make it feel more ...".

1. **Direction first.** For a broad request ("warmer", "more premium"), update the Direction section of DESIGN.md in a sentence or two, so later changes stay consistent with it.
2. **Tokens before code.** Change values in contracts/tokens.json. Keep light and dark values in step and text readable (WCAG AA: 4.5:1 for body text). Run `make gen`. Most visual changes need nothing else, because every app reads the tokens.
3. **New tokens are roles.** Name new colors by purpose (`success`, `warning`), not by hue (`green`). Every app gets them on the next `make gen`.
4. **Icons come from the contract.** Add an icon to contracts/icons.json by its Lucide name (https://lucide.dev/icons), or as an SVG file in contracts/icons for artwork Lucide lacks; mark directional icons `mirrored`. Never reference an icon library or an SVG directly in an app, and size icons with the icon tokens (`AppIconSize.md`, `size-icon-md`).
5. **The typeface is one setting.** To change the font everywhere, run `make font FAMILY="<Google Fonts family>"` (or `FAMILY=system`). Never set a font family in app code or CSS. Every weight the type scale uses needs a file, which `make font` takes care of.
6. **Components.** If a change affects a pattern (for example, every card gets a border), update the Components table in DESIGN.md, then change that pattern in all three apps.
7. **Stay native.** Change brand elements (color, type, spacing, imagery) everywhere. Chrome text and colors follow the tokens; the back chevron glyph, gestures, sheets and system controls stay native unless the user explicitly asks otherwise. How far layouts may diverge is AGENTS.md, Consistency.
8. **Web is a desktop app.** Unprefixed layout is the wide window: a top bar with destinations in a row, content using the window (grids and side-by-side where the screen has them). Forms and settings stay in `Page` (`max-w-2xl`). Below `md`, the row hides and a menu button opens a side drawer (`aside`, full height, scrim, Escape and scrim click close it) — not a dropdown and not a bottom tab bar. iOS and Android keep their native navigation.
9. **Verify** with `make check`. If you can, launch the apps (`make run-ios`, `make run-android`, `make run-web`) and look at the result.
