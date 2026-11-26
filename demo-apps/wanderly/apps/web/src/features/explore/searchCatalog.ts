import type { Catalog, CategoryId, Destination, Place } from '#/features/catalog/types'

export function searchCatalog(
  catalog: Catalog,
  options: { q?: string; category?: CategoryId },
): { destinations: Destination[]; places: Place[] } {
  const query = options.q?.trim() ?? ''
  const category = options.category
  let destinations = catalog.destinations
  let places = catalog.places

  if (category) {
    destinations = destinations.filter((destination) => destination.categories.includes(category))
    places = places.filter((place) => place.category === category)
  }

  if (query) {
    const needle = query.toLowerCase()
    destinations = destinations.filter((destination) =>
      [destination.name, destination.country, destination.tagline, destination.description].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    )
    places = places.filter((place) =>
      [place.name, place.summary, place.description, place.location].some((value) => value.toLowerCase().includes(needle)),
    )
  } else if (!category) {
    places = [...places.filter((place) => place.popular), ...places.filter((place) => !place.popular)]
  }

  return { destinations, places }
}
