// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { destinationById, venueById } from '#/features/catalog/WeddingCatalog'
import { emptyWeddingPlan } from '#/features/catalog/types'
import { InMemoryWeddingRepository } from './InMemoryWeddingRepository'
import { renderApp, testContainer } from '#/testing/renderApp'

describe('Wedding UI', () => {
  test('AC-wedding-2: Wedding shows the selected destination and venue names', async () => {
    const repository = new InMemoryWeddingRepository({
      ...emptyWeddingPlan,
      date: '2026-12-01',
      destinationId: 'udaipur',
      venueId: 'udaipur-taj-lake',
    })
    const app = await renderApp('/wedding', testContainer({ weddingRepository: repository }))
    expect(app.element.textContent).toContain(destinationById('udaipur')?.name)
    expect(app.element.textContent).toContain(venueById('udaipur-taj-lake')?.name)
    app.unmount()
  })
})
