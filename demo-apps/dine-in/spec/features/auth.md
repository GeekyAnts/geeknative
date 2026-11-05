---
id: auth
title: Authentication
status:
  ios: planned
  android: planned
  web: planned
---

# Authentication

## Summary

Members create an account or sign in before using the app, so their reservations, saved restaurants and preferences belong to them. In this version accounts live on the device; a backend later replaces only the repository.

## User stories

- As a new visitor, I want a beautiful first impression and a quick way to join.
- As a member, I want to sign in and find my reservations where I left them.

## Screens and states

**Welcome** (`welcome`): full-bleed `catalog.welcomeImage` photograph with a slow Ken Burns zoom (scale 1 → 1.08 over 20 s, alternating; off with reduce motion) under a `PhotoScrim` that covers the whole image. Top: app name (`AppIdentity.name`) as a serif `title` in `onGlassOnImage`, `brand.tagline` overline. Bottom, on a `GlassSurface` panel (radius `xl`): `welcome.overline` overline, `welcome.title` in serif `hero` (the phrase is one string; no italic split), `welcome.body`, `PrimaryButton` `welcome.createAccount` → Sign up, `SecondaryButton`-styled text button `welcome.signIn` → Sign in. The panel fades and slides up on appear. The image's loading state is the `espresso` background.

**Sign in** (`signIn`): `TopBar` with back; `ScreenHeader` (`auth.signIn.title`, `auth.signIn.subtitle`); fields Email (`mail` icon, email keyboard, no autocorrect/capitalization) and Password (`lock` icon, secure, trailing eye toggle labelled `auth.showPassword` / `auth.hidePassword`); `PrimaryButton` `auth.signInAction` (busy while submitting); link `auth.switchToSignUp` → replaces with Sign up; `DemoNote`-style caption `auth.localNote` at the bottom.

**Sign up** (`signUp`): same layout with `auth.signUp.title` / `auth.signUp.subtitle`, fields Full name (`user` icon, words capitalization), Email, Password (hint `auth.passwordHint` under it), `PrimaryButton` `auth.signUpAction`, link `auth.switchToSignIn`.

States: idle; field errors shown under each field after the first submit attempt and updated as the user types; submitting (button busy, fields disabled); a form-level error (`auth.error.emailTaken`, `auth.error.invalidCredentials`) shown in `error` above the button.

## Behavior and rules

- Validation (`AuthValidator`): name trimmed non-empty (`auth.error.nameRequired`); email trimmed matches `^[^\s@]+@[^\s@]+\.[^\s@]+$` (`auth.error.emailInvalid`); password at least 8 characters (`auth.error.passwordShort`).
- Emails are stored trimmed and lowercased; comparisons use that form.
- `AuthRepository`: `currentAccount() -> Account?`, `signUp(name, email, password) -> Account` (throws `emailTaken`), `signIn(email, password) -> Account` (throws `invalidCredentials`), `signOut()`. Implementations: local (`UserDefaultsAuthRepository`, `DataStoreAuthRepository`, `LocalStorageAuthRepository`) and `InMemoryAuthRepository`.
- `Account { name: String, email: String, createdAt: String (ISO 8601 UTC) }`.
- Stored data, identical keys and formats on every platform:
  - `auth.accounts`: JSON array of `{ "name", "email", "passwordHash", "createdAt" }`. `passwordHash` = lowercase hex SHA-256 of the UTF-8 string `"<email>:<password>"` (e.g. email `a@b.co`, password `password1` → SHA-256 of `a@b.co:password1`).
  - `auth.session`: the signed-in member's email; absent when signed out.
- Creating an account signs the member in. Signing in or up replaces the signed-out stack with the main tabs on Discover.
- Sign out (from Profile, after confirmation) clears `auth.session` only; the member's other data stays on the device under their email. It replaces the main tabs with Welcome.
- App start: if `auth.session` names an existing account, open the tabs; otherwise Welcome. On web, render nothing (the `background` colour) until hydration decides, so neither stack flashes.

## Acceptance criteria

- AC-auth-1: With no session, the app opens on Welcome.
- AC-auth-2 (ui): Welcome's Create account opens Sign up, and its sign-in button opens Sign in.
- AC-auth-3: Sign up rejects an empty name, an invalid email and a password shorter than 8 characters, with the matching messages.
- AC-auth-4: Sign up with an email that already has an account fails with `auth.error.emailTaken` (case-insensitive).
- AC-auth-5: Sign in with a wrong password or unknown email fails with `auth.error.invalidCredentials`.
- AC-auth-6 (ui): A successful sign up lands on Discover, greeting the member by first name.
- AC-auth-7: The session survives an app restart; signing out clears it and shows Welcome.
- AC-auth-8: Passwords are never stored in plain text: the stored hash is SHA-256 of `email:password`.

## Copy

`welcome.*`, `auth.*`, `brand.tagline`.

## Platform notes

- iOS uses CryptoKit for SHA-256, Android `MessageDigest`, web `crypto.subtle.digest`.
- Keyboard: iOS `.textContentType(.emailAddress/.password/.name)`, Android `KeyboardOptions` with matching `KeyboardType` and `autofill` hints, web `autocomplete="email" | "current-password" | "new-password" | "name"`.

## Test IDs

- `welcome.createAccount`, `welcome.signIn`
- `auth.name`, `auth.email`, `auth.password`, `auth.togglePassword`, `auth.submit`, `auth.switch`, `auth.error`

## Assumptions and open questions

- Assumption: storing accounts on the device (with hashed passwords) is acceptable for this version; a backend with real authentication replaces `AuthRepository` later. The device-only nature is stated on screen (`auth.localNote`).
