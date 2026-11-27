import { dueDeliveries, sortInbox, type AppNotification } from './Notification'
import type { NotificationsRepository } from './NotificationsRepository'

/** Keeps the inbox in memory, for previews and tests. */
export class InMemoryNotificationsRepository implements NotificationsRepository {
  private enabled: boolean
  private items: AppNotification[]

  constructor(items: AppNotification[] = [], enabled = false) {
    this.items = items
    this.enabled = enabled
  }

  async isEnabled(): Promise<boolean> {
    return this.enabled
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled
  }

  async list(): Promise<AppNotification[]> {
    return sortInbox(this.items)
  }

  async upsert(notification: AppNotification): Promise<void> {
    this.items = [...this.items.filter((item) => item.id !== notification.id), notification]
  }

  async markRead(id: string, readAt: string): Promise<void> {
    this.items = this.items.map((item) => (item.id === id && !item.readAt ? { ...item, readAt } : item))
  }

  async markAllRead(readAt: string): Promise<void> {
    this.items = this.items.map((item) => (item.readAt ? item : { ...item, readAt }))
  }

  async dismiss(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id)
  }

  async deliverDue(now: string, present: (notification: AppNotification) => void): Promise<void> {
    const { inbox, present: due } = dueDeliveries(this.items, this.enabled, now)
    this.items = inbox
    for (const notification of due) present(notification)
  }
}
