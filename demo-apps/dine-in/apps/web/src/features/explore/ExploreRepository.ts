import type { ViewMode } from './ExploreFilters'

/** Explore's grid/list choice, shared by all members on the device. */
export interface ExploreRepository {
  getViewMode(): Promise<ViewMode>
  setViewMode(mode: ViewMode): Promise<void>
}
