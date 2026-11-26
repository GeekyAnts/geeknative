import type { SavedItem } from '#/features/catalog/types'
import type { SavedRepository } from './SavedRepository'
import { toggleSaved } from './parseSaved'

/** In-memory saved items for tests. */
export class InMemorySavedRepository implements SavedRepository {
  private items: SavedItem[]

  constructor(items: SavedItem[] = []) {
    this.items = items
  }

  async list(): Promise<SavedItem[]> {
    return this.items
  }

  async toggle(item: SavedItem): Promise<void> {
    this.items = toggleSaved(this.items, item)
  }
}
