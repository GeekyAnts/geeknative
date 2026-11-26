import { isBudgetBand, isCategoryId, type Profile } from '#/features/catalog/types'

export const PROFILE_STORAGE_KEY = 'profile.data'

export const defaultProfile = (): Profile => ({
  displayName: '',
  email: '',
  defaultTravelers: 2,
  budgetBand: 'mid',
  preferredCategories: [],
})

export function clampTravelers(value: number): number {
  if (!Number.isFinite(value)) return 2
  return Math.min(8, Math.max(1, Math.round(value)))
}

export function parseProfile(value: string | null | undefined): Profile {
  const defaults = defaultProfile()
  if (!value) return defaults
  try {
    const parsed: unknown = JSON.parse(value)
    if (typeof parsed !== 'object' || parsed === null) return defaults
    const data = parsed as Record<string, unknown>
    const preferred = Array.isArray(data.preferredCategories)
      ? data.preferredCategories.filter((entry): entry is string => typeof entry === 'string' && isCategoryId(entry))
      : defaults.preferredCategories
    return {
      displayName: typeof data.displayName === 'string' ? data.displayName : defaults.displayName,
      email: typeof data.email === 'string' ? data.email : defaults.email,
      defaultTravelers: clampTravelers(
        typeof data.defaultTravelers === 'number' ? data.defaultTravelers : defaults.defaultTravelers,
      ),
      budgetBand: isBudgetBand(data.budgetBand) ? data.budgetBand : defaults.budgetBand,
      preferredCategories: preferred,
    }
  } catch {
    return defaults
  }
}
