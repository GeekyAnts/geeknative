import type { SavedItem } from '#/features/catalog/types'

/** Bookmarked destinations and places. */
export interface SavedRepository {
  list(): Promise<SavedItem[]>
  toggle(item: SavedItem): Promise<void>
}
