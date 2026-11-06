// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { strings } from '#/generated/strings'
import { click, fill, renderApp } from '#/testing/renderApp'

describe('Venues UI', () => {
  test('AC-venues-4: submitting a valid enquiry shows the success message', async () => {
    const app = await renderApp('/venues/udaipur-taj-lake')
    await click(app.element.querySelector('[data-testid="venues.enquireCta"]'))
    const form = app.element.querySelector('[data-testid="venues.enquireForm"]') as HTMLFormElement
    const fields = form.querySelectorAll('input, textarea')
    await fill(fields[0], 'Meera and Arjun')
    await fill(fields[1], 'couple@example.com')
    await fill(fields[fields.length - 1], 'A palace wedding in winter.')
    await click(app.element.querySelector('[data-testid="venues.enquireSubmit"]'))
    expect(app.element.textContent).toContain(strings.venuesEnquireSuccess)
    app.unmount()
  })
})
