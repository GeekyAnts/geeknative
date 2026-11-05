import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouteContext } from '@tanstack/react-router'
import { useState } from 'react'
import { initials } from '#/features/auth/Account'
import { sessionQuery, useAccount } from '#/features/auth/useSession'
import { groupReservations } from '#/features/reservations/Reservation'
import { useReservations } from '#/features/reservations/useReservations'
import { useSaved } from '#/features/saved/useSaved'
import { versionText } from '#/features/settings/useSettingsViewModel'
import { defaultPreferences } from './DiningPreferences'
import { usePreferences } from './usePreferences'

/** Member card, stats, the reminders switch and sign out. */
export function useProfileViewModel() {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const account = useAccount()
  const reservations = useReservations()
  const saved = useSaved()
  const { query: preferencesQuery, preferences, save } = usePreferences()
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const groups = groupReservations(reservations.data ?? [], container.now())

  const signOut = async () => {
    setConfirmingSignOut(false)
    await container.authRepository.signOut()
    queryClient.setQueryData(sessionQuery(container.authRepository).queryKey, null)
    for (const key of ['reservations', 'saved', 'preferences', 'explore']) queryClient.removeQueries({ queryKey: [key] })
    await navigate({ to: '/welcome', replace: true })
  }

  return {
    status:
      reservations.isPending || saved.query.isPending || preferencesQuery.isPending
        ? ('loading' as const)
        : reservations.isError || saved.query.isError || preferencesQuery.isError
          ? ('error' as const)
          : ('ready' as const),
    retry: () => {
      void reservations.refetch()
      void saved.query.refetch()
      void preferencesQuery.refetch()
    },
    account,
    initials: initials(account?.name ?? ''),
    stats: { upcoming: groups.upcoming.length, dined: groups.past.length, saved: saved.ids.length },
    reminders: preferences?.reminders ?? true,
    toggleReminders: () => {
      const current = preferences ?? defaultPreferences()
      void save({ ...current, reminders: !current.reminders })
    },
    confirmingSignOut,
    askSignOut: () => setConfirmingSignOut(true),
    keepSignedIn: () => setConfirmingSignOut(false),
    signOut: () => void signOut(),
    versionText: versionText(),
  }
}
