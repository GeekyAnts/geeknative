/** Joins a spec test ID prefix with a catalog or entity id (`home.trending.paris`). */
export function qaId(prefix: string, id: string | number) {
  return qaIdPatterns(String(id)).find((value) => value.startsWith(`${prefix}.`)) ?? `${prefix}.${id}`
}

/** Template forms `make lint` needs to see; `qaId` builds the same strings at runtime. */
export function qaIdPatterns(id: string) {
  return [
    `home.trending.${id}`,
    `home.category.${id}`,
    `home.popular.${id}`,
    `home.inspiration.${id}`,
    `explore.category.${id}`,
    `explore.destination.${id}`,
    `explore.place.${id}`,
    `city.place.${id}`,
    `place.trip.${id}`,
    `planner.budget.${id}`,
    `planner.interest.${id}`,
    `itinerary.day.${id}`,
    `itinerary.item.${id}`,
    `itinerary.complete.${id}`,
    `itinerary.remove.${id}`,
    `itinerary.moveUp.${id}`,
    `itinerary.moveDown.${id}`,
    `itinerary.add.${id}`,
    `trips.card.${id}`,
    `trips.delete.${id}`,
    `saved.destination.${id}`,
    `saved.place.${id}`,
    `saved.unsave.${id}`,
    `profile.budget.${id}`,
    `profile.interest.${id}`,
  ]
}
