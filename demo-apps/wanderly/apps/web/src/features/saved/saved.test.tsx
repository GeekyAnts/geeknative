// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { InMemorySavedRepository } from './InMemorySavedRepository'
import { strings } from '#/generated/strings'
import { click, renderApp, testContainer } from '#/testing/renderApp'

describe('Saved UI', () => {
  test('AC-saved-1: Saved lists destinations and places the traveler has saved, with photographs', async () => {
    const savedRepository = new InMemorySavedRepository([
      { id: 'bali', kind: 'destination' },
      { id: 'paris-eiffel', kind: 'attraction' },
    ])
    const app = await renderApp('/saved', testContainer({ savedRepository }))
    expect(app.element.querySelector('[data-testid="saved.destination.bali"] img')?.getAttribute('alt')).toBe('Bali')
    expect(app.element.querySelector('[data-testid="saved.place.paris-eiffel"]')?.textContent).toContain('Eiffel Tower')
    app.unmount()
  })

  test('AC-saved-2: unsaving from this screen removes the item from the list and from storage', async () => {
    const savedRepository = new InMemorySavedRepository([{ id: 'bali', kind: 'destination' }])
    const app = await renderApp('/saved', testContainer({ savedRepository }))
    await click(app.element.querySelector('[data-testid="saved.unsave.bali"]'))
    expect(await savedRepository.list()).toEqual([])
    expect(app.element.querySelector('[data-testid="saved.destination.bali"]')).toBeNull()
    app.unmount()
  })

  test('AC-saved-3: when nothing is saved, the empty state is shown', async () => {
    const app = await renderApp('/saved')
    expect(app.element.querySelector('[data-testid="saved.empty"]')?.textContent).toContain(strings.savedEmptyTitle)
    app.unmount()
  })

  test('AC-saved-4: opening a saved destination shows City details', async () => {
    const savedRepository = new InMemorySavedRepository([{ id: 'bali', kind: 'destination' }])
    const app = await renderApp('/saved', testContainer({ savedRepository }))
    await click(app.element.querySelector('[data-testid="saved.destination.bali"]'))
    expect(app.router.state.location.pathname).toBe('/city/bali')
    app.unmount()
  })
})
