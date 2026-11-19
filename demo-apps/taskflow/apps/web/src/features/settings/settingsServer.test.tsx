// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { AppConfig } from '#/generated/config'
import { strings } from '#/generated/strings'
import { renderApp } from '#/testing/renderApp'

describe('Settings, About', () => {
  test('AC-settings-5: shows the server address from AppConfig.apiBaseUrl', async () => {
    const app = await renderApp('/settings')
    const server = app.element.querySelector('[data-testid="settings.server"]')
    expect(server?.textContent).toBe(AppConfig.apiBaseUrl)
    expect(server?.parentElement?.textContent).toContain(strings.settingsAboutServer)
    app.unmount()
  })
})
