import { createFileRoute } from '@tanstack/react-router'
import { ExploreScreen } from '#/features/explore/ExploreScreen'
import { isCategoryId } from '#/features/catalog/types'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export type ExploreSearch = {
  q?: string
  category?: 'beaches' | 'mountains' | 'adventure' | 'history' | 'food'
}

export const Route = createFileRoute('/explore')({
  validateSearch: (search: Record<string, unknown>): ExploreSearch => ({
    q: typeof search.q === 'string' && search.q.length > 0 ? search.q : undefined,
    category: isCategoryId(search.category) ? search.category : undefined,
  }),
  head: () => ({ meta: [{ title: `${strings.exploreTitle} · ${AppIdentity.name}` }] }),
  component: ExploreScreen,
})
