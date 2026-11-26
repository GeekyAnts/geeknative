import { useRef, useState } from 'react'
import { closeDialog, openDialog } from '#/core/designsystem/openDialog'
import { getDestination } from '#/features/catalog/lookups'
import { useCatalog } from '#/features/catalog/useCatalog'
import { tripSegment, type TripSegment } from '#/features/tripPlanner/parseTrip'
import { useTrips } from '#/features/tripPlanner/useTrips'

export function useMyTripsViewModel() {
  const catalogQuery = useCatalog()
  const tripsState = useTrips()
  const [segment, setSegment] = useState<TripSegment>('upcoming')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | undefined>(undefined)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const catalog = catalogQuery.data
  const trips = tripsState.trips.filter((trip) => tripSegment(trip) === segment)

  return {
    ready: tripsState.ready,
    segment,
    setSegment,
    trips,
    fallbackImageUrl: catalog?.fallbackImageUrl ?? '',
    destination: (id: string) => (catalog ? getDestination(catalog, id) : undefined),
    dialogRef,
    requestDelete: (id: string) => {
      setPendingDeleteId(id)
      openDialog(dialogRef.current)
    },
    confirmDelete: async () => {
      if (pendingDeleteId) await tripsState.remove(pendingDeleteId)
      setPendingDeleteId(undefined)
      closeDialog(dialogRef.current)
    },
    cancelDelete: () => {
      setPendingDeleteId(undefined)
      closeDialog(dialogRef.current)
    },
  }
}
