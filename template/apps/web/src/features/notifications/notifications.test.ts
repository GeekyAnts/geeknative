import { describe, expect, test } from 'vitest'
import { InMemoryNotificationsRepository } from './InMemoryNotificationsRepository'
import { LocalNotificationsRepository } from './LocalNotificationsRepository'
import { decodeInbox, type AppNotification } from './Notification'
import type { NotificationGateway } from './NotificationsRepository'
import { RemoteNotificationsRepository } from './RemoteNotificationsRepository'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

function note(partial: Partial<AppNotification> & Pick<AppNotification, 'id' | 'createdAt'>): AppNotification {
  return {
    kind: 'reminder',
    title: partial.id,
    body: 'body',
    readAt: null,
    route: null,
    routeParams: {},
    deliverAt: null,
    deliveredAt: null,
    ...partial,
  }
}

function memoryGateway(seed: AppNotification[] = []): NotificationGateway {
  let items = [...seed]
  return {
    async list() {
      return items
    },
    async save(notification) {
      items = [...items.filter((item) => item.id !== notification.id), notification]
    },
    async remove(id) {
      items = items.filter((item) => item.id !== id)
    },
  }
}

describe('Notifications', () => {
  test('delivery defaults to off and the inbox is empty', async () => {
    const repository = new LocalNotificationsRepository(memoryStorage())
    expect(await repository.isEnabled()).toBe(false)
    expect(await repository.list()).toEqual([])
  })

  test('lists unread first, then newest', async () => {
    const repository = new InMemoryNotificationsRepository()
    await repository.upsert(note({ id: 'old-unread', createdAt: '2026-01-01T00:00:00Z' }))
    await repository.upsert(note({ id: 'new-read', createdAt: '2026-03-01T00:00:00Z', readAt: '2026-03-02T00:00:00Z' }))
    await repository.upsert(note({ id: 'new-unread', createdAt: '2026-02-01T00:00:00Z' }))
    expect((await repository.list()).map((item) => item.id)).toEqual(['new-unread', 'old-unread', 'new-read'])
  })

  test('mark read, mark all, and dismiss', async () => {
    const repository = new InMemoryNotificationsRepository([
      note({ id: 'a', createdAt: '2026-01-01T00:00:00Z' }),
      note({ id: 'b', createdAt: '2026-01-02T00:00:00Z' }),
    ])
    await repository.markRead('a', '2026-01-03T00:00:00Z')
    await repository.markRead('a', '2026-01-04T00:00:00Z')
    expect((await repository.list()).find((item) => item.id === 'a')?.readAt).toBe('2026-01-03T00:00:00Z')
    await repository.markAllRead('2026-01-05T00:00:00Z')
    expect((await repository.list()).every((item) => item.readAt)).toBe(true)
    await repository.dismiss('b')
    expect((await repository.list()).map((item) => item.id)).toEqual(['a'])
  })

  test('the local inbox survives a new repository on the same storage', async () => {
    const storage = memoryStorage()
    await new LocalNotificationsRepository(storage).upsert(note({ id: 'kept', createdAt: '2026-01-01T00:00:00Z', route: 'home', routeParams: { tab: 'saved' } }))
    await new LocalNotificationsRepository(storage).setEnabled(true)
    const again = new LocalNotificationsRepository(storage)
    expect(await again.isEnabled()).toBe(true)
    const stored = await again.list()
    expect(stored).toHaveLength(1)
    expect(stored[0]?.routeParams).toEqual({ tab: 'saved' })
    expect(decodeInbox('not json')).toEqual([])
  })

  test('presents a due notification once, and stays quiet when delivery is off', async () => {
    const repository = new LocalNotificationsRepository(memoryStorage())
    const item = note({ id: 'due', createdAt: '2026-01-01T00:00:00Z', deliverAt: '2026-01-02T00:00:00Z' })
    await repository.upsert(item)
    const early: string[] = []
    await repository.deliverDue('2026-01-01T00:00:00Z', (notification) => early.push(notification.id))
    expect(early).toEqual([])

    await repository.setEnabled(true)
    const presented: string[] = []
    await repository.deliverDue('2026-01-02T00:00:00Z', (notification) => presented.push(notification.id))
    await repository.deliverDue('2026-01-03T00:00:00Z', (notification) => presented.push(notification.id))
    expect(presented).toEqual(['due'])
    expect((await repository.list())[0]?.deliveredAt).toBe('2026-01-02T00:00:00Z')
  })

  test('a remote inbox uses the gateway and keeps the preference on the device', async () => {
    const gateway: NotificationGateway = memoryGateway([note({ id: 'server', createdAt: '2026-01-01T00:00:00Z', deliverAt: '2026-01-02T00:00:00Z' })])
    const preferences = new LocalNotificationsRepository(memoryStorage())
    const repository = new RemoteNotificationsRepository(gateway, preferences)
    expect(await repository.isEnabled()).toBe(false)
    await repository.setEnabled(true)
    expect(await preferences.isEnabled()).toBe(true)

    const presented: string[] = []
    await repository.deliverDue('2026-01-02T00:00:00Z', (notification) => presented.push(notification.id))
    expect(presented).toEqual(['server'])
    expect((await gateway.list())[0]?.deliveredAt).toBe('2026-01-02T00:00:00Z')

    await repository.dismiss('server')
    expect(await repository.list()).toEqual([])
  })
})
