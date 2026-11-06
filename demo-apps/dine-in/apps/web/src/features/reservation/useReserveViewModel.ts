import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouteContext, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { DemoAvailability } from '#/features/catalog/DemoAvailability'
import { useCatalog } from '#/features/catalog/useCatalog'
import { usePreferences } from '#/features/profile/usePreferences'
import { isUpcoming, orderedDietary, type ReservationDraft } from '#/features/reservations/Reservation'
import { MAX_NOTES_LENGTH, ReservationError, ReservationValidator, type ReservationErrorCode } from '#/features/reservations/ReservationValidator'
import { invalidateReservations, useReservations } from '#/features/reservations/useReservations'
import { clampPartySize, defaultDraft, draftFromReservation, isLargeParty, reserveSteps, slotsFor, withDate, type ReserveStep } from './ReserveLogic'

export type ReserveStatus = 'loading' | 'error' | 'notFound' | 'reservationNotFound' | 'ready'

/** The three-step Reserve flow for a new booking, a "book again", or modifying `reservationId`. */
export function useReserveViewModel(restaurantId: string, reservationId?: string) {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const catalog = useCatalog()
  const { query: preferencesQuery, preferences } = usePreferences()
  const reservations = useReservations()
  const rebookFrom = useRouterState({ select: (state) => state.location.state.rebookFrom })
  const now = container.now()

  const restaurant = catalog.data?.restaurants.find((r) => r.id === restaurantId)
  const memberReservations = reservations.data ?? []
  const original = reservationId ? memberReservations.find((r) => r.id === reservationId) : undefined
  const rebook = rebookFrom ? memberReservations.find((r) => r.id === rebookFrom) : undefined

  const [edited, setEdited] = useState<ReservationDraft | null>(null)
  const [step, setStep] = useState<ReserveStep>('details')
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [error, setError] = useState<ReservationErrorCode | null>(null)
  const [busy, setBusy] = useState(false)

  const status: ReserveStatus =
    catalog.isPending || reservations.isPending || preferencesQuery.isPending
      ? 'loading'
      : catalog.isError
        ? 'error'
        : !restaurant
          ? 'notFound'
          : reservationId && (!original || !isUpcoming(original, now))
            ? 'reservationNotFound'
            : 'ready'

  const initial = restaurant && status === 'ready' ? (original ? draftFromReservation(original) : defaultDraft(restaurant, preferences, now, rebook)) : null
  const draft = edited ?? initial
  const slots = restaurant && draft ? slotsFor(restaurant, draft.date, now, original) : []
  const closed = restaurant && draft ? DemoAvailability.isClosed(restaurant, draft.date) : false
  const stepIndex = reserveSteps.indexOf(step)

  const update = (change: Partial<ReservationDraft>) => {
    if (!draft) return
    setEdited({ ...draft, ...change })
    setError(null)
  }

  const goTo = (target: ReserveStep) => {
    setDirection(reserveSteps.indexOf(target) < stepIndex ? 'back' : 'forward')
    setStep(target)
    setError(null)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
  }

  const confirm = async () => {
    if (!restaurant || !draft || busy) return
    setBusy(true)
    setError(null)
    const check = (list: typeof memberReservations) => {
      const problem = ReservationValidator.validate(draft, { restaurant, now: container.now(), reservations: list, original })
      if (problem) throw new ReservationError(problem)
    }
    try {
      const saved = original
        ? await container.reservationsRepository.update(original.id, draft, check)
        : await container.reservationsRepository.create(draft, check)
      await invalidateReservations(queryClient)
      await navigate({ to: '/reservations/$reservationId/confirmation', params: { reservationId: saved.id }, replace: true })
    } catch (caught) {
      const code = caught instanceof ReservationError ? caught.code : 'generic'
      setBusy(false)
      setError(code)
      if (code === 'slotTaken') {
        setEdited({ ...draft, time: null })
        goTo('details')
        setError(code)
      }
    }
  }

  return {
    status,
    retry: () => void catalog.refetch(),
    restaurant,
    modifying: original !== undefined,
    draft,
    step,
    stepIndex,
    direction,
    error,
    busy,
    dates: DemoAvailability.bookableDates(now),
    slots,
    closed,
    noSlots: !closed && !slots.some((slot) => slot.available),
    largeParty: restaurant && draft ? isLargeParty(draft.partySize, restaurant) : false,
    notesTooLong: (draft?.notes.length ?? 0) > MAX_NOTES_LENGTH,
    setPartySize: (size: number) => restaurant && update({ partySize: clampPartySize(size, restaurant) }),
    setDate: (date: string) => {
      if (!restaurant || !draft) return
      setEdited(withDate(draft, date, slotsFor(restaurant, date, now, original)))
      setError(null)
    },
    setTime: (time: string) => update({ time }),
    setSeating: (seating: ReservationDraft['seating']) => update({ seating }),
    setOccasion: (occasion: ReservationDraft['occasion']) => update({ occasion }),
    toggleDietary: (dietary: ReservationDraft['dietary'][number]) =>
      draft &&
      update({ dietary: orderedDietary(draft.dietary.includes(dietary) ? draft.dietary.filter((d) => d !== dietary) : [...draft.dietary, dietary]) }),
    setNotes: (notes: string) => update({ notes }),
    goTo,
    next: () => {
      if (!draft) return
      if (step === 'details') {
        if (!draft.time) return setError('selectTime')
        goTo('preferences')
      } else if (step === 'preferences') {
        if (draft.notes.length > MAX_NOTES_LENGTH) return setError('notesTooLong')
        goTo('review')
      } else {
        void confirm()
      }
    },
  }
}

export type ReserveViewModel = ReturnType<typeof useReserveViewModel>
