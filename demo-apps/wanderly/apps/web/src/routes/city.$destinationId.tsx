import { createFileRoute } from '@tanstack/react-router'
import { bundledCatalog } from '#/features/catalog/JsonCatalogRepository'
import { getDestination } from '#/features/catalog/lookups'
import { CityDetailsScreen } from '#/features/cityDetails/CityDetailsScreen'
import { AppIdentity } from '#/generated/app'

export const Route = createFileRoute('/city/$destinationId')({
  head: ({ params }) => {
    const name = getDestination(bundledCatalog, params.destinationId)?.name ?? params.destinationId
    return { meta: [{ title: `${name} · ${AppIdentity.name}` }] }
  },
  component: CityDetailsScreen,
})
