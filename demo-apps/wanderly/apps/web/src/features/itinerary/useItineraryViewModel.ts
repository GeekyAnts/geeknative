import { useRef, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { closeDialog, openDialog } from '#/core/designsystem/openDialog'
import { getDestination, getPlace, placesForDestination } from '#/features/catalog/lookups'
import { useCatalog } from '#/features/catalog/useCatalog'
import type { Place } from '#/features/catalog/types'
import {
  addPlaceToDay,
  moveItem,
  removeItem,
  saveTripStatus,
  toggleComplete,
} from '#/features/tripPlanner/editTrip'
import { tripBudget } from '#/features/tripPlanner/budget'
import { useTrips } from '#/features/tripPlanner/useTrips'

export function useItineraryViewModel() {
  const { tripId } = useParams({ from: '/itinerary/$tripId' })
  const catalogQuery = useCatalog()
  const tripsState = useTrips()
  const addDialogRef = useRef<HTMLDialogElement>(null)
  const [addDayIndex, setAddDayIndex] = useState(1)
  const catalog = catalogQuery.data
  const trip = tripsState.trips.find((entry) => entry.id === tripId)
  const destination = catalog && trip ? getDestination(catalog, trip.destinationId) : undefined
  const budget = destination && trip ? tripBudget(destination, trip) : undefined
  const addDayPlaces: Place[] =
    catalog && trip
      ? placesForDestination(catalog, trip.destinationId).filter((place) => {
          const day = trip.days.find((entry) => entry.dayIndex === addDayIndex)
          return !day?.items.some((item) => item.placeId === place.id)
        })
      : []

  return {
    ready: tripsState.ready,
    trip,
    destination,
    budget,
    fallbackImageUrl: catalog?.fallbackImageUrl ?? '',
    place: (id: string) => (catalog ? getPlace(catalog, id) : undefined),
    addDialogRef,
    addDayPlaces,
    complete: (itemId: string) => trip && tripsState.upsert(toggleComplete(trip, itemId)),
    remove: (itemId: string) => trip && tripsState.upsert(removeItem(trip, itemId)),
    move: (itemId: string, direction: 'up' | 'down') => trip && tripsState.upsert(moveItem(trip, itemId, direction)),
    openAdd: (dayIndex: number) => {
      setAddDayIndex(dayIndex)
      openDialog(addDialogRef.current)
    },
    addPlace: async (place: Place) => {
      if (!trip) return
      await tripsState.upsert(addPlaceToDay(trip, addDayIndex, place))
      closeDialog(addDialogRef.current)
    },
    saveTrip: () => trip && tripsState.upsert(saveTripStatus(trip)),
  }
}
