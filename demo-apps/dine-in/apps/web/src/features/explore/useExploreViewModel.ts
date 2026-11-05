import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate, useRouteContext } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CollectionId, CuisineId } from '#/features/catalog/Catalog'
import { DemoAvailability } from '#/features/catalog/DemoAvailability'
import { useCatalog } from '#/features/catalog/useCatalog'
import { useSaved } from '#/features/saved/useSaved'
import {
  activeFilterCount,
  copyFilters,
  defaultFilters,
  exploreResults,
  neighbourhoodsOf,
  toggled,
  type ExploreFilters,
  type ExploreSort,
  type ViewMode,
} from './ExploreFilters'

export interface ExploreArrival {
  q?: string
  cuisine?: CuisineId
  collection?: CollectionId
}

interface ExploreSession {
  filters: ExploreFilters
  sort: ExploreSort
}

const SEARCH_DEBOUNCE_MS = 200
const sessionKey = ['explore', 'session'] as const
const viewModeKey = ['explore', 'viewMode'] as const

/** Filters as Discover hands them over: just the one it was opened with. */
export function filtersFromArrival(arrival: ExploreArrival): ExploreFilters | null {
  if (arrival.q === undefined && arrival.cuisine === undefined && arrival.collection === undefined) return null
  return {
    ...defaultFilters(),
    query: arrival.q ?? '',
    cuisines: arrival.cuisine ? new Set([arrival.cuisine]) : new Set(),
    collection: arrival.collection ?? null,
  }
}

/** Search, filters, sort and view mode for Explore. Filters and sort last for the session. */
export function useExploreViewModel(arrival: ExploreArrival) {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const catalog = useCatalog()
  const saved = useSaved()
  const now = container.now()

  const session = useQuery({
    queryKey: sessionKey,
    queryFn: (): ExploreSession => ({ filters: defaultFilters(), sort: 'popularity' }),
    initialData: (): ExploreSession => ({ filters: defaultFilters(), sort: 'popularity' }),
    staleTime: Infinity,
    gcTime: Infinity,
    structuralSharing: false,
  }).data
  const setSession = (update: (current: ExploreSession) => ExploreSession) =>
    queryClient.setQueryData<ExploreSession>(sessionKey, (current) => update(current ?? { filters: defaultFilters(), sort: 'popularity' }))
  const setFilters = (filters: ExploreFilters) => setSession((current) => ({ ...current, filters }))

  const viewMode = useQuery({
    queryKey: viewModeKey,
    queryFn: () => container.exploreRepository.getViewMode(),
    staleTime: Infinity,
  }).data ?? 'list'

  const [searchText, setSearchText] = useState(session.filters.query)
  const searchInput = useRef<HTMLInputElement>(null)

  // Arriving from Discover with q, cuisine or collection replaces the filters with just that one.
  useEffect(() => {
    const filters = filtersFromArrival(arrival)
    if (!filters) return
    setFilters(filters)
    setSearchText(filters.query)
    void navigate({ to: '/explore', search: {}, replace: true })
  }, [arrival.q, arrival.cuisine, arrival.collection])

  useEffect(() => {
    if (location.state.focusSearch) searchInput.current?.focus()
  }, [location.state.focusSearch])

  // Search filters as the member types, debounced.
  useEffect(() => {
    if (searchText === session.filters.query) return
    const timer = setTimeout(() => setSession((current) => ({ ...current, filters: { ...current.filters, query: searchText } })), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchText])

  const restaurants = catalog.data?.restaurants ?? []
  const { filters, sort } = session
  const results = useMemo(() => exploreResults(restaurants, filters, sort, now), [restaurants, filters, sort, now.getTime()])
  const filterCount = activeFilterCount(filters)

  // The sheet edits a draft; it applies only on "apply".
  const [draft, setDraft] = useState<ExploreFilters | null>(null)
  const draftCount = draft ? exploreResults(restaurants, draft, sort, now).length : 0

  const clearAll = () => {
    setFilters(defaultFilters())
    setSearchText('')
  }

  return {
    status: catalog.isPending ? ('loading' as const) : catalog.isError ? ('error' as const) : ('ready' as const),
    retry: () => void catalog.refetch(),
    cuisines: catalog.data?.cuisines ?? [],
    neighbourhoods: neighbourhoodsOf(restaurants),
    featured: restaurants.filter((r) => r.featured),
    showFeatured: filters.query.trim() === '' && filterCount === 0,
    results,
    resultsKey: `${filters.query}|${[...filters.cuisines]}|${[...filters.neighbourhoods]}|${[...filters.priceLevels]}|${filters.minRating}|${filters.availableToday}|${filters.collection}|${sort}`,
    filters,
    filterCount,
    sort,
    viewMode,
    searchText,
    searchInput,
    setSearchText,
    clearSearch: () => {
      setSearchText('')
      setSession((current) => ({ ...current, filters: { ...current.filters, query: '' } }))
      searchInput.current?.focus()
    },
    toggleCuisine: (cuisine: CuisineId) => setFilters({ ...filters, cuisines: toggled(filters.cuisines, cuisine) }),
    toggleAvailableToday: () => setFilters({ ...filters, availableToday: !filters.availableToday }),
    removeCollection: () => setFilters({ ...filters, collection: null }),
    clearAll,
    setSort: (next: ExploreSort) => setSession((current) => ({ ...current, sort: next })),
    toggleViewMode: () => {
      const next: ViewMode = viewMode === 'list' ? 'grid' : 'list'
      queryClient.setQueryData(viewModeKey, next)
      void container.exploreRepository.setViewMode(next)
    },
    availability: (id: string) => {
      const restaurant = restaurants.find((r) => r.id === id)
      return restaurant ? DemoAvailability.today(restaurant, now) : 'closed'
    },
    isSaved: saved.isSaved,
    toggleSaved: (id: string) => void saved.toggle(id),
    sheet: {
      open: draft !== null,
      draft,
      count: draftCount,
      show: () => setDraft(copyFilters(filters)),
      dismiss: () => setDraft(null),
      update: (next: ExploreFilters) => setDraft(next),
      clear: () => setDraft({ ...defaultFilters(), query: filters.query }),
      apply: () => {
        if (draft) setFilters(draft)
        setDraft(null)
      },
    },
  }
}

export type ExploreViewModel = ReturnType<typeof useExploreViewModel>
