import type { CollectionId, CuisineId, Restaurant } from '#/features/catalog/Catalog'
import { DemoAvailability } from '#/features/catalog/DemoAvailability'
import { amenityLabel, collectionTitle, cuisineLabel } from '#/features/catalog/Labels'
import { matches } from '#/features/catalog/SearchMatching'

export interface ExploreFilters {
  query: string
  cuisines: Set<CuisineId>
  neighbourhoods: Set<string>
  priceLevels: Set<number>
  minRating: number | null
  availableToday: boolean
  collection: CollectionId | null
}

export const defaultFilters = (): ExploreFilters => ({
  query: '',
  cuisines: new Set(),
  neighbourhoods: new Set(),
  priceLevels: new Set(),
  minRating: null,
  availableToday: false,
  collection: null,
})

export const ratingOptions = [4.5, 4.7, 4.8] as const
export const priceLevelOptions = [1, 2, 3, 4] as const

export const exploreSorts = ['popularity', 'rating', 'distance'] as const
export type ExploreSort = (typeof exploreSorts)[number]

export const viewModes = ['list', 'grid'] as const
export type ViewMode = (typeof viewModes)[number]
export const VIEW_MODE_STORAGE_KEY = 'explore.viewMode'
export const parseViewMode = (value: string | null | undefined): ViewMode => (value === 'grid' ? 'grid' : 'list')

/** The number on the filter badge. The query isn't counted. */
export function activeFilterCount(filters: ExploreFilters): number {
  return (
    [filters.cuisines, filters.neighbourhoods, filters.priceLevels].filter((set) => set.size > 0).length +
    (filters.minRating !== null ? 1 : 0) +
    (filters.availableToday ? 1 : 0) +
    (filters.collection !== null ? 1 : 0)
  )
}

/** Whether a restaurant matches the free-text query in its name, cuisine, neighbourhood, tagline, collections or amenities. */
export function matchesQuery(restaurant: Restaurant, query: string): boolean {
  if (query.trim() === '') return true
  const fields = [
    restaurant.name,
    cuisineLabel(restaurant.cuisine),
    restaurant.neighbourhood,
    restaurant.tagline,
    ...restaurant.collections.map(collectionTitle),
    ...restaurant.amenities.map(amenityLabel),
  ]
  return fields.some((field) => matches(field, query))
}

export function matchesFilters(restaurant: Restaurant, filters: ExploreFilters, now: Date): boolean {
  return (
    matchesQuery(restaurant, filters.query) &&
    (filters.cuisines.size === 0 || filters.cuisines.has(restaurant.cuisine)) &&
    (filters.neighbourhoods.size === 0 || filters.neighbourhoods.has(restaurant.neighbourhood)) &&
    (filters.priceLevels.size === 0 || filters.priceLevels.has(restaurant.priceLevel)) &&
    (filters.minRating === null || restaurant.rating >= filters.minRating) &&
    (!filters.availableToday || DemoAvailability.today(restaurant, now) === 'available') &&
    (filters.collection === null || restaurant.collections.includes(filters.collection))
  )
}

/** Sorted copy; ties keep catalog order (Array.prototype.sort is stable). */
export function sortRestaurants(restaurants: Restaurant[], sort: ExploreSort): Restaurant[] {
  const sorted = [...restaurants]
  switch (sort) {
    case 'popularity':
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount)
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    case 'distance':
      return sorted.sort((a, b) => a.distanceKm - b.distanceKm)
  }
}

export function exploreResults(restaurants: Restaurant[], filters: ExploreFilters, sort: ExploreSort, now: Date): Restaurant[] {
  return sortRestaurants(
    restaurants.filter((r) => matchesFilters(r, filters, now)),
    sort,
  )
}

/** Distinct catalog neighbourhoods, sorted alphabetically. */
export function neighbourhoodsOf(restaurants: Restaurant[]): string[] {
  return [...new Set(restaurants.map((r) => r.neighbourhood))].sort((a, b) => a.localeCompare(b))
}

export const copyFilters = (filters: ExploreFilters): ExploreFilters => ({
  ...filters,
  cuisines: new Set(filters.cuisines),
  neighbourhoods: new Set(filters.neighbourhoods),
  priceLevels: new Set(filters.priceLevels),
})

export function toggled<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}
