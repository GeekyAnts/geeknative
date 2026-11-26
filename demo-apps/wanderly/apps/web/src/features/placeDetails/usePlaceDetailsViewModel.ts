import { useRef, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { getDestination, getPlace } from '#/features/catalog/lookups'
import { useCatalog } from '#/features/catalog/useCatalog'
import { useSavedItems } from '#/features/saved/useSavedItems'
import { addPlaceToTripDayOne } from '#/features/tripPlanner/editTrip'
import { useTrips } from '#/features/tripPlanner/useTrips'
import { closeDialog, openDialog } from '#/core/designsystem/openDialog'

export function usePlaceDetailsViewModel() {
  const { placeId } = useParams({ from: '/place/$placeId' })
  const catalogQuery = useCatalog()
  const saved = useSavedItems()
  const tripsState = useTrips()
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [added, setAdded] = useState(false)
  const catalog = catalogQuery.data
  const place = catalog ? getPlace(catalog, placeId) : undefined
  const destination = catalog && place ? getDestination(catalog, place.destinationId) : undefined
  const matchingTrips = tripsState.trips.filter(
    (trip) =>
      place !== undefined &&
      trip.destinationId === place.destinationId &&
      (trip.status === 'draft' || trip.status === 'upcoming'),
  )

  return {
    place,
    destination,
    notFound: Boolean(catalog) && !place,
    fallbackImageUrl: catalog?.fallbackImageUrl ?? '',
    gallery: place ? [place.imageUrl, ...(place.gallery ?? [])] : [],
    saved: saved.isSaved(placeId),
    matchingTrips,
    added,
    dialogRef,
    toggleSave: () => {
      if (!place) return
      return saved.toggle({ id: place.id, kind: place.kind })
    },
    openAddToTrip: () => openDialog(dialogRef.current),
    closeAddToTrip: () => closeDialog(dialogRef.current),
    addToTrip: async (tripId: string) => {
      if (!place) return
      const trip = tripsState.trips.find((entry) => entry.id === tripId)
      if (!trip) return
      await tripsState.upsert(addPlaceToTripDayOne(trip, place))
      closeDialog(dialogRef.current)
      setAdded(true)
    },
    startTrip: () => {
      if (!place) return
      closeDialog(dialogRef.current)
      void navigate({ to: '/planner', search: { destinationId: place.destinationId } })
    },
  }
}
