import {
  NOTIFICATIONS_ENABLED_KEY,
  NOTIFICATIONS_INBOX_KEY,
  decodeInbox,
  dueDeliveries,
  enabledValue,
  encodeInbox,
  parseEnabled,
  sortInbox,
  type AppNotification,
} from './Notification'
import type { NotificationsRepository } from './NotificationsRepository'

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

/** Posts and cancels the browser notification for one inbox row. */
export interface NotificationScheduler {
  schedule(notification: AppNotification): void
  cancel(id: string): void
  cancelAll(): void
}

/** Keeps the inbox and the preference in localStorage. Without storage (during server rendering) the inbox is empty and delivery is off. */
export class LocalNotificationsRepository implements NotificationsRepository {
  private readonly storage: KeyValueStorage | undefined
  /** Set for the live app. Tests leave it unset. */
  scheduler: NotificationScheduler | undefined

  constructor(storage: KeyValueStorage | undefined) {
    this.storage = storage
  }

  async isEnabled(): Promise<boolean> {
    return parseEnabled(this.storage?.getItem(NOTIFICATIONS_ENABLED_KEY))
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.storage?.setItem(NOTIFICATIONS_ENABLED_KEY, enabledValue(enabled))
    if (!this.scheduler) return
    if (enabled) {
      for (const item of decodeInbox(this.storage?.getItem(NOTIFICATIONS_INBOX_KEY))) this.scheduler.schedule(item)
    } else {
      this.scheduler.cancelAll()
    }
  }

  async list(): Promise<AppNotification[]> {
    return sortInbox(decodeInbox(this.storage?.getItem(NOTIFICATIONS_INBOX_KEY)))
  }

  async upsert(notification: AppNotification): Promise<void> {
    const items = decodeInbox(this.storage?.getItem(NOTIFICATIONS_INBOX_KEY)).filter((item) => item.id !== notification.id)
    this.storage?.setItem(NOTIFICATIONS_INBOX_KEY, encodeInbox([...items, notification]))
    if (await this.isEnabled()) this.scheduler?.schedule(notification)
  }

  async markRead(id: string, readAt: string): Promise<void> {
    await this.update(id, (item) => (item.readAt ? item : { ...item, readAt }))
  }

  async markAllRead(readAt: string): Promise<void> {
    const items = decodeInbox(this.storage?.getItem(NOTIFICATIONS_INBOX_KEY)).map((item) =>
      item.readAt ? item : { ...item, readAt },
    )
    this.storage?.setItem(NOTIFICATIONS_INBOX_KEY, encodeInbox(items))
  }

  async dismiss(id: string): Promise<void> {
    const items = decodeInbox(this.storage?.getItem(NOTIFICATIONS_INBOX_KEY)).filter((item) => item.id !== id)
    this.storage?.setItem(NOTIFICATIONS_INBOX_KEY, encodeInbox(items))
    this.scheduler?.cancel(id)
  }

  async deliverDue(now: string, present: (notification: AppNotification) => void): Promise<void> {
    const current = decodeInbox(this.storage?.getItem(NOTIFICATIONS_INBOX_KEY))
    const { inbox, present: due } = dueDeliveries(current, await this.isEnabled(), now)
    this.storage?.setItem(NOTIFICATIONS_INBOX_KEY, encodeInbox(inbox))
    for (const notification of due) present(notification)
  }

  private async update(id: string, change: (item: AppNotification) => AppNotification): Promise<void> {
    const items = decodeInbox(this.storage?.getItem(NOTIFICATIONS_INBOX_KEY)).map((item) =>
      item.id === id ? change(item) : item,
    )
    this.storage?.setItem(NOTIFICATIONS_INBOX_KEY, encodeInbox(items))
  }
}
