import { strings } from '#/generated/strings'

/** The appearance setting. Stored as these exact values on every platform. */
export const appearances = ['system', 'light', 'dark'] as const
export type Appearance = (typeof appearances)[number]

/** Storage key, shared with the iOS and Android apps. */
export const APPEARANCE_STORAGE_KEY = 'settings.appearance'

/** Missing or unknown stored values count as "system". */
export function parseAppearance(value: string | null | undefined): Appearance {
  return appearances.find((appearance) => appearance === value) ?? 'system'
}

/** Whether to render dark, given the chosen appearance and the system setting. */
export function isDark(appearance: Appearance, systemIsDark: boolean) {
  return appearance === 'dark' || (appearance === 'system' && systemIsDark)
}

export function appearanceLabel(appearance: Appearance) {
  switch (appearance) {
    case 'system':
      return strings.settingsAppearanceSystem
    case 'light':
      return strings.settingsAppearanceLight
    case 'dark':
      return strings.settingsAppearanceDark
  }
}
