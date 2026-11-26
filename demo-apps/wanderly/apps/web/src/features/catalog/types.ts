export const categoryIds = ['beaches', 'mountains', 'adventure', 'history', 'food'] as const
export type CategoryId = (typeof categoryIds)[number]

export const placeKinds = ['attraction', 'hotel', 'restaurant', 'activity'] as const
export type PlaceKind = (typeof placeKinds)[number]

export type SavedKind = 'destination' | PlaceKind

export const budgetBands = ['value', 'mid', 'luxury'] as const
export type BudgetBand = (typeof budgetBands)[number]

export type TripStatus = 'draft' | 'upcoming' | 'past'

export interface Weather {
  summary: string
  tempC: number
  season: string
}

export interface BudgetEstimate {
  lodging: number
  food: number
  activities: number
}

export interface ItineraryTemplateItem {
  placeId: string
  startTime: string
  durationMinutes: number
}

export interface ItineraryTemplate {
  title: string
  items: ItineraryTemplateItem[]
}

export interface Destination {
  id: string
  name: string
  country: string
  tagline: string
  description: string
  imageUrl: string
  gallery?: string[]
  categories: CategoryId[]
  trending: boolean
  featured: boolean
  bestTimeToVisit: string
  currency: string
  currencySymbol: string
  language: string
  weather: Weather
  travelTips: string[]
  budgetEstimates: Record<BudgetBand, BudgetEstimate>
  itineraryTemplates: ItineraryTemplate[]
}

export interface Place {
  id: string
  destinationId: string
  kind: PlaceKind
  name: string
  summary: string
  description: string
  imageUrl: string
  gallery?: string[]
  location: string
  category: CategoryId
  rating: number
  reviewCount: number
  openingHours: string
  durationMinutes: number
  priceLevel: number
  popular: boolean
  pricePerNight?: number
}

export interface Catalog {
  fallbackImageUrl: string
  inspirationDestinationIds: string[]
  destinations: Destination[]
  places: Place[]
}

export interface SavedItem {
  id: string
  kind: SavedKind
}

export interface TripItem {
  id: string
  placeId: string
  startTime: string
  durationMinutes: number
  completed: boolean
}

export interface TripDay {
  dayIndex: number
  date: string
  items: TripItem[]
}

export interface Trip {
  id: string
  destinationId: string
  title: string
  startDate: string
  endDate: string
  travelers: number
  budgetBand: BudgetBand
  interests: string[]
  status: TripStatus
  days: TripDay[]
}

export interface Profile {
  displayName: string
  email: string
  defaultTravelers: number
  budgetBand: BudgetBand
  preferredCategories: string[]
}

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && (categoryIds as readonly string[]).includes(value)
}

export function isPlaceKind(value: unknown): value is PlaceKind {
  return typeof value === 'string' && (placeKinds as readonly string[]).includes(value)
}

export function isBudgetBand(value: unknown): value is BudgetBand {
  return typeof value === 'string' && (budgetBands as readonly string[]).includes(value)
}

export function isSavedKind(value: unknown): value is SavedKind {
  return value === 'destination' || isPlaceKind(value)
}
