import { renderToString } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'
import { HomeScreen } from './HomeScreen'

/** How React escapes text in server-rendered HTML. */
const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')

describe('Home', () => {
  const html = renderToString(<HomeScreen />)

  test('AC-home-1: shows the app name as its title', () => {
    expect(html).toContain(`>${escapeHtml(AppIdentity.name)}</h1>`)
  })

  test("AC-home-2: shows the welcome card's title and text", () => {
    expect(html).toContain(escapeHtml(strings.homeWelcomeTitle))
    expect(html).toContain(escapeHtml(strings.homeWelcomeBody))
  })
})
