import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'
import { categoryIds, type BudgetBand, type CategoryId, type Profile } from '#/features/catalog/types'
import { clampTravelers } from './parseProfile'
import { useProfile } from './useProfile'

export function displayedName(profile: Profile) {
  return profile.displayName.trim() || strings.profileDefaultName
}

export function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function versionText() {
  return strings.settingsAboutVersion({ version: AppIdentity.version, build: AppIdentity.build })
}

export function useProfileViewModel() {
  const { profile, save } = useProfile()

  const update = (patch: Partial<Profile>) => save({ ...profile, ...patch })

  return {
    profile,
    displayName: displayedName(profile),
    initials: initialsFor(displayedName(profile)),
    versionText: versionText(),
    categories: categoryIds,
    setName: (displayName: string) => update({ displayName }),
    setEmail: (email: string) => update({ email }),
    setTravelers: (value: number) => update({ defaultTravelers: clampTravelers(value) }),
    setBudgetBand: (budgetBand: BudgetBand) => update({ budgetBand }),
    toggleCategory: (category: CategoryId) => {
      const preferredCategories = profile.preferredCategories.includes(category)
        ? profile.preferredCategories.filter((entry) => entry !== category)
        : [...profile.preferredCategories, category]
      return update({ preferredCategories })
    },
  }
}
