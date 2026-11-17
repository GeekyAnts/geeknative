// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { AppIdentity } from '#/generated/app'
import { click, renderApp } from '#/testing/renderApp'

describe('Site header', () => {
  test('the app name is a link to Home', async () => {
    const app = await renderApp('/settings')
    const name = app.element.querySelector('header a.text-title')
    expect(name?.textContent).toBe(AppIdentity.name)
    expect(name?.getAttribute('href')).toBe('/')
    await click(name)
    expect(app.router.state.location.pathname).toBe('/')
    app.unmount()
  })
})
