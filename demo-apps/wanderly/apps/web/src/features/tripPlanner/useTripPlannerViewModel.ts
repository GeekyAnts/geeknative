import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { categoryIds, type BudgetBand, type CategoryId } from '#/features/catalog/types'
import { useCatalog } from '#/features/catalog/useCatalog'
import { clampTravelers } from '#/features/profile/parseProfile'
import { useProfile } from '#/features/profile/useProfile'
import { generateTrip, type GenerateTripError } from './generateTrip'
import { useTrips } from './useTrips'

export function useTripPlannerViewModel() {
  const catalogQuery = useCatalog()
  const { profile } = useProfile()
  const trips = useTrips()
  const navigate = useNavigate()
  const search = useSearch({ from: '/planner' })
  const catalog = catalogQuery.data
  const [destinationId, setDestinationId] = useState(search.destinationId ?? '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [travelersOverride, setTravelersOverride] = useState<number | undefined>(undefined)
  const [budgetOverride, setBudgetOverride] = useState<BudgetBand | undefined>(undefined)
  const [interestsOverride, setInterestsOverride] = useState<string[] | undefined>(undefined)
  const [error, setError] = useState<GenerateTripError | undefined>(undefined)

  const travelers = travelersOverride ?? profile.defaultTravelers
  const budgetBand = budgetOverride ?? profile.budgetBand
  const interests = interestsOverride ?? profile.preferredCategories

  const toggleInterest = (category: CategoryId) => {
    setInterestsOverride(
      interests.includes(category) ? interests.filter((entry) => entry !== category) : [...interests, category],
    )
  }

  return {
    destinations: catalog?.destinations ?? [],
    destinationId: search.destinationId && !destinationId ? search.destinationId : destinationId,
    startDate,
    endDate,
    travelers,
    budgetBand,
    interests,
    error,
    setDestinationId: (id: string) => setDestinationId(id),
    setStartDate,
    setEndDate,
    setTravelers: (value: number) => setTravelersOverride(clampTravelers(value)),
    setBudgetBand: (band: BudgetBand) => setBudgetOverride(band),
    toggleInterest,
    generate: async () => {
      const selectedId = destinationId || search.destinationId || ''
      const destination = catalog?.destinations.find((entry) => entry.id === selectedId)
      const result = generateTrip({
        destination,
        places: catalog?.places ?? [],
        startDate,
        endDate,
        travelers,
        budgetBand,
        interests,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setError(undefined)
      await trips.upsert(result.trip)
      await navigate({ to: '/itinerary/$tripId', params: { tripId: result.trip.id } })
    },
    categories: categoryIds,
  }
}
