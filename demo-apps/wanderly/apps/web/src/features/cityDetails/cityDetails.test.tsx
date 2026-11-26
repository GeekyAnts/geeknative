// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { strings } from '#/generated/strings'
import { InMemorySavedRepository } from '#/features/saved/InMemorySavedRepository'
import { click, renderApp, testContainer } from '#/testing/renderApp'

describe('City details', () => {
  test('AC-city-details-1: City details shows the cover photograph, name, country and description', async () => {
    const app = await renderApp('/city/paris')
    const hero = app.element.querySelector('[data-testid="city.hero"]')
    expect(hero?.textContent).toContain('Paris')
    expect(hero?.textContent).toContain('France')
    expect(hero?.querySelector('img')?.getAttribute('alt')).toBe('Paris')
    expect(app.element.textContent).toContain('Paris rewards slow walks')
    app.unmount()
  })

  test('AC-city-details-2: City details shows best time to visit, weather, currency and language', async () => {
    const app = await renderApp('/city/paris')
    expect(app.element.textContent).toContain(strings.cityBestTime)
    expect(app.element.textContent).toContain(strings.cityWeather)
    expect(app.element.textContent).toContain(strings.cityCurrency)
    expect(app.element.textContent).toContain(strings.cityLanguage)
    expect(app.element.textContent).toContain('French')
    expect(app.element.textContent).toContain('EUR')
    app.unmount()
  })

  test('AC-city-details-3: City details shows attractions, hotels, restaurants and activities, each with a photograph', async () => {
    const app = await renderApp('/city/paris')
    expect(app.element.querySelector('[data-testid="city.attractions"] img')).not.toBeNull()
    expect(app.element.querySelector('[data-testid="city.hotels"] img')).not.toBeNull()
    expect(app.element.querySelector('[data-testid="city.restaurants"] img')).not.toBeNull()
    expect(app.element.querySelector('[data-testid="city.activities"] img')).not.toBeNull()
    app.unmount()
  })

  test('AC-city-details-4: Plan a Trip opens Trip planner with this destination selected', async () => {
    const app = await renderApp('/city/bali')
    await click(app.element.querySelector('[data-testid="city.planTrip"]'))
    expect(app.router.state.location.pathname).toBe('/planner')
    expect(app.router.state.location.search).toEqual({ destinationId: 'bali' })
    const select = app.element.querySelector('[data-testid="planner.destination"]') as HTMLSelectElement
    expect(select.value).toBe('bali')
    app.unmount()
  })

  test('AC-city-details-5: tapping a place opens Place details', async () => {
    const app = await renderApp('/city/paris')
    await click(app.element.querySelector('[data-testid="city.place.paris-eiffel"]'))
    expect(app.router.state.location.pathname).toBe('/place/paris-eiffel')
    app.unmount()
  })

  test('AC-city-details-6: the save control adds and removes the destination from Saved', async () => {
    const savedRepository = new InMemorySavedRepository()
    const app = await renderApp('/city/bali', testContainer({ savedRepository }))
    await click(app.element.querySelector('[data-testid="city.save"]'))
    expect(await savedRepository.list()).toEqual([{ id: 'bali', kind: 'destination' }])
    await click(app.element.querySelector('[data-testid="city.save"]'))
    expect(await savedRepository.list()).toEqual([])
    app.unmount()
  })

  test('AC-city-details-7: an unknown destination id shows the error state', async () => {
    const app = await renderApp('/city/not-a-city')
    expect(app.element.querySelector('[data-testid="city.error"]')?.textContent).toContain(strings.cityErrorTitle)
    app.unmount()
  })
})
