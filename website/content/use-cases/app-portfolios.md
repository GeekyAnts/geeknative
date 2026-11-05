---
title: Native apps for agencies, white-label products and app portfolios
label: Agencies and portfolios
order: 6
description: For agencies, white-label vendors and enterprises with many apps. Build every app natively from one base, rebrand through contracts, and hand over a spec your client can keep.
---

Some teams don't build one app. They build many: an agency with dozens of clients, a vendor selling a white-label app to franchises, an enterprise with an app per brand, country or business unit. Native quality across all of them has usually been out of reach.

geeknative gives every app the same structure and makes the brand a set of files, so a portfolio of native apps becomes practical.

## A new brand is a contracts change

Everything that makes an app look and sound like one brand lives in `contracts/`:

| Contract | Holds | Becomes |
|---|---|---|
| `app.json` | Name, bundle ID, version, default locale | The iOS bundle ID and Android application ID, display names and the web page title |
| `tokens.json` | Colors for light and dark, type, spacing, radii | `AppColors`, `AppTypography`, `AppSpacing` and `AppRadius` on iOS, `AppTheme` mapped onto Material 3 on Android, a Tailwind theme on the web |
| `strings/` | Copy, with placeholders, plurals and locales | `Strings` on iOS, string resources on Android, `strings` on the web |
| `icons.json` | One icon name per platform | SF Symbols on iOS, Material icons on Android, Lucide icons on the web |

`make gen` compiles them into every app. An invalid contract fails with a message naming the file and field. See [Contracts](/docs/reference/contracts/).

## Why it suits agencies

- **Quote native at a competitive price.** The agent writes three apps; your team reviews them. Native stops being the premium option.
- **Every project looks the same inside.** Same folders, same names, same commands. Anyone on the team can pick up any client.
- **A clean handover.** Clients get PRODUCT.md, DESIGN.md, specs with acceptance criteria and a parity report, not only code.
- **No runtime to license or upgrade.** The apps are plain SwiftUI, Compose and React, under your client's control.

## Why it suits enterprise portfolios

- **One standard for every app.** Teams across business units build the same way, with the same agent instructions in AGENTS.md.
- **Traceability.** Acceptance criteria IDs run from the spec into each platform's test names. `make parity` writes `spec/parity.md`, a record of what is tested where.
- **Accessibility through native components.** VoiceOver, TalkBack and Dynamic Type work with platform components out of the box.

## How to set up a base

1. Create a project and build your shared features once.
2. Keep that project as your base. For each brand or client, copy it and change `contracts/app.json`, `tokens.json`, `strings/` and `icons.json`.
3. Run `make gen` and `make check` to build and test the branded apps.

The base is a normal geeknative project, so you can review it, version it and improve it like any other repo.

## What to know first

- There is no built-in multi-brand build yet. Each brand is its own project, copied from your base.
- Automated upgrades for existing projects (`geeknative upgrade`) are on the [roadmap](/docs/project/roadmap/), not released.
- There is no backend layer. Each app talks to your services through repository interfaces.

## Related

- [Keep iOS, Android and web on the same features](/use-cases/product-teams/)
- [Design changes](/docs/guides/design-changes/)
- [File ownership](/docs/concepts/file-ownership/)
