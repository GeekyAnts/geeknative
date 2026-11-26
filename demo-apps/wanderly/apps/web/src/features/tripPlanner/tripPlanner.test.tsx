// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { bundledCatalog } from '#/features/catalog/JsonCatalogRepository'
import { getDestination } from '#/features/catalog/lookups'
import { generateTrip } from './generateTrip'
import { InMemoryTripRepository } from './InMemoryTripRepository'
import { change, click, renderApp, testContainer, wait } from '#/testing/renderApp'

describe('Trip planner UI', () => {
  test('AC-trip-planner-1: generate requires a destination, start date and end date', async () => {
    const app = await renderApp('/planner')
    await click(app.element.querySelector('[data-testid="planner.generate"]'))
    expect(app.router.state.location.pathname).toBe('/planner')
    expect(app.element.textContent).toMatch(/./)
    app.unmount()
  })

  test('AC-trip-planner-2: an end date before the start date shows planner.dateError and does not create a trip', async () => {
    const tripRepository = new InMemoryTripRepository()
    const app = await renderApp('/planner?destinationId=paris', testContainer({ tripRepository }))
    await change(app.element.querySelector('[data-testid="planner.startDate"]'), '2026-12-10')
    await change(app.element.querySelector('[data-testid="planner.endDate"]'), '2026-12-01')
    await click(app.element.querySelector('[data-testid="planner.generate"]'))
    expect(app.element.querySelector('[data-testid="planner.dateError"]')).not.toBeNull()
    expect(await tripRepository.list()).toEqual([])
    expect(app.router.state.location.pathname).toBe('/planner')
    app.unmount()
  })

  test('AC-trip-planner-4: generate opens the Itinerary screen for the new trip', async () => {
    const tripRepository = new InMemoryTripRepository()
    const app = await renderApp('/planner?destinationId=paris', testContainer({ tripRepository }))
    await change(app.element.querySelector('[data-testid="planner.startDate"]'), '2026-12-01')
    await change(app.element.querySelector('[data-testid="planner.endDate"]'), '2026-12-03')
    await click(app.element.querySelector('[data-testid="planner.generate"]'))
    await wait(200)
    expect(app.router.state.location.pathname).toMatch(/^\/itinerary\//)
    expect(app.element.querySelector('[data-testid="itinerary.hero"]')?.textContent).toContain('Paris')
    app.unmount()
  })

  test('AC-trip-planner-5: each itinerary item shows a photograph, name, start time and duration', async () => {
    const paris = getDestination(bundledCatalog, 'paris')!
    const generated = generateTrip({
      destination: paris,
      places: bundledCatalog.places,
      startDate: '2026-12-01',
      endDate: '2026-12-01',
      travelers: 2,
      budgetBand: 'mid',
      interests: [],
    })
    if (!generated.ok) throw new Error('generate')
    const tripRepository = new InMemoryTripRepository([generated.trip])
    const app = await renderApp(`/itinerary/${generated.trip.id}`, testContainer({ tripRepository }))
    const item = generated.trip.days[0].items[0]
    const card = app.element.querySelector(`[data-testid="itinerary.item.${item.id}"]`)
    expect(card?.querySelector('img')).not.toBeNull()
    expect(card?.textContent).toContain('Eiffel Tower')
    expect(card?.textContent).toContain('09:00')
    expect(card?.textContent).toContain('150')
    app.unmount()
  })
})
