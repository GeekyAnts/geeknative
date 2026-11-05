// @vitest-environment happy-dom
import { renderToString } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'
import { renderApp } from '#/testing/renderApp'
import { HomeScreen } from './HomeScreen'

/** How React escapes text in server-rendered HTML. */
const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')

describe('Home', () => {
  test('AC-home-1: shows the app name as its title', async () => {
    const app = await renderApp('/')
    const title = app.element.querySelector('header a.text-title')
    expect(title?.textContent).toBe(AppIdentity.name)
    app.unmount()
  })

  test("AC-home-2: shows the welcome card's title and text", () => {
    const html = renderToString(<HomeScreen />)
    expect(html).toContain(escapeHtml(strings.homeWelcomeTitle))
    expect(html).toContain(escapeHtml(strings.homeWelcomeBody))
  })
})
