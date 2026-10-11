import { queryOptions, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'
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

export const versionText = () =>
  strings.settingsAboutVersion({ version: AppIdentity.version, build: AppIdentity.build })

/** The current appearance. Used by the Settings screen and by AppearanceEffect. */
export function useAppearance() {
  const { container } = useRouteContext({ from: '__root__' })
  return useQuery(appearanceQuery(container.settingsRepository))
}

/** State and actions for the Settings screen. */
export function useSettingsViewModel() {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  const { data: appearance = 'system' } = useAppearance()

  return {
    appearance,
    appearanceOptions: appearances.map((id) => ({ id, label: appearanceLabel(id) })),
    selectAppearance: (next: Appearance) => selectAppearance(queryClient, container.settingsRepository, next),
    versionText: versionText(),
  }
}
