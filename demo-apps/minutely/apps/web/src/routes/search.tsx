import { createFileRoute } from '@tanstack/react-router'
import { SearchScreen } from '#/features/search/SearchScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search.q === 'string' && search.q !== '' ? { q: search.q } : {},
  head: () => ({ meta: [{ title: `${strings.searchTitle} · ${AppIdentity.name}` }] }),
  component: SearchScreen,
})
