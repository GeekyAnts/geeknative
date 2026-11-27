import { queryOptions, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'
import type { NotificationsRepository } from '#/features/notifications/NotificationsRepository'
import { appearanceLabel, appearances, type Appearance } from './Appearance'
import type { SettingsRepository } from './SettingsRepository'

export const appearanceQuery = (repository: SettingsRepository) =>
  queryOptions({
    queryKey: ['settings', 'appearance'] as const,
    queryFn: () => repository.getAppearance(),
    staleTime: Infinity,
  })

/** Applies the appearance everywhere at once (through the shared query), then saves it. */
export async function selectAppearance(queryClient: QueryClient, repository: SettingsRepository, appearance: Appearance) {
  queryClient.setQueryData(appearanceQuery(repository).queryKey, appearance)
  await repository.setAppearance(appearance)
}

export const notificationsQuery = (repository: NotificationsRepository) =>
  queryOptions({
    queryKey: ['settings', 'notifications'] as const,
    queryFn: () => repository.isEnabled(),
    staleTime: Infinity,
  })

/** Applies the preference everywhere at once (through the shared query), then saves it. */
export async function selectNotifications(
  queryClient: QueryClient,
  repository: NotificationsRepository,
  enabled: boolean,
) {
  queryClient.setQueryData(notificationsQuery(repository).queryKey, enabled)
  await repository.setEnabled(enabled)
}

export const versionText = () =>
  strings.settingsAboutVersion({ version: AppIdentity.version, build: AppIdentity.build })

/** The current appearance. Used by the Settings screen and by AppearanceEffect. */
export function useAppearance() {
  const { container } = useRouteContext({ from: '__root__' })
  return useQuery(appearanceQuery(container.settingsRepository))
}

const subscribeToNothing = () => () => {}

/** False while the page is rendering on the server and hydrating, true afterwards. */
function useHydrated() {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false)
}

/** State and actions for the Settings screen. */
export function useSettingsViewModel() {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  const { data } = useAppearance()
  const notifications = useQuery(notificationsQuery(container.notificationsRepository))
  // The server has no localStorage, so it renders "system" and notifications off. Hydrating with the
  // stored value instead would leave the server's controls in the page, so wait until hydration is done.
  const hydrated = useHydrated()
  const appearance = hydrated ? (data ?? 'system') : 'system'
  const notificationsEnabled = hydrated ? (notifications.data ?? false) : false

  return {
    appearance,
    appearanceOptions: appearances.map((id) => ({ id, label: appearanceLabel(id) })),
    selectAppearance: (next: Appearance) => selectAppearance(queryClient, container.settingsRepository, next),
    notificationsEnabled,
    selectNotifications: (enabled: boolean) =>
      selectNotifications(queryClient, container.notificationsRepository, enabled),
    versionText: versionText(),
  }
}
