import { createFileRoute } from '@tanstack/react-router'
import { bundledCatalog } from '#/features/catalog/JsonCatalogRepository'
import { getPlace } from '#/features/catalog/lookups'
import { PlaceDetailsScreen } from '#/features/placeDetails/PlaceDetailsScreen'
import { AppIdentity } from '#/generated/app'

export const Route = createFileRoute('/place/$placeId')({
  head: ({ params }) => {
    const name = getPlace(bundledCatalog, params.placeId)?.name ?? params.placeId
    return { meta: [{ title: `${name} · ${AppIdentity.name}` }] }
  },
  component: PlaceDetailsScreen,
})
