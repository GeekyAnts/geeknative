import { itineraryDayCount } from '#/features/catalog/isoDate'
import type { BudgetBand, Destination } from '#/features/catalog/types'

export type BudgetBreakdown = {
  lodging: number
  food: number
  activities: number
  total: number
}

export function estimateBudget(
  destination: Destination,
  budgetBand: BudgetBand,
  days: number,
  travelers: number,
): BudgetBreakdown {
  const estimates = destination.budgetEstimates[budgetBand]
  const lodging = estimates.lodging * days
  const food = estimates.food * days * travelers
  const activities = estimates.activities * days * travelers
  return { lodging, food, activities, total: lodging + food + activities }
}

export function tripBudget(destination: Destination, trip: { startDate: string; endDate: string; budgetBand: BudgetBand; travelers: number }): BudgetBreakdown {
  return estimateBudget(destination, trip.budgetBand, itineraryDayCount(trip.startDate, trip.endDate), trip.travelers)
}
