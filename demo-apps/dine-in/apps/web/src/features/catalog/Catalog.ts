/** The catalog model (spec/features/catalog.md). Field names match the iOS and Android apps. */

export const cuisineIds = ['italian', 'japanese', 'indian', 'french', 'mediterranean', 'asian', 'continental'] as const
export type CuisineId = (typeof cuisineIds)[number]

export const collectionIds = ['mostLoved', 'fineDining', 'romantic', 'rooftop', 'hiddenGems', 'chefsPicks'] as const
export type CollectionId = (typeof collectionIds)[number]

export const amenityIds = [
  'valet',
  'sommelier',
  'privateDining',
  'liveMusic',
  'rooftop',
  'accessible',
  'bar',
  'chefsTable',
  'garden',
  'wifi',
] as const
export type AmenityId = (typeof amenityIds)[number]

export const seatings = ['indoor', 'outdoor', 'window', 'private'] as const
export type Seating = (typeof seatings)[number]

export const occasions = ['none', 'birthday', 'anniversary', 'business', 'date', 'celebration'] as const
export type Occasion = (typeof occasions)[number]

/** In the order listed in PRODUCT.md. */
export const dietaryOptions = ['vegetarian', 'vegan', 'glutenFree', 'dairyFree', 'nutAllergy', 'shellfishAllergy'] as const
export type Dietary = (typeof dietaryOptions)[number]

export const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Weekday = (typeof weekdays)[number]

export interface OpeningPeriod {
  open: string
  close: string
}

export interface Dish {
  name: string
  description: string
  price: number
  image: string
}

export interface MenuItem {
  name: string
  description: string
  price: number
}

export interface Review {
  author: string
  rating: number
  date: string
  text: string
}

export interface Restaurant {
  id: string
  name: string
  cuisine: CuisineId
  neighbourhood: string
  address: string
  phone: string
  latitude: number
  longitude: number
  distanceKm: number
  rating: number
  reviewCount: number
  priceLevel: number
  costForTwo: number
  tagline: string
  about: string
  ambience: string
  dressCode: string | null
  featured: boolean
  collections: CollectionId[]
  amenities: AmenityId[]
  seating: Seating[]
  maxPartySize: number
  demandPercent: number
  openingHours: Record<Weekday, OpeningPeriod | null>
  heroImage: string
  gallery: string[]
  signatureDishes: Dish[]
  menuHighlights: MenuItem[]
  reviews: Review[]
}

export interface Collection {
  id: CollectionId
  image: string
}

export interface Catalog {
  version: number
  heroImage: string
  welcomeImage: string
  cuisines: CuisineId[]
  collections: Collection[]
  restaurants: Restaurant[]
}

const isOneOf =
  <T extends string>(values: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === 'string' && (values as readonly string[]).includes(value)

export const isCuisineId = isOneOf(cuisineIds)
export const isCollectionId = isOneOf(collectionIds)
export const isAmenityId = isOneOf(amenityIds)
export const isSeating = isOneOf(seatings)
export const isOccasion = isOneOf(occasions)
export const isDietary = isOneOf(dietaryOptions)

type Raw = Record<string, unknown>

/**
 * Builds a `Catalog` from the bundled JSON. Unknown enum values are skipped (an unknown amenity is
 * dropped; a restaurant with an unknown cuisine is dropped), so an older app keeps working with a newer catalog.
 */
export function parseCatalog(json: unknown): Catalog {
  const raw = json as Raw
  const restaurants = ((raw.restaurants as Raw[]) ?? []).filter((r) => isCuisineId(r.cuisine)).map(parseRestaurant)
  return {
    version: Number(raw.version),
    heroImage: String(raw.heroImage),
    welcomeImage: String(raw.welcomeImage),
    cuisines: ((raw.cuisines as unknown[]) ?? []).filter(isCuisineId),
    collections: ((raw.collections as Raw[]) ?? [])
      .filter((c) => isCollectionId(c.id))
      .map((c) => ({ id: c.id as CollectionId, image: String(c.image) })),
    restaurants,
  }
}

function parseRestaurant(r: Raw): Restaurant {
  const hours = (r.openingHours ?? {}) as Record<string, OpeningPeriod | null>
  return {
    ...(r as unknown as Restaurant),
    dressCode: typeof r.dressCode === 'string' ? r.dressCode : null,
    collections: ((r.collections as unknown[]) ?? []).filter(isCollectionId),
    amenities: ((r.amenities as unknown[]) ?? []).filter(isAmenityId),
    seating: ((r.seating as unknown[]) ?? []).filter(isSeating),
    openingHours: Object.fromEntries(weekdays.map((day) => [day, hours[day] ?? null])) as Record<Weekday, OpeningPeriod | null>,
    gallery: (r.gallery as string[]) ?? [],
    signatureDishes: (r.signatureDishes as Dish[]) ?? [],
    menuHighlights: (r.menuHighlights as MenuItem[]) ?? [],
    reviews: (r.reviews as Review[]) ?? [],
  }
}
