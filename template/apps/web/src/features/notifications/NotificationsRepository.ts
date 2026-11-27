import type { AppNotification } from './Notification'

/**
 * The inbox and the device preference. Screens use whichever implementation AppContainer provides.
 * Local keeps the inbox on the device. Remote keeps the same inbox on a server. The preference stays on the device either way.
 */
export interface NotificationsRepository {
  isEnabled(): Promise<boolean>
  setEnabled(enabled: boolean): Promise<void>
  list(): Promise<AppNotification[]>
  upsert(notification: AppNotification): Promise<void>
  markRead(id: string, readAt: string): Promise<void>
  markAllRead(readAt: string): Promise<void>
  dismiss(id: string): Promise<void>
  /** Hands due items to `present` once, and records `deliveredAt` so they are not presented again. */
  deliverDue(now: string, present: (notification: AppNotification) => void): Promise<void>
}

/** Inbox reads and writes for a remote implementation. The app still owns `notifications.enabled`. */
export interface NotificationGateway {
  list(): Promise<AppNotification[]>
  save(notification: AppNotification): Promise<void>
  remove(id: string): Promise<void>
}
