---
title: Add the missing platform to your app
label: Adding a platform
order: 3
description: Have an iOS app and need Android, or a web product that needs mobile apps? Use the app you have as the spec, and let a coding agent build the native versions from it.
---

Plenty of products live on one platform. An iOS app with Android users asking for a version. A web product with "mobile app coming soon" on the pricing page. Adding a platform usually means hiring a new team, or rewriting everything in a cross-platform framework.

With geeknative, the app you already have becomes the reference. The agent writes the spec from it, then builds native iOS, Android and web apps against that spec.

## How it works

geeknative starts new projects. It does not import your existing code. What it imports is your product: what it does, how it looks and how it behaves.

1. **Create a project** with your app's name and ID:

   ```sh
   npm create geeknative@latest my-app -- --name "My App" --id com.acme.myapp
   ```

2. **Describe the existing product.** Ask your agent to fill in PRODUCT.md and `spec/navigation.md` from your current app. Share screenshots, your current copy and, if you have them, existing requirements or test plans.

3. **Bring the brand across.** Put your colors, type, spacing and radii in `contracts/tokens.json`, and your copy in `contracts/strings/`. `make gen` turns them into code for every app. See [Contracts](/docs/reference/contracts/).

4. **Spec one feature at a time.** Each spec in `spec/features/` gets numbered acceptance criteria. Write them from how your current app behaves today.

5. **Build in vertical slices.** The agent takes each feature through all three apps before starting the next. Your existing platform's app is the benchmark for every review.

## Why not only build the missing app?

You can set a platform's status to `n/a` in a spec and build only what you need. Building all three from the spec has advantages, though:

- The new app and the replacement for your current one are built the same way, with the same names.
- You get parity tracking across every platform, so the next feature reaches everyone at once.
- Your current app's technical debt doesn't move into the new platform.

Many teams start by building only the missing platform, then move the original app onto the same spec when it needs a major update.

## What to know first

- **Your backend stays yours.** geeknative has no backend layer yet. Features use repository interfaces, and you implement them against your existing APIs.
- **Check minimum versions.** iOS 17, Android 7.0 (API 24), Safari 16.4, Chrome 111 and Firefox 128. Compare them with your analytics.
- **Plan for review.** The agent writes the code, but someone on your team should know each platform well enough to review it.

## Related

- [Replace a hybrid app with native apps](/use-cases/replace-a-hybrid-app/)
- [Migrate a Xamarin app](/use-cases/xamarin-migration/)
- [From idea to three apps](/docs/guides/idea-to-three-apps/)
