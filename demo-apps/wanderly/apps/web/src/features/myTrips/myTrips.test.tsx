// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import type { Trip } from '#/features/catalog/types'
import { InMemoryTripRepository } from '#/features/tripPlanner/InMemoryTripRepository'
import { strings } from '#/generated/strings'
import { click, renderApp, testContainer } from '#/testing/renderApp'

const upcoming: Trip = {
  id: 'upcoming-1',
  destinationId: 'paris',
  title: 'Paris',
  startDate: '2099-01-01',
  endDate: '2099-01-05',
  travelers: 2,
  budgetBand: 'mid',
  interests: [],
  status: 'upcoming',
  days: [{ dayIndex: 1, date: '2099-01-01', items: [] }],
}

describe('My trips UI', () => {
  test('AC-my-trips-2: opening a trip shows its itinerary', async () => {
    const tripRepository = new InMemoryTripRepository([upcoming])
    const app = await renderApp('/trips', testContainer({ tripRepository }))
    await click(app.element.querySelector('[data-testid="trips.card.upcoming-1"]'))
    expect(app.router.state.location.pathname).toBe('/itinerary/upcoming-1')
    expect(app.element.querySelector('[data-testid="itinerary.hero"]')?.textContent).toContain('Paris')
    app.unmount()
  })

  test('AC-my-trips-3: deleting a trip after confirmation removes it from the list and from storage', async () => {
    const tripRepository = new InMemoryTripRepository([upcoming])
    const app = await renderApp('/trips', testContainer({ tripRepository }))
    await click(app.element.querySelector('[data-testid="trips.delete.upcoming-1"]'))
    const confirm = [...app.element.querySelectorAll('button')].find((button) => button.textContent === strings.commonDelete)
    await click(confirm ?? null)
    expect(await tripRepository.list()).toEqual([])
    expect(app.element.querySelector('[data-testid="trips.card.upcoming-1"]')).toBeNull()
    app.unmount()
  })

  test('AC-my-trips-4: an empty segment shows that segment’s empty state', async () => {
    const app = await renderApp('/trips')
    expect(app.element.querySelector('[data-testid="trips.empty"]')?.textContent).toContain(strings.tripsEmptyUpcoming)
    await click(app.element.querySelector('[data-testid="trips.segment.drafts"]'))
    expect(app.element.querySelector('[data-testid="trips.empty"]')?.textContent).toContain(strings.tripsEmptyDrafts)
    app.unmount()
  })
})
