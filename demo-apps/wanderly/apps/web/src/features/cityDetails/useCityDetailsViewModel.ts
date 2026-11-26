import { useParams } from '@tanstack/react-router'
import { getDestination, placesForDestination } from '#/features/catalog/lookups'
import { useCatalog } from '#/features/catalog/useCatalog'
import { useSavedItems } from '#/features/saved/useSavedItems'

export function useCityDetailsViewModel() {
  const { destinationId } = useParams({ from: '/city/$destinationId' })
  const catalogQuery = useCatalog()
  const saved = useSavedItems()
  const catalog = catalogQuery.data
  const destination = catalog ? getDestination(catalog, destinationId) : undefined

  return {
    destination,
    notFound: Boolean(catalog) && !destination,
    fallbackImageUrl: catalog?.fallbackImageUrl ?? '',
    attractions: catalog ? placesForDestination(catalog, destinationId, 'attraction') : [],
    hotels: catalog ? placesForDestination(catalog, destinationId, 'hotel') : [],
    restaurants: catalog ? placesForDestination(catalog, destinationId, 'restaurant') : [],
    activities: catalog ? placesForDestination(catalog, destinationId, 'activity') : [],
    saved: saved.isSaved(destinationId),
    toggleSave: () => saved.toggle({ id: destinationId, kind: 'destination' }),
  }
}
