import type { Catalog, Destination, Place, PlaceKind } from './types'

export function getDestination(catalog: Catalog, id: string): Destination | undefined {
  return catalog.destinations.find((destination) => destination.id === id)
}

export function getPlace(catalog: Catalog, id: string): Place | undefined {
  return catalog.places.find((place) => place.id === id)
}

export function placesForDestination(catalog: Catalog, destinationId: string, kind?: PlaceKind): Place[] {
  return catalog.places.filter(
    (place) => place.destinationId === destinationId && (kind === undefined || place.kind === kind),
  )
}

export function featuredDestination(catalog: Catalog): Destination | undefined {
  return catalog.destinations.find((destination) => destination.featured)
}

export function trendingDestinations(catalog: Catalog): Destination[] {
  return catalog.destinations.filter((destination) => destination.trending)
}

export function popularPlaces(catalog: Catalog): Place[] {
  return catalog.places.filter((place) => place.popular)
}

export function inspirationDestinations(catalog: Catalog): Destination[] {
  return catalog.inspirationDestinationIds
    .map((id) => getDestination(catalog, id))
    .filter((destination): destination is Destination => destination !== undefined)
}
