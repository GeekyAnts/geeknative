import { createFileRoute } from '@tanstack/react-router'
import { SavedScreen } from '#/features/saved/SavedScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/_tabs/saved')({
  head: () => ({ meta: [{ title: `${strings.savedTitle} · ${AppIdentity.name}` }] }),
  component: SavedScreen,
})
