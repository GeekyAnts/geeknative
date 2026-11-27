import { dueDeliveries, sortInbox, type AppNotification } from './Notification'
import type { NotificationGateway, NotificationsRepository } from './NotificationsRepository'

type PreferenceStore = {
  isEnabled(): Promise<boolean>
  setEnabled(enabled: boolean): Promise<void>
}

/**
 * The inbox lives on the server through `gateway`. The on/off preference stays in `preferences`
 * (the local repository, or any store with the same two methods) because permission is per device.
 */
export class RemoteNotificationsRepository implements NotificationsRepository {
  private readonly gateway: NotificationGateway
  private readonly preferences: PreferenceStore

  constructor(gateway: NotificationGateway, preferences: PreferenceStore) {
    this.gateway = gateway
    this.preferences = preferences
  }

  isEnabled(): Promise<boolean> {
    return this.preferences.isEnabled()
  }

  setEnabled(enabled: boolean): Promise<void> {
    return this.preferences.setEnabled(enabled)
  }

  async list(): Promise<AppNotification[]> {
    return sortInbox(await this.gateway.list())
  }

  upsert(notification: AppNotification): Promise<void> {
    return this.gateway.save(notification)
  }

  async markRead(id: string, readAt: string): Promise<void> {
    const current = (await this.gateway.list()).find((item) => item.id === id)
    if (!current || current.readAt) return
    await this.gateway.save({ ...current, readAt })
  }

  async markAllRead(readAt: string): Promise<void> {
    const items = await this.gateway.list()
    await Promise.all(items.filter((item) => !item.readAt).map((item) => this.gateway.save({ ...item, readAt })))
  }

  dismiss(id: string): Promise<void> {
    return this.gateway.remove(id)
  }

  async deliverDue(now: string, present: (notification: AppNotification) => void): Promise<void> {
    const current = await this.gateway.list()
    const { present: due } = dueDeliveries(current, await this.isEnabled(), now)
    await Promise.all(due.map((notification) => this.gateway.save(notification)))
    for (const notification of due) present(notification)
  }
}
