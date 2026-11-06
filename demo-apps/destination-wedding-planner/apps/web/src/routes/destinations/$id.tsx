import { createFileRoute, notFound } from '@tanstack/react-router'
import { DestinationDetailScreen } from '#/features/destinations/DestinationDetailScreen'
import { destinationById } from '#/features/catalog/WeddingCatalog'
import { AppIdentity } from '#/generated/app'

export const Route = createFileRoute('/destinations/$id')({
  loader: ({ params }) => {
    const destination = destinationById(params.id)
    if (!destination) throw notFound()
    return destination
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.name ?? ''} · ${AppIdentity.name}` }] }),
  component: DestinationDetailRoute,
})

function DestinationDetailRoute() {
  const destination = Route.useLoaderData()
  return <DestinationDetailScreen destination={destination} />
}
