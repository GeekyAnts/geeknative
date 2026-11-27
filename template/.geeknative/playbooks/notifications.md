# Playbook: notifications

The starter already has the inbox. Use it. Do not invent a second notification model, and do not call the platform notification center from a feature.

## The record

Every notification is the same JSON object on iOS, Android and web:

| Field | Meaning |
|---|---|
| `id` | Stable id. Upserting the same id replaces the row. |
| `kind` | A feature name, like `reservation.reminder`. |
| `title`, `body` | Already rendered copy. Build them from `contracts/strings`, then store the result. |
| `createdAt` | ISO-8601 UTC. |
| `readAt` | ISO-8601 UTC, or null when unread. |
| `route`, `routeParams` | Where a tap goes. `route` is a screen the navigation spec already has. `routeParams` is a map of strings. Both may be null / empty. |
| `deliverAt` | When to hand it to the OS. Null means inbox only. |
| `deliveredAt` | Set by `deliverDue` after the OS has been asked once. |

Stored under `notifications.inbox`. The device preference is `notifications.enabled`, `on` or `off`, default `off`.

`list` returns unread first, then newest `createdAt`.

## Local or remote

`AppContainer` starts with the local repository (UserDefaults, DataStore, localStorage). That is the live inbox until a server exists.

When a server exists:

1. Put this feature's paths in `contracts/api/notifications.json` and run `make gen`. The payloads use the fields above.
2. Write a `NotificationGateway` that calls the generated client (`ApiNotifications`, or the web exports from `#/generated/api/notifications`).
3. In `AppContainer` only, construct `RemoteNotificationsRepository` with that gateway and the **local** repository as the preference store. The on/off switch stays on the device.
4. Leave screens and view models on `NotificationsRepository`.

## What a feature does

- Create or refresh a row with `upsert`.
- The live local repository already schedules a system notification when the preference is `on`. iOS and the web do not show that banner while the app is on screen. A tap opens this app. A `route` of `settings` opens Settings; any other route opens Home.
- `dismiss` cancels that system notification. Turning the Settings switch off cancels them. The switch is where the app asks for permission.

Push (APNs, FCM, web push) is the remote gateway's job on the server. The push payload still becomes one inbox row through `upsert`, so the bell and the banner stay the same list.
