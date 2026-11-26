// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { AppIdentity } from '#/generated/app'
import { InMemoryProfileRepository } from './InMemoryProfileRepository'
import { defaultProfile } from './parseProfile'
import { strings } from '#/generated/strings'
import { click, renderApp, testContainer } from '#/testing/renderApp'

describe('Profile UI', () => {
  test('AC-profile-2: usual travelers, budget and favorite categories prefill Trip planner', async () => {
    const profileRepository = new InMemoryProfileRepository({
      ...defaultProfile(),
      defaultTravelers: 5,
      budgetBand: 'value',
      preferredCategories: ['adventure'],
    })
    const app = await renderApp('/planner', testContainer({ profileRepository }))
    expect(app.element.querySelector('[data-testid="planner.travelers"]')?.textContent).toBe('5')
    expect(app.element.querySelector('[data-testid="planner.budget.value"] input') as HTMLInputElement).toBeTruthy()
    expect((app.element.querySelector('[data-testid="planner.budget.value"] input') as HTMLInputElement).checked).toBe(true)
    expect(app.element.querySelector('[data-testid="planner.interest.adventure"]')?.className).toContain('bg-primary')
    app.unmount()
  })

  test('AC-profile-3: the Settings entry opens Settings', async () => {
    const app = await renderApp('/profile')
    await click(app.element.querySelector('[data-testid="profile.openSettings"]'))
    expect(app.router.state.location.pathname).toBe('/settings')
    expect(app.element.textContent).toContain(strings.settingsTitle)
    app.unmount()
  })

  test('AC-profile-4: Profile shows the app version and build number', async () => {
    const app = await renderApp('/profile')
    const version = app.element.querySelector('[data-testid="profile.version"]')?.textContent ?? ''
    expect(version).toContain(AppIdentity.version)
    expect(version).toContain(String(AppIdentity.build))
    app.unmount()
  })
})
