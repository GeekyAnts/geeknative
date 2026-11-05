import { describe, expect, test } from 'vitest'
import { BundledCatalogRepository } from './BundledCatalogRepository'
import type { Restaurant } from './Catalog'
import { DemoAvailability, fnv1a32 } from './DemoAvailability'
import { Formatters } from './Formatters'
import { matches } from './SearchMatching'

const catalog = () => new BundledCatalogRepository().load()
const restaurant = async (id: string) => (await catalog()).restaurants.find((r) => r.id === id) as Restaurant
const longBefore = new Date(2026, 0, 1, 9, 0)

const render = (slots: { time: string; available: boolean }[]) => slots.map((s) => `${s.time}${s.available ? '✓' : '✗'}`).join(' ')

describe('Catalog', () => {
  test('AC-catalog-1: the bundled catalog loads with 10 restaurants, 7 cuisines and 6 collections', async () => {
    const loaded = await catalog()
    expect(loaded.restaurants).toHaveLength(10)
    expect(loaded.cuisines).toHaveLength(7)
    expect(loaded.collections).toHaveLength(6)
  })

  test('AC-catalog-2: demo availability returns exactly the test-vector slots, including a closed day', async () => {
    expect(render(DemoAvailability.slots(await restaurant('maison-lumiere'), '2026-11-20', longBefore))).toBe(
      '19:00✓ 19:30✓ 20:00✓ 20:30✓ 21:00✗ 21:30✗ 22:00✓',
    )
    expect(render(DemoAvailability.slots(await restaurant('koyo'), '2026-11-20', longBefore))).toBe('18:30✗ 19:00✗ 19:30✗ 20:00✗ 20:30✗ 21:00✗ 21:30✓')
    expect(render(DemoAvailability.slots(await restaurant('bistro-sept'), '2026-12-05', longBefore))).toBe(
      '18:00✓ 18:30✓ 19:00✗ 19:30✓ 20:00✗ 20:30✓ 21:00✓ 21:30✓',
    )
    const maison = await restaurant('maison-lumiere')
    expect(DemoAvailability.isClosed(maison, '2026-11-23')).toBe(true)
    expect(DemoAvailability.slots(maison, '2026-11-23', longBefore)).toEqual([])
  })

  test("AC-catalog-3: on today's date, slots starting less than 60 minutes from now are not returned", async () => {
    const maison = await restaurant('maison-lumiere')
    const now = new Date(2026, 10, 20, 19, 31)
    expect(DemoAvailability.slots(maison, '2026-11-20', now).map((s) => s.time)).toEqual(['20:30', '21:00', '21:30', '22:00'])
    const exactlyAnHour = new Date(2026, 10, 20, 19, 30)
    expect(DemoAvailability.slots(maison, '2026-11-20', exactlyAnHour)[0].time).toBe('20:30')
  })

  test('AC-catalog-4: fnv1a32 returns the documented values', () => {
    expect(fnv1a32('a')).toBe(3826002220)
    expect(fnv1a32('koyo|2026-11-20|19:00')).toBe(4177624537)
  })

  test('AC-catalog-5: Formatters produce the documented text', () => {
    expect(Formatters.dateShort('2026-11-20')).toBe('Fri, 20 Nov')
    expect(Formatters.dateLong('2026-11-20')).toBe('Friday, 20 November 2026')
    expect(Formatters.time('19:30')).toBe('7:30 PM')
    expect(Formatters.time('00:00')).toBe('12:00 AM')
    expect(Formatters.price(2400)).toBe('₹2,400')
    expect(Formatters.price(125000)).toBe('₹1,25,000')
    expect(Formatters.rating(4.9)).toBe('4.9')
    expect(Formatters.rating(5)).toBe('5.0')
  })

  test('AC-catalog-6: search matching ignores case and diacritics', () => {
    expect(matches('Kōyō', 'koyo')).toBe(true)
    expect(matches('Maison Lumière', 'LUMIERE')).toBe(true)
    expect(matches('Maison Lumière', '  lumi  ')).toBe(true)
    expect(matches('Kōyō', '')).toBe(true)
    expect(matches('Kōyō', 'saffron')).toBe(false)
  })

  test("AC-catalog-7: today's availability is closed, full or available per the rules", async () => {
    const maison = await restaurant('maison-lumiere')
    expect(DemoAvailability.today(maison, new Date(2026, 10, 23, 12, 0))).toBe('closed')
    expect(DemoAvailability.today(maison, new Date(2026, 10, 20, 12, 0))).toBe('available')
    // After the last seating, no slots remain today.
    expect(DemoAvailability.today(maison, new Date(2026, 10, 20, 23, 30))).toBe('full')
    // Kōyō on 20 November with only the 21:30 slot open: once it's within the hour, it's full.
    const koyo = await restaurant('koyo')
    expect(DemoAvailability.today(koyo, new Date(2026, 10, 20, 12, 0))).toBe('available')
    expect(DemoAvailability.today(koyo, new Date(2026, 10, 20, 20, 45))).toBe('full')
  })
})
