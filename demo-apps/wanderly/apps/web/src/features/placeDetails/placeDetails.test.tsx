// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { strings } from '#/generated/strings'
import { InMemorySavedRepository } from '#/features/saved/InMemorySavedRepository'
import { InMemoryTripRepository } from '#/features/tripPlanner/InMemoryTripRepository'
import type { Trip } from '#/features/catalog/types'
import { click, renderApp, testContainer } from '#/testing/renderApp'

const draftParis: Trip = {
  id: 'trip-paris',
  destinationId: 'paris',
  title: 'Paris',
  startDate: '2026-12-01',
  endDate: '2026-12-03',
  travelers: 2,
  budgetBand: 'mid',
  interests: [],
  status: 'draft',
  days: [{ dayIndex: 1, date: '2026-12-01', items: [] }],
}

describe('Place details', () => {
  test('AC-place-details-1: Place details shows a photograph, name, rating, location, description, opening hours and duration', async () => {
    const app = await renderApp('/place/paris-eiffel')
    const hero = app.element.querySelector('[data-testid="place.hero"]')
    expect(hero?.textContent).toContain('Eiffel Tower')
    expect(hero?.querySelector('img')?.getAttribute('alt')).toBe('Eiffel Tower')
    expect(app.element.textContent).toContain(strings.placeLocation)
    expect(app.element.textContent).toContain('Champ de Mars')
    expect(app.element.textContent).toContain(strings.placeHours)
    expect(app.element.textContent).toContain('09:00–00:45')
    expect(app.element.textContent).toContain(strings.placeDuration({ minutes: '150' }))
    expect(app.element.textContent).toContain('Climb or ride')
    app.unmount()
  })

  test('AC-place-details-2: Save adds and removes the place from Saved', async () => {
    const savedRepository = new InMemorySavedRepository()
    const app = await renderApp('/place/paris-eiffel', testContainer({ savedRepository }))
    await click(app.element.querySelector('[data-testid="place.save"]'))
    expect(await savedRepository.list()).toEqual([{ id: 'paris-eiffel', kind: 'attraction' }])
    await click(app.element.querySelector('[data-testid="place.save"]'))
    expect(await savedRepository.list()).toEqual([])
    app.unmount()
  })

  test('AC-place-details-3: Add to Trip either lists matching trips or opens Trip planner for this destination', async () => {
    const empty = await renderApp('/place/paris-eiffel')
    await click(empty.element.querySelector('[data-testid="place.addToTrip"]'))
    await click(empty.element.querySelector('[data-testid="place.startTrip"]'))
    expect(empty.router.state.location.pathname).toBe('/planner')
    expect(empty.router.state.location.search).toEqual({ destinationId: 'paris' })
    empty.unmount()

    const tripRepository = new InMemoryTripRepository([draftParis])
    const listed = await renderApp('/place/paris-eiffel', testContainer({ tripRepository }))
    await click(listed.element.querySelector('[data-testid="place.addToTrip"]'))
    expect(listed.element.querySelector('[data-testid="place.trip.trip-paris"]')).not.toBeNull()
    listed.unmount()
  })

  test('AC-place-details-4: an unknown place id shows the error state', async () => {
    const app = await renderApp('/place/missing-place')
    expect(app.element.querySelector('[data-testid="place.error"]')?.textContent).toContain(strings.placeErrorTitle)
    app.unmount()
  })
})
