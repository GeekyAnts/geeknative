import { createFileRoute } from '@tanstack/react-router'
import { ExperiencesScreen } from '#/features/experiences/ExperiencesScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/experiences')({
  head: () => ({ meta: [{ title: `${strings.experiencesTitle} · ${AppIdentity.name}` }] }),
  component: ExperiencesScreen,
})
