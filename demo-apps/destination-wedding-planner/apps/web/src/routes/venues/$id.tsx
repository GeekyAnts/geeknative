import { createFileRoute, notFound } from '@tanstack/react-router'
import { VenueDetailScreen } from '#/features/venues/VenueDetailScreen'
import { venueById } from '#/features/catalog/WeddingCatalog'
import { AppIdentity } from '#/generated/app'

export const Route = createFileRoute('/venues/$id')({
  loader: ({ params }) => {
    const venue = venueById(params.id)
    if (!venue) throw notFound()
    return venue
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.name ?? ''} · ${AppIdentity.name}` }] }),
  component: VenueDetailRoute,
})

function VenueDetailRoute() {
  const venue = Route.useLoaderData()
  return <VenueDetailScreen venue={venue} />
}
