import { createFileRoute } from '@tanstack/react-router'
import { isCollectionId, isCuisineId, type CollectionId, type CuisineId } from '#/features/catalog/Catalog'
import { ExploreScreen } from '#/features/explore/ExploreScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export interface ExploreSearch {
  q?: string
  cuisine?: CuisineId
  collection?: CollectionId
}

export const Route = createFileRoute('/_tabs/explore')({
  validateSearch: (search: Record<string, unknown>): ExploreSearch => ({
    q: typeof search.q === 'string' ? search.q : undefined,
    cuisine: isCuisineId(search.cuisine) ? search.cuisine : undefined,
    collection: isCollectionId(search.collection) ? search.collection : undefined,
  }),
  head: () => ({ meta: [{ title: `${strings.exploreTitle} · ${AppIdentity.name}` }] }),
  component: ExploreRoute,
})

function ExploreRoute() {
  return <ExploreScreen search={Route.useSearch()} />
}
