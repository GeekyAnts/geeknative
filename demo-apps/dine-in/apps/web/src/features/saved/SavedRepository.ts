/** The signed-in member's favourite restaurants, most recently saved first. */
export interface SavedRepository {
  ids(): Promise<string[]>
  /** Returns the new saved state. */
  toggle(restaurantId: string): Promise<boolean>
  isSaved(restaurantId: string): Promise<boolean>
}

export const savedStorageKey = (email: string) => `saved.${email.toLowerCase()}`
