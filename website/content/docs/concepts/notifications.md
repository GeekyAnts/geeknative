---
title: Notifications
description: One inbox for every geeknative app, stored on the device or on a server.
---

Every generated app ships a notifications inbox. Features write rows into it. Screens read them through `NotificationsRepository`. The repository is local until you swap in a remote one, and that swap happens in `AppContainer` only.

## One record

iOS, Android and web store the same JSON array under `notifications.inbox`:

| Field | Meaning |
|---|---|
| `id` | Stable id. Saving the same id again replaces the row. |
| `kind` | Which feature produced it, such as `reservation.reminder`. |
| `title`, `body` | Copy already filled in from `contracts/strings`. |
| `createdAt` | When it was created, ISO-8601 UTC. |
| `readAt` | When it was read, or null. |
| `route`, `routeParams` | The screen a tap opens, and string parameters for that screen. |
| `deliverAt` | When the OS may show it. Null keeps it in the inbox only. |
| `deliveredAt` | Set after the app has asked the OS to show it, so it is not shown again. |

`list` returns unread rows first, then the newest `createdAt`.

The device preference is separate: `notifications.enabled` is `on` or `off`, and it defaults to `off`. Settings shows it as a switch titled `settings.notifications.title`. Turning it off leaves the rows in place and stops OS delivery.

## Local

The live implementation writes that JSON on the device:

| Platform | Store |
|---|---|
| iOS | `UserDefaultsNotificationsRepository` |
| Android | `DataStoreNotificationsRepository` |
| Web | `LocalNotificationsRepository` (localStorage) |

`deliverDue(now)` finds rows whose `deliverAt` is due, sets `deliveredAt`, and hands each one to a presenter you supply. That presenter is where the app talks to the system notification center. Features do not.

## Remote

`RemoteNotificationsRepository` takes a `NotificationGateway` (`list`, `save`, `remove`) and a local repository for the on/off preference. Permission stays on the device. The inbox moves to whatever the gateway calls.

When the server is described in `contracts/api/notifications.json` and `apiBaseUrl` is set, the gateway is a thin wrapper around the generated client. Push delivery (APNs, FCM, web push) stays on the server. A push still lands as one of these rows, so the in-app list and the banner are the same notification.

Agents follow `.geeknative/playbooks/notifications.md`.
