import { getDestination, getPlace } from '#/features/catalog/lookups'
import { useCatalog } from '#/features/catalog/useCatalog'
import { useSavedItems } from './useSavedItems'

export function useSavedViewModel() {
  const catalogQuery = useCatalog()
  const saved = useSavedItems()
  const catalog = catalogQuery.data
  const destinations = saved.items
    .filter((item) => item.kind === 'destination')
    .map((item) => (catalog ? getDestination(catalog, item.id) : undefined))
    .filter((destination) => destination !== undefined)
  const places = saved.items
    .filter((item) => item.kind !== 'destination')
    .map((item) => (catalog ? getPlace(catalog, item.id) : undefined))
    .filter((place) => place !== undefined)

  return {
    destinations,
    places,
    isEmpty: destinations.length === 0 && places.length === 0,
    fallbackImageUrl: catalog?.fallbackImageUrl ?? '',
    unsave: saved.toggle,
  }
}
