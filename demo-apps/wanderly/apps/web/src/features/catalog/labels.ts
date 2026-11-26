import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import type { BudgetBand, CategoryId, PlaceKind } from './types'

export function categoryLabel(category: CategoryId) {
  switch (category) {
    case 'beaches':
      return strings.categoryBeaches
    case 'mountains':
      return strings.categoryMountains
    case 'adventure':
      return strings.categoryAdventure
    case 'history':
      return strings.categoryHistory
    case 'food':
      return strings.categoryFood
  }
}

export const categoryIcon = {
  beaches: AppIcons.waves,
  mountains: AppIcons.mountain,
  adventure: AppIcons.sparkles,
  history: AppIcons.landmark,
  food: AppIcons.utensils,
} as const

export function kindLabel(kind: PlaceKind) {
  switch (kind) {
    case 'attraction':
      return strings.kindAttraction
    case 'hotel':
      return strings.kindHotel
    case 'restaurant':
      return strings.kindRestaurant
    case 'activity':
      return strings.kindActivity
  }
}

export function budgetLabel(band: BudgetBand) {
  switch (band) {
    case 'value':
      return strings.budgetValue
    case 'mid':
      return strings.budgetMid
    case 'luxury':
      return strings.budgetLuxury
  }
}
