import type { SavedItem } from '#/features/catalog/types'
import type { SavedRepository } from './SavedRepository'
import { parseSaved, SAVED_STORAGE_KEY, toggleSaved } from './parseSaved'

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

/** Keeps saved items in localStorage. Without storage (SSR) it returns []. */
export class LocalStorageSavedRepository implements SavedRepository {
  private readonly storage: KeyValueStorage | undefined

  constructor(storage: KeyValueStorage | undefined) {
    this.storage = storage
  }

  async list(): Promise<SavedItem[]> {
    return parseSaved(this.storage?.getItem(SAVED_STORAGE_KEY))
  }

  async toggle(item: SavedItem): Promise<void> {
    const next = toggleSaved(await this.list(), item)
    this.storage?.setItem(SAVED_STORAGE_KEY, JSON.stringify(next))
  }
}
