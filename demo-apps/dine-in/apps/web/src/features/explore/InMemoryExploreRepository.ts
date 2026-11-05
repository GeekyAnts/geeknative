import type { ViewMode } from './ExploreFilters'
import type { ExploreRepository } from './ExploreRepository'

/** Keeps the view mode in memory only, for tests and previews. */
export class InMemoryExploreRepository implements ExploreRepository {
  private mode: ViewMode

  constructor(mode: ViewMode = 'list') {
    this.mode = mode
  }

  async getViewMode(): Promise<ViewMode> {
    return this.mode
  }

  async setViewMode(mode: ViewMode): Promise<void> {
    this.mode = mode
  }
}
