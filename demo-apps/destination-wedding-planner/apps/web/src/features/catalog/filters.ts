import { destinations, experiences, packages, venues } from './WeddingCatalog'
import type { Destination, Venue, WeddingPackage, WeddingStyle } from './types'

export type DestinationFilters = {
  location: string
  style: WeddingStyle | ''
  guests: number
  budget: number
}

export function filterDestinations({ location, style, guests, budget }: DestinationFilters): Destination[] {
  const needle = location.trim().toLowerCase()
  return destinations.filter((destination) => {
    if (needle) {
      const haystack = `${destination.name} ${destination.country} ${destination.region} ${destination.tagline}`.toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    if (style && !destination.styles.includes(style)) return false
    if (guests > 0 && destination.guestCapacityMax < guests) return false
    if (budget > 0 && destination.budgetMin > budget) return false
    return true
  })
}

export type VenueFilters = {
  destinationId: string
  guests: number
  budget: number
}

export function filterVenues({ destinationId, guests, budget }: VenueFilters): Venue[] {
  return venues.filter((venue) => {
    if (destinationId && venue.destinationId !== destinationId) return false
    if (guests > 0 && venue.capacity < guests) return false
    if (budget > 0 && venue.priceFrom > budget) return false
    return true
  })
}

export function seasonalDestinations(month = new Date().getUTCMonth()): Destination[] {
  const season = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month]
  const matched = destinations.filter((destination) => destination.seasonalNote.includes(season))
  return matched.length > 0 ? matched : destinations.slice(0, 3)
}

export type BudgetBreakdown = {
  venue: number
  accommodation: number
  catering: number
  decoration: number
  photography: number
  experiences: number
  total: number
}

export function budgetBreakdown(
  weddingPackage: WeddingPackage,
  guests: number,
  selectedExperienceIds: string[],
): BudgetBreakdown {
  const extraGuests = Math.max(0, guests - weddingPackage.includedGuests)
  const extraCatering = extraGuests * weddingPackage.extraGuestPrice
  const experienceTotal = selectedExperienceIds.reduce((sum, id) => {
    const experience = experiences.find((item) => item.id === id)
    return sum + (experience?.priceFrom ?? 0)
  }, 0)
  return {
    venue: weddingPackage.venueShare,
    accommodation: weddingPackage.accommodationShare,
    catering: weddingPackage.cateringShare + extraCatering,
    decoration: weddingPackage.decorationShare,
    photography: weddingPackage.photographyShare,
    experiences: experienceTotal,
    total: weddingPackage.basePrice + extraCatering + experienceTotal,
  }
}

export function selectedPackage(packageId: string) {
  return packages.find((item) => item.id === packageId) ?? packages[0]
}
