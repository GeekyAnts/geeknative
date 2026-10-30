import { AppCard } from '#/core/designsystem/AppCard'
import { Page } from '#/core/designsystem/Page'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export function HomeScreen() {
  return (
    <Page>
      <h1 className="text-display">{AppIdentity.name}</h1>
      <AppCard>
        <h2 className="text-title">{strings.homeWelcomeTitle}</h2>
        <p className="mt-sm text-body text-on-surface-variant">{strings.homeWelcomeBody}</p>
      </AppCard>
    </Page>
  )
}
