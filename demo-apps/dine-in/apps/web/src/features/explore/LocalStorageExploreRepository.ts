import type { KeyValueStorage } from '#/core/KeyValueStorage'
import { VIEW_MODE_STORAGE_KEY, parseViewMode, type ViewMode } from './ExploreFilters'
import type { ExploreRepository } from './ExploreRepository'

/** The view mode under `explore.viewMode` as `list` (default) or `grid`. */
export class LocalStorageExploreRepository implements ExploreRepository {
  private readonly storage: KeyValueStorage | undefined

  constructor(storage: KeyValueStorage | undefined) {
    this.storage = storage
  }

  async getViewMode(): Promise<ViewMode> {
    return parseViewMode(this.storage?.getItem(VIEW_MODE_STORAGE_KEY))
  }

  async setViewMode(mode: ViewMode): Promise<void> {
    this.storage?.setItem(VIEW_MODE_STORAGE_KEY, mode)
  }
}
