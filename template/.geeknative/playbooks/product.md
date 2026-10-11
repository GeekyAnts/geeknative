# Playbook: product

Use when the user describes an app (often the first prompt in a new project), or changes what it is, who it's for, or its scope.

1. **Understand.** Restate the product in one sentence. Ask only about things that would change the data model or the navigation structure (AGENTS.md section 6), and assume the rest.
2. **PRODUCT.md.** Fill in the one-sentence description, the audience, the feature list, the glossary and what's out of scope. Glossary terms become the names used in code on every platform.
3. **Design.** If the user described a look, write the direction in DESIGN.md and update contracts/tokens.json (colors in light and dark, type, spacing, radii). Run `make gen`.
4. **Navigation.** Update spec/navigation.md with the screens and how users move between them (tabs, stacks, modals). Keep the starter Settings screen unless the user says otherwise.
5. **Feature specs.** Write one spec per feature in spec/features/, starting from .geeknative/templates/feature.md, with every platform's status set to `planned`. Keep version one small: the core loop first.
6. **Build in vertical slices.** Take the first feature through the loop in AGENTS.md section 4 on all three apps, verify it, record its status, then start the next. Never build every screen on one platform first.
7. **Replace the starter content.** Once real features exist, update or remove Home's welcome card, and update spec/features/home.md to match.
8. **Report** what you built on each platform, what's planned next, and the assumptions you made.
