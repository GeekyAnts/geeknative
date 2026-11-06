export const weddingStyles = ['beach', 'royal', 'garden', 'mountain', 'heritage', 'luxuryResort'] as const
export type WeddingStyle = (typeof weddingStyles)[number]

export const bookingStatuses = ['none', 'enquirySent', 'confirmed'] as const
export type BookingStatus = (typeof bookingStatuses)[number]

export const taskIds = [
  'venue',
  'guests',
  'attire',
  'photography',
  'catering',
  'decor',
  'invitations',
  'travel',
  'ceremony',
  'reception',
] as const
export type TaskId = (typeof taskIds)[number]

export type Destination = {
  id: string
  name: string
  country: string
  region: string
  tagline: string
  description: string
  seasonalNote: string
  styles: WeddingStyle[]
  guestCapacityMin: number
  guestCapacityMax: number
  budgetMin: number
  imageUrl: string
  gallery: string[]
  venueIds: string[]
  packageIds: string[]
}

export type Review = {
  author: string
  rating: number
  body: string
}

export type Venue = {
  id: string
  destinationId: string
  name: string
  description: string
  highlights: string[]
  location: string
  latitude: number
  longitude: number
  capacity: number
  spaces: string[]
  accommodation: string
  amenities: string[]
  priceFrom: number
  packageIds: string[]
  rating: number
  reviewCount: number
  reviews: Review[]
  imageUrl: string
  gallery: string[]
}

export type Experience = {
  id: string
  name: string
  description: string
  priceFrom: number
  imageUrl: string
  icon: 'camera' | 'flower' | 'utensils' | 'sparkles' | 'gem' | 'music' | 'building' | 'car' | 'image' | 'crown'
}

export type WeddingPackage = {
  id: string
  name: string
  description: string
  includedGuests: number
  extraGuestPrice: number
  basePrice: number
  venueShare: number
  accommodationShare: number
  cateringShare: number
  decorationShare: number
  photographyShare: number
  includes: string[]
  imageUrl: string
}

export type Enquiry = {
  id: string
  venueId: string
  experienceId: string
  coupleName: string
  email: string
  date: string
  guests: number
  message: string
  createdAt: string
}

export type WeddingPlan = {
  date: string
  destinationId: string
  venueId: string
  guestCount: number
  budget: number
  packageId: string
  bookingStatus: BookingStatus
  savedDestinationIds: string[]
  savedVenueIds: string[]
  completedTaskIds: string[]
  selectedExperienceIds: string[]
  searchLocation: string
  searchDate: string
  searchGuests: number
  searchBudget: number
}

export const emptyWeddingPlan: WeddingPlan = {
  date: '',
  destinationId: '',
  venueId: '',
  guestCount: 80,
  budget: 0,
  packageId: '',
  bookingStatus: 'none',
  savedDestinationIds: [],
  savedVenueIds: [],
  completedTaskIds: [],
  selectedExperienceIds: [],
  searchLocation: '',
  searchDate: '',
  searchGuests: 0,
  searchBudget: 0,
}

export const PLAN_STORAGE_KEY = 'wedding.plan'
export const ENQUIRIES_STORAGE_KEY = 'wedding.enquiries'
