import { createFileRoute } from '@tanstack/react-router'
import { PackagesScreen } from '#/features/packages/PackagesScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/packages')({
  head: () => ({ meta: [{ title: `${strings.packagesTitle} · ${AppIdentity.name}` }] }),
  component: PackagesScreen,
})
